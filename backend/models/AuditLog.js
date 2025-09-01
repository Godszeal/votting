const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILURE',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET',
      'VOTE_CAST',
      'ELECTION_CREATED',
      'ELECTION_UPDATED',
      'ELECTION_DELETED',
      'ELECTION_ENDED',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'ADMIN_ACTION'
    ]
  },
  details: {
    type: Object,
    default: {}
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes for faster queries
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
