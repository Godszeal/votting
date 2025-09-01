const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../utils/security');

// Audit middleware for critical actions
exports.audit = (action) => {
  return async (req, res, next) => {
    try {
      // Get user ID from request (if authenticated)
      const userId = req.user ? req.user.id : null;
      
      // Create audit log
      const auditLog = createAuditLog(
        userId,
        action,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          body: req.body
        }
      );
      
      // Save audit log to database
      await AuditLog.create(auditLog);
      
      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next();
    }
  };
};

// Get audit logs with filtering
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const { userId, action, startDate, endDate, page = 1, limit = 20 } = req.query;
  
  const query = {};
  
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const logs = await AuditLog.find(query)
    .sort('-timestamp')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
  const total = await AuditLog.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// Export audit logs
exports.exportAuditLogs = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const query = {};
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const logs = await AuditLog.find(query).sort('-timestamp');
  
  // Convert to CSV
  const csv = logs.map(log => 
    `${log.timestamp.toISOString()},${log.userId || 'N/A'},${log.action},${log.ip},${log.userAgent}`
  ).join('\n');
  
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename=audit-logs.csv');
  res.send(`timestamp,userId,action,ip,userAgent\n${csv}`);
});
