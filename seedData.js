const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Scenario model
const Scenario = require('./models/Scenario');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyber-siege', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

// Read scenario files from directory
const readScenarioFiles = (dir) => {
  const scenarios = [];
  
  // Read red-team scenarios
  const redTeamDir = path.join(dir, 'red-team');
  if (fs.existsSync(redTeamDir)) {
    fs.readdirSync(redTeamDir).forEach(file => {
      if (file.endsWith('.json')) {
        const scenarioData = JSON.parse(fs.readFileSync(path.join(redTeamDir, file), 'utf8'));
        scenarios.push(scenarioData);
      }
    });
  }
  
  // Read blue-team scenarios
  const blueTeamDir = path.join(dir, 'blue-team');
  if (fs.existsSync(blueTeamDir)) {
    fs.readdirSync(blueTeamDir).forEach(file => {
      if (file.endsWith('.json')) {
        const scenarioData = JSON.parse(fs.readFileSync(path.join(blueTeamDir, file), 'utf8'));
        scenarios.push(scenarioData);
      }
    });
  }
  
  return scenarios;
};

// Seed database with scenarios
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing scenarios
    await Scenario.deleteMany({});
    console.log('Cleared existing scenarios');
    
    // Read scenario files
    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    const scenarios = readScenarioFiles(scenariosDir);
    
    if (scenarios.length === 0) {
      console.log('No scenario files found');
      process.exit(0);
    }
    
    // Insert scenarios into database
    await Scenario.insertMany(scenarios);
    console.log(`Seeded database with ${scenarios.length} scenarios`);
    
    // Disconnect from database
    mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();