const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Game = require('../models/Game');

// @route   GET api/user/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { username, avatar, bio } = req.body;
  
  // Build profile object
  const profileFields = {};
  if (username) profileFields.username = username;
  if (avatar) profileFields.avatar = avatar;
  if (bio) profileFields.bio = bio;
  
  try {
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/stats
// @desc    Get user's game statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get completed games
    const completedGames = await Game.find({
      player: req.user.id,
      status: 'completed'
    }).populate('scenario', 'name type difficulty');
    
    // Calculate statistics
    const stats = {
      totalGamesPlayed: completedGames.length,
      redTeamMissions: completedGames.filter(game => game.teamType === 'red').length,
      blueTeamMissions: completedGames.filter(game => game.teamType === 'blue').length,
      successRate: completedGames.filter(game => game.result === 'success').length / completedGames.length || 0,
      averageCompletionTime: completedGames.reduce((acc, game) => acc + (game.endTime - game.startTime), 0) / completedGames.length || 0,
      certifications: [],
      skillLevel: calculateSkillLevel(completedGames)
    };
    
    // Get user certifications
    const user = await User.findById(req.user.id).select('certifications');
    stats.certifications = user.certifications || [];
    
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/certifications
// @desc    Get user's earned certifications
// @access  Private
router.get('/certifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('certifications');
    res.json(user.certifications || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper function to calculate skill level based on completed games
function calculateSkillLevel(games) {
  if (games.length === 0) return 'Beginner';
  
  const successfulGames = games.filter(game => game.result === 'success');
  const successRate = successfulGames.length / games.length;
  const averageDifficulty = successfulGames.reduce((acc, game) => acc + game.scenario.difficulty, 0) / successfulGames.length || 0;
  
  if (successRate > 0.8 && averageDifficulty > 4) return 'Expert';
  if (successRate > 0.6 && averageDifficulty > 3) return 'Advanced';
  if (successRate > 0.4 && averageDifficulty > 2) return 'Intermediate';
  return 'Beginner';
}

module.exports = router;