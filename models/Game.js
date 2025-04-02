const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  scenario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameMode: {
    type: String,
    enum: ['training', 'competitive'],
    required: true
  },
  teamType: {
    type: String,
    enum: ['red', 'blue'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  result: {
    type: String,
    enum: ['success', 'failure', 'incomplete'],
    default: 'incomplete'
  },
  score: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  lastAction: {
    type: Date,
    default: Date.now
  },
  actions: [{
    actionType: {
      type: String,
      required: true
    },
    target: {
      type: String
    },
    parameters: {
      type: Object
    },
    result: {
      type: Object
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  gameState: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Game', GameSchema);