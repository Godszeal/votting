const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
const Election = require('../models/Election');
const jwtConfig = require('../config/jwt'); // Import our verified JWT config

// @route   POST api/admin/elections
// @desc    Create new election
router.post('/elections', admin, async (req, res) => {
  const { title, description, candidates, endDate } = req.body;
  
  try {
    const election = new Election({
      title,
      description,
      candidates: candidates.map(name => ({ name })),
      endDate: new Date(endDate)
    });
    
    await election.save();
    res.json(election);
  } catch (err) {
    console.error('Create Election Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/elections/:id
// @desc    Update election
router.put('/elections/:id', admin, async (req, res) => {
  const { title, description, candidates, endDate, isActive } = req.body;
  
  try {
    let election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ msg: 'Election not found' });
    
    // Prevent candidate changes after election starts
    if (election.startDate < new Date() && candidates) {
      return res.status(400).json({ 
        msg: 'Cannot modify candidates after election starts' 
      });
    }
    
    election.title = title || election.title;
    election.description = description || election.description;
    election.endDate = endDate ? new Date(endDate) : election.endDate;
    election.isActive = isActive !== undefined ? isActive : election.isActive;
    
    if (candidates) {
      election.candidates = candidates.map(name => ({
        name,
        votes: election.candidates.find(c => c.name === name)?.votes || 0
      }));
    }
    
    await election.save();
    res.json(election);
  } catch (err) {
    console.error('Update Election Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/elections/:id
// @desc    Delete election
router.delete('/elections/:id', admin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ msg: 'Election not found' });
    
    await election.remove();
    res.json({ msg: 'Election removed' });
  } catch (err) {
    console.error('Delete Election Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/elections
// @desc    Get all elections
router.get('/elections', admin, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    console.error('Get Elections Error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
