/**
 * Socket.io handler for real-time game communication
 * Manages multiplayer functionality for competitive gameplay
 */

module.exports = function(io) {
  // Game rooms for multiplayer sessions
  const gameRooms = {};
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join a game room
    socket.on('joinGame', ({ gameId, userId, username, teamType }) => {
      console.log(`User ${username} joining game ${gameId} as ${teamType}`);
      
      // Create room if it doesn't exist
      if (!gameRooms[gameId]) {
        gameRooms[gameId] = {
          id: gameId,
          players: {},
          status: 'waiting',
          startTime: null,
          lastUpdate: Date.now()
        };
      }
      
      // Add player to room
      gameRooms[gameId].players[userId] = {
        id: userId,
        username,
        teamType,
        socketId: socket.id,
        status: 'ready',
        joinedAt: Date.now()
      };
      
      // Join socket room
      socket.join(gameId);
      
      // Notify room of new player
      io.to(gameId).emit('playerJoined', {
        gameId,
        player: {
          id: userId,
          username,
          teamType
        }
      });
      
      // Send current game state to the new player
      socket.emit('gameState', gameRooms[gameId]);
      
      // Check if game can start (at least one player on each team)
      checkGameReady(gameId);
    });
    
    // Player performs an action in the game
    socket.on('gameAction', ({ gameId, userId, action, target, parameters }) => {
      if (!gameRooms[gameId]) return;
      
      console.log(`Game action in ${gameId}: ${action} by ${userId}`);
      
      // Process the action based on game rules
      const result = processGameAction(gameId, userId, action, target, parameters);
      
      // Update game state
      gameRooms[gameId].lastUpdate = Date.now();
      
      // Broadcast the action and result to all players in the room
      io.to(gameId).emit('actionResult', {
        gameId,
        userId,
        action,
        target,
        parameters,
        result,
        timestamp: Date.now()
      });
      
      // Check if the game is over
      checkGameOver(gameId);
    });
    
    // Player sends a message in game chat
    socket.on('gameChat', ({ gameId, userId, username, message, teamOnly }) => {
      if (!gameRooms[gameId]) return;
      
      const player = gameRooms[gameId].players[userId];
      if (!player) return;
      
      const chatMessage = {
        userId,
        username,
        message,
        teamType: player.teamType,
        timestamp: Date.now()
      };
      
      if (teamOnly) {
        // Send only to players on the same team
        Object.values(gameRooms[gameId].players).forEach(p => {
          if (p.teamType === player.teamType) {
            io.to(p.socketId).emit('chatMessage', chatMessage);
          }
        });
      } else {
        // Send to all players in the game
        io.to(gameId).emit('chatMessage', chatMessage);
      }
    });
    
    // Player disconnects
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Find and remove player from any game rooms
      Object.keys(gameRooms).forEach(gameId => {
        const room = gameRooms[gameId];
        const userId = Object.keys(room.players).find(
          id => room.players[id].socketId === socket.id
        );
        
        if (userId) {
          const player = room.players[userId];
          console.log(`Player ${player.username} disconnected from game ${gameId}`);
          
          // Remove player from room
          delete room.players[userId];
          
          // Notify other players
          io.to(gameId).emit('playerLeft', {
            gameId,
            userId,
            username: player.username
          });
          
          // If room is empty, remove it
          if (Object.keys(room.players).length === 0) {
            delete gameRooms[gameId];
            console.log(`Game room ${gameId} removed`);
          } else {
            // Check if game should end due to player leaving
            checkGameOver(gameId);
          }
        }
      });
    });
  });
  
  // Helper function to check if a game is ready to start
  function checkGameReady(gameId) {
    const room = gameRooms[gameId];
    if (!room) return;
    
    const players = Object.values(room.players);
    const redTeamPlayers = players.filter(p => p.teamType === 'red');
    const blueTeamPlayers = players.filter(p => p.teamType === 'blue');
    
    // Game can start if there's at least one player on each team
    if (redTeamPlayers.length > 0 && blueTeamPlayers.length > 0 && room.status === 'waiting') {
      room.status = 'active';
      room.startTime = Date.now();
      
      // Notify all players that the game is starting
      io.to(gameId).emit('gameStarted', {
        gameId,
        startTime: room.startTime,
        players: players.map(p => ({
          id: p.id,
          username: p.username,
          teamType: p.teamType
        }))
      });
      
      console.log(`Game ${gameId} started with ${players.length} players`);
    }
  }
  
  // Helper function to process a game action
  function processGameAction(gameId, userId, action, target, parameters) {
    // This would contain the game logic for processing different actions
    // For now, we'll return a simplified result
    const result = {
      success: Math.random() > 0.3, // 70% chance of success for demo purposes
      effects: []
    };
    
    // Add some sample effects based on the action type
    switch (action) {
      case 'scan':
        result.effects.push({
          type: 'discovery',
          target,
          details: 'Network scan completed',
          discoveredItems: ['server1', 'server2', 'firewall']
        });
        break;
      case 'exploit':
        if (result.success) {
          result.effects.push({
            type: 'compromise',
            target,
            details: 'Vulnerability successfully exploited'
          });
        } else {
          result.effects.push({
            type: 'alert',
            target,
            details: 'Exploit attempt detected'
          });
        }
        break;
      case 'defend':
        result.effects.push({
          type: 'protection',
          target,
          details: 'Defense mechanism deployed'
        });
        break;
      default:
        result.effects.push({
          type: 'action',
          target,
          details: `Action ${action} performed`
        });
    }
    
    return result;
  }
  
  // Helper function to check if a game is over
  function checkGameOver(gameId) {
    const room = gameRooms[gameId];
    if (!room || room.status !== 'active') return;
    
    // For demo purposes, we'll use a simple condition
    // In a real game, this would check victory conditions based on objectives
    const players = Object.values(room.players);
    const redTeamPlayers = players.filter(p => p.teamType === 'red');
    const blueTeamPlayers = players.filter(p => p.teamType === 'blue');
    
    // Game ends if one team has no players
    if (redTeamPlayers.length === 0 || blueTeamPlayers.length === 0) {
      const winningTeam = redTeamPlayers.length === 0 ? 'blue' : 'red';
      
      room.status = 'completed';
      room.endTime = Date.now();
      room.winner = winningTeam;
      
      // Notify all players that the game is over
      io.to(gameId).emit('gameOver', {
        gameId,
        winner: winningTeam,
        reason: `${winningTeam === 'red' ? 'Red' : 'Blue'} team wins (other team left)`,
        duration: room.endTime - room.startTime
      });
      
      console.log(`Game ${gameId} ended. Winner: ${winningTeam}`);
      
      // Remove the room after a delay
      setTimeout(() => {
        delete gameRooms[gameId];
        console.log(`Game room ${gameId} removed after completion`);
      }, 60000); // Keep room for 1 minute for players to see results
    }
  }
};