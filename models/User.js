const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  bio: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  experience: {
    redTeam: {
      type: Number,
      default: 0
    },
    blueTeam: {
      type: Number,
      default: 0
    }
  },
  level: {
    type: Number,
    default: 1
  },
  certifications: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['red', 'blue'],
      required: true
    },
    dateEarned: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String
    }
  }],
  completedMissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);