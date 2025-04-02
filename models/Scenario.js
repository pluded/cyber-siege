const mongoose = require('mongoose');

const ScenarioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['training', 'competitive'],
    required: true
  },
  category: {
    type: String,
    enum: ['red-team', 'blue-team', 'mixed'],
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  objectives: [{
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['primary', 'secondary', 'bonus'],
      default: 'primary'
    },
    points: {
      type: Number,
      default: 100
    },
    completionCriteria: {
      type: Object,
      required: true
    }
  }],
  assets: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      default: 1
    },
    vulnerabilities: [{
      type: String
    }],
    properties: {
      type: Object
    }
  }],
  initialState: {
    type: Object,
    required: true
  },
  timeLimit: {
    type: Number, // in minutes
    default: 60
  },
  requiredSkills: [{
    type: String
  }],
  rewards: {
    experience: {
      type: Number,
      default: 100
    },
    certification: {
      type: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scenario', ScenarioSchema);