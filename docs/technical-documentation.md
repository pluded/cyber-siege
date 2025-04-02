# Cyber Siege - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Components](#backend-components)
5. [Frontend Components](#frontend-components)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Socket.IO Events](#socketio-events)
9. [Game Engine](#game-engine)
10. [Development Guidelines](#development-guidelines)

---

## Architecture Overview

Cyber Siege follows a client-server architecture with a React frontend and Node.js backend. The application uses MongoDB for data persistence and Socket.IO for real-time communication between clients and the server.

### High-Level Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  React      │◄────►│  Node.js    │◄────►│  MongoDB    │
│  Frontend   │      │  Backend    │      │  Database   │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
                           ▲
                           │
                           ▼
                     ┌─────────────┐
                     │             │
                     │  Game       │
                     │  Engine     │
                     │             │
                     └─────────────┘
```

### Communication Flow

1. Client-side React application communicates with the Node.js backend via RESTful API calls and Socket.IO connections
2. Backend processes requests, interacts with the database, and manages game state
3. Game Engine handles simulation logic, scenario progression, and event generation
4. Real-time updates are pushed to clients via Socket.IO
5. Database stores persistent data including user accounts, game scenarios, and match history

---

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time bidirectional event-based communication
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing

### Frontend
- **React**: JavaScript library for building user interfaces
- **Vite**: Build tool and development server
- **Socket.IO Client**: Client-side Socket.IO implementation
- **React Router**: Navigation and routing
- **State Management**: (Redux or Context API, based on implementation)

### Development Tools
- **nodemon**: Auto-restart server during development
- **concurrently**: Run multiple commands concurrently

---

## Project Structure

```
/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   ├── App.jsx         # Main application component
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
│
├── middleware/             # Express middleware
│   └── auth.js             # Authentication middleware
│
├── models/                 # Mongoose data models
│   ├── Game.js             # Game session model
│   ├── Scenario.js         # Game scenario model
│   └── User.js             # User account model
│
├── routes/                 # API routes
│   ├── auth.js             # Authentication routes
│   ├── game.js             # Game-related routes
│   └── user.js             # User management routes
│
├── socket/                 # Socket.IO handlers
│   └── gameSocket.js       # Game-related socket events
│
├── docs/                   # Documentation
│
├── .env                    # Environment variables
├── package.json            # Backend dependencies
├── server.js               # Main server entry point
└── install-and-start.ps1   # Installation script
```

---

## Backend Components

### Server (server.js)

The main entry point for the application. It initializes Express, connects to MongoDB, sets up middleware, and starts the HTTP server.

Key responsibilities:
- Configure Express application
- Establish database connection
- Set up middleware (CORS, body parsing, etc.)
- Initialize Socket.IO
- Mount API routes
- Start the HTTP server

### Middleware (middleware/)

Contains Express middleware functions:

#### Authentication Middleware (auth.js)

Handles JWT verification and user authentication for protected routes.

```javascript
// Example usage in routes
router.get('/profile', auth, userController.getProfile);
```

### Models (models/)

Mongoose schemas and models for database interaction:

#### User Model (User.js)

Represents user accounts with authentication and profile information.

Key fields:
- Username
- Email
- Password (hashed)
- Role (player, instructor, admin)
- Profile information
- Progress tracking

#### Scenario Model (Scenario.js)

Defines game scenarios including objectives, assets, and progression logic.

Key fields:
- Name and description
- Difficulty level
- Objectives for red and blue teams
- Assets and their properties
- Phases and progression rules

#### Game Model (Game.js)

Represents active game sessions.

Key fields:
- Associated scenario
- Participating users
- Current game state
- Events and actions log
- Start and end times

### Routes (routes/)

API endpoints organized by functionality:

#### Authentication Routes (auth.js)

Handles user registration, login, and token management.

Endpoints:
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user and issue token
- `GET /api/auth/user` - Get current user information

#### User Routes (user.js)

Manages user profiles and account settings.

Endpoints:
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/progress` - Get user progress

#### Game Routes (game.js)

Handles game session management and scenario access.

Endpoints:
- `GET /api/games/scenarios` - List available scenarios
- `POST /api/games/start` - Start new game session
- `GET /api/games/:id` - Get game session details
- `POST /api/games/:id/action` - Submit game action

### Socket Handlers (socket/)

#### Game Socket (gameSocket.js)

Manages real-time communication for game sessions.

Key events:
- `join_game` - Connect user to game session
- `game_action` - Process user action in game
- `game_update` - Broadcast game state updates
- `chat_message` - Handle in-game chat

---

## Frontend Components

### Main Structure

- **App.jsx**: Main application component with routing
- **main.jsx**: Entry point that renders the App component

### Components (components/)

Reusable UI elements:

- **Authentication**: Login and registration forms
- **Dashboard**: User dashboard and navigation
- **Game Interface**: Terminal, network map, tool panels
- **Scenario Selection**: Mission browsing and selection
- **User Profile**: Profile management and progress display

### Pages (pages/)

Full page components:

- **Home**: Landing page and introduction
- **Login/Register**: Authentication pages
- **Dashboard**: Main user hub
- **Training**: Training mission interface
- **Competitive**: Competitive match interface
- **Profile**: User profile and settings

### State Management (store/)

Manages application state:

- **Authentication State**: User login status and information
- **Game State**: Current game session data
- **UI State**: Interface configuration and preferences

---

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String, // Hashed
  role: String, // 'player', 'instructor', 'admin'
  profile: {
    displayName: String,
    avatar: String,
    bio: String
  },
  progress: {
    level: Number,
    experience: Number,
    completedMissions: [ObjectId],
    skills: {
      redTeam: {
        // Skill levels for various red team abilities
      },
      blueTeam: {
        // Skill levels for various blue team abilities
      }
    },
    certifications: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Scenarios Collection

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  difficulty: String, // 'beginner', 'intermediate', 'advanced', 'expert'
  type: String, // 'training', 'competitive'
  redTeamObjectives: [{
    id: String,
    description: String,
    points: Number,
    completionCriteria: Object
  }],
  blueTeamObjectives: [{
    id: String,
    description: String,
    points: Number,
    completionCriteria: Object
  }],
  assets: [{
    id: String,
    name: String,
    type: String,
    value: Number,
    vulnerabilities: [Object],
    defenses: [Object]
  }],
  phases: [{
    id: String,
    name: String,
    duration: Number,
    events: [Object],
    triggers: [Object]
  }],
  createdBy: ObjectId, // Reference to User
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Games Collection

```javascript
{
  _id: ObjectId,
  scenario: ObjectId, // Reference to Scenario
  status: String, // 'pending', 'active', 'completed', 'aborted'
  players: [{
    user: ObjectId, // Reference to User
    team: String, // 'red', 'blue'
    role: String,
    score: Number,
    actions: [{
      type: String,
      target: String,
      timestamp: Date,
      result: Object
    }]
  }],
  currentPhase: String,
  phaseStartTime: Date,
  gameState: {
    // Current state of all game elements
    assets: [Object],
    events: [Object],
    scores: {
      redTeam: Number,
      blueTeam: Number
    }
  },
  chatLog: [{
    user: ObjectId,
    message: String,
    team: String, // 'red', 'blue', 'all'
    timestamp: Date
  }],
  startTime: Date,
  endTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Reference

### Authentication API

#### Register User

```
POST /api/auth/register
```

Request Body:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### Login User

```
POST /api/auth/login
```

Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

### User API

#### Get User Profile

```
GET /api/users/profile
```

Headers:
```
Authorization: Bearer JWT_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "profile": {
      "displayName": "string",
      "avatar": "string",
      "bio": "string"
    },
    "progress": {
      "level": 0,
      "experience": 0,
      "skills": {}
    }
  }
}
```

### Game API

#### List Scenarios

```
GET /api/games/scenarios
```

Headers:
```
Authorization: Bearer JWT_TOKEN
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "difficulty": "string",
      "type": "string"
    }
  ]
}
```

#### Start Game Session

```
POST /api/games/start
```

Headers:
```
Authorization: Bearer JWT_TOKEN
```

Request Body:
```json
{
  "scenarioId": "string",
  "team": "string",
  "role": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "gameId": "string",
    "scenario": {
      "_id": "string",
      "name": "string"
    },
    "status": "string"
  }
}
```

---

## Socket.IO Events

### Client to Server Events

#### Join Game

```javascript
socket.emit('join_game', { gameId: 'string', token: 'JWT_TOKEN' });
```

#### Submit Game Action

```javascript
socket.emit('game_action', {
  gameId: 'string',
  action: {
    type: 'string',
    target: 'string',
    params: {}
  }
});
```

#### Send Chat Message

```javascript
socket.emit('chat_message', {
  gameId: 'string',
  message: 'string',
  team: 'string' // 'red', 'blue', or 'all'
});
```

### Server to Client Events

#### Game State Update

```javascript
socket.on('game_update', (data) => {
  // data contains the updated game state
  console.log(data);
});
```

#### Action Result

```javascript
socket.on('action_result', (data) => {
  // data contains the result of a submitted action
  console.log(data);
});
```

#### Chat Message

```javascript
socket.on('chat_message', (data) => {
  // data contains incoming chat message
  console.log(data);
});
```

#### Game Event

```javascript
socket.on('game_event', (data) => {
  // data contains information about game events
  console.log(data);
});
```

---

## Game Engine

The Game Engine is responsible for simulating the cybersecurity environment and processing player actions.

### Core Components

#### Scenario Manager

Loads and initializes game scenarios, manages progression through phases, and generates events.

#### Action Processor

Validates and executes player actions, determining outcomes based on game state and randomization factors.

#### Asset Manager

Tracks the state of in-game assets, including their security status, value, and accessibility.

#### Event Generator

Creates dynamic events during gameplay to challenge players and create realistic scenarios.

### Simulation Logic

#### Action Resolution

When a player submits an action:

1. Validate action against current game state and player permissions
2. Calculate success probability based on player skills and target defenses
3. Determine outcome using probabilistic models
4. Update game state based on action results
5. Generate appropriate feedback and notifications

#### Scoring System

Points are awarded based on:

- Objective completion
- Successful attacks or defenses
- Efficiency and stealth
- Time to completion

---

## Development Guidelines

### Coding Standards

- Use ES6+ JavaScript features
- Follow consistent naming conventions
- Document functions and complex logic
- Write modular, reusable code
- Implement proper error handling

### Git Workflow

1. Create feature branches from `develop`
2. Submit pull requests for code review
3. Merge approved changes into `develop`
4. Release from `develop` to `main`

### Testing

- Write unit tests for critical components
- Perform integration testing for API endpoints
- Test real-time functionality with Socket.IO
- Conduct user acceptance testing for new features

### Documentation

- Update technical documentation when making significant changes
- Document API endpoints and Socket.IO events
- Maintain up-to-date database schema documentation
- Include comments for complex algorithms and game logic

---

This technical documentation provides an overview of the Cyber Siege architecture and components. Developers should refer to the codebase for detailed implementation details and consult with the development team for any questions not covered in this document.