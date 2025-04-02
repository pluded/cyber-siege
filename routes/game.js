const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Game = require('../models/Game');
const Scenario = require('../models/Scenario');

// @route   GET api/game/scenarios
// @desc    Get all available game scenarios
// @access  Private
router.get('/scenarios', auth, async (req, res) => {
  try {
    console.log(`User ${req.user.id} retrieving all scenarios`);
    
    const scenarios = await Scenario.find().sort({ difficulty: 1 });
    
    console.log(`Successfully retrieved ${scenarios.length} scenarios`);
    res.json(scenarios);
  } catch (err) {
    console.error(`Error retrieving scenarios:`, err);
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// @route   GET api/game/scenarios/:id
// @desc    Get scenario by ID
// @access  Private
router.get('/scenarios/:id', auth, async (req, res) => {
  try {
    console.log(`Attempting to fetch scenario with ID: ${req.params.id}`);
    
    // Validate if the ID is in a valid format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid scenario ID format' });
    }
    
    const scenario = await Scenario.findById(req.params.id);
    
    if (!scenario) {
      console.log(`Scenario not found with ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'Scenario not found' });
    }
    
    console.log(`Successfully retrieved scenario ${req.params.id}`);
    res.json(scenario);
  } catch (err) {
    console.error(`Error fetching scenario ${req.params.id}:`, err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Scenario not found' });
    }
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// @route   POST api/game/start
// @desc    Start a new game session
// @access  Private
router.post('/start', auth, async (req, res) => {
  const { scenarioId, gameMode, teamType } = req.body;
  
  try {
    console.log(`User ${req.user.id} attempting to start a new game with scenario ${scenarioId}`);
    
    // Validate required fields
    if (!scenarioId || !gameMode || !teamType) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }
    
    // Validate if the scenario ID is in a valid format
    if (!scenarioId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid scenario ID format' });
    }
    
    // Verify scenario exists
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      console.log(`Scenario not found with ID: ${scenarioId}`);
      return res.status(404).json({ msg: 'Scenario not found' });
    }
    
    // Create new game session
    const newGame = new Game({
      scenario: scenarioId,
      player: req.user.id,
      gameMode,
      teamType,
      status: 'active',
      startTime: Date.now(),
      gameState: scenario.initialState
    });
    
    console.log(`Saving new game for user ${req.user.id} with scenario ${scenarioId}`);
    const game = await newGame.save();
    console.log(`Game created successfully with ID: ${game._id}`);
    res.json(game);
  } catch (err) {
    console.error(`Error starting new game:`, err);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// @route   PUT api/game/:id/action
// @desc    Perform an action in the game
// @access  Private
router.put('/:id/action', auth, async (req, res) => {
  const { action, target, parameters } = req.body;
  
  try {
    console.log(`User ${req.user.id} attempting to perform action ${action} on game ${req.params.id}`);
    
    // Validate required fields
    if (!action) {
      return res.status(400).json({ msg: 'Action is required' });
    }
    
    // Validate if the ID is in a valid format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid game ID format' });
    }
    
    // Find game session
    let game = await Game.findById(req.params.id);
    
    if (!game) {
      console.log(`Game not found with ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'Game session not found' });
    }
    
    // Verify user owns this game session
    if (game.player.toString() !== req.user.id) {
      console.log(`User ${req.user.id} not authorized to access game ${req.params.id}`);
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Process game action (this would be handled by game engine logic)
    // For now, just record the action
    game.actions.push({
      actionType: action,
      target,
      parameters,
      timestamp: Date.now()
    });
    
    // Update game state based on action (simplified)
    // In a real implementation, this would use the game engine to calculate the new state
    game.lastAction = Date.now();
    
    console.log(`Saving game action for game ${req.params.id}`);
    await game.save();
    console.log(`Game action saved successfully for game ${req.params.id}`);
    res.json(game);
  } catch (err) {
    console.error(`Error performing action on game ${req.params.id}:`, err);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game session not found' });
    }
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// @route   GET api/game/active
// @desc    Get user's active games
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    console.log(`User ${req.user.id} retrieving active games`);
    
    const games = await Game.find({ 
      player: req.user.id,
      status: 'active'
    }).populate('scenario', 'name description difficulty');
    
    console.log(`Successfully retrieved ${games.length} active games for user ${req.user.id}`);
    res.json(games);
  } catch (err) {
    console.error(`Error retrieving active games for user ${req.user.id}:`, err);
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// @route   POST api/game/:id/command
// @desc    Process a command in the game terminal
// @access  Private
router.post('/:id/command', auth, async (req, res) => {
  const { command } = req.body;
  
  try {
    console.log(`User ${req.user.id} executing command in game ${req.params.id}: ${command}`);
    
    // Validate required fields
    if (!command) {
      return res.status(400).json({ msg: 'Command is required' });
    }
    
    // Validate if the ID is in a valid format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid game ID format' });
    }
    
    // Find game session
    let game = await Game.findById(req.params.id);
    
    if (!game) {
      console.log(`Game not found with ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'Game session not found' });
    }
    
    // Verify user owns this game session
    if (game.player.toString() !== req.user.id) {
      console.log(`User ${req.user.id} not authorized to access game ${req.params.id}`);
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Process the command (this would be handled by game engine logic)
    // For now, just record the command as an action
    game.actions.push({
      actionType: 'command',
      parameters: { command },
      timestamp: Date.now()
    });
    
    // Update game state based on command (simplified)
    game.lastAction = Date.now();
    
    console.log(`Saving command action for game ${req.params.id}`);
    await game.save();
    
    // Process the command
    let result;
    
    // Add command to history
    if (!game.commandHistory) game.commandHistory = [];
    game.commandHistory.push({
      command,
      timestamp: Date.now()
    });
    
    // Handle empty command
    if (command.trim() === '') {
      result = '';
      return res.json({ result, game });
    }
    
    // Handle command history
    if (command.trim().startsWith('!')) {
      const historyIndex = parseInt(command.trim().substring(1));
      if (!isNaN(historyIndex) && historyIndex > 0 && historyIndex <= game.commandHistory.length) {
        const historyCommand = game.commandHistory[game.commandHistory.length - historyIndex].command;
        result = `Re-executing: ${historyCommand}\n`;
        command = historyCommand;
      } else {
        result = `Invalid history index. Use 'history' to view command history.\n`;
        return res.json({ result, game });
      }
    }
    
    // Handle help command
    if (command.trim().toLowerCase() === 'help') {
      // Get available tools from the scenario
      const availableTools = game.scenario.availableTools || [];
      
      result = `=== AVAILABLE COMMANDS ===\n\n`;
      
      // Add general commands
      result += `General Commands:\n`;
      result += `  help                    - Display this help message\n`;
      result += `  status                  - Show current game status\n`;
      result += `  objectives              - List mission objectives\n`;
      result += `  history                 - Show command history\n`;
      result += `  clear                   - Clear the terminal\n\n`;
      
      result += `Linux Commands:\n`;
      result += `  ls                      - List directory contents\n`;
      result += `  pwd                     - Print working directory\n`;
      result += `  cd [dir]                - Change directory\n`;
      result += `  cat [file]              - Display file contents\n`;
      result += `  whoami                  - Print current user\n`;
      result += `  date                    - Show current date/time\n`;
      result += `  uname [-a]              - Print system information\n\n`;
      
      // Add scenario-specific commands based on the scenario type
      if (game.scenario.category === 'red-team') {
        result += `\nReconnaissance Commands:\n`;
        result += `  scan network --type <type>             - Scan the network (types: basic, advanced, full)\n`;
        result += `  scan server --target <ip> --type <type> - Scan a server (types: port, service, stealth, vuln)\n`;
        result += `  enumerate users --domain <name>       - List domain users\n`;
        result += `  dump hashes --target <system>         - Extract password hashes\n`;
        
        result += `\nExploitation Commands:\n`;
        result += `  exploit <target> --vulnerability <type> --component <name> - Exploit a vulnerability\n`;
        result += `  brute-force --service <name> --user <file> --pass <file>  - Brute force attack\n`;
        result += `  pivot --target <ip> --method <type>    - Move laterally in network\n`;
        result += `  exfiltrate --data <type> --method <protocol> - Data exfiltration\n`;
        
        result += `\nPost-Exploitation Commands:\n`;
        result += `  escalate --method <type>             - Privilege escalation\n`;
        result += `  persist --method <type>              - Maintain access\n`;
        result += `  cleanup --level <type>              - Remove evidence\n`;
      } else if (game.scenario.category === 'blue-team') {
        result += `\nDefensive Commands:\n`;
        result += `  deploy tool --type <tool-type>         - Deploy security tools (types: ids, siem, edr, av)\n`;
        result += `  analyze network --type <analysis-type> - Analyze traffic (types: packets, flows, dns, http)\n`;
        result += `  detect attack --type <attack-type>     - Detect attacks (types: malware, brute, dos, exploit)\n`;
        result += `  configure firewall --rules <file>     - Configure firewall\n`;
        result += `  harden system --component <name>      - System hardening\n`;
        
        result += `\nIncident Response Commands:\n`;
        result += `  isolate host --target <ip>           - Isolate compromised host\n`;
        result += `  contain threat --id <id>             - Contain identified threat\n`;
        result += `  collect evidence --type <type>       - Gather forensic evidence\n`;
        result += `  remediate --action <type>            - Execute remediation\n`;
        
        result += `\nMonitoring Commands:\n`;
        result += `  monitor logs --source <type>         - Monitor log sources\n`;
        result += `  alert status --type <type>           - Check alert status\n`;
        result += `  threat hunt --indicator <type>       - Proactive threat hunting\n`;
      }
      
      // Add available tools section if tools are defined in the scenario
      if (availableTools.length > 0) {
        result += `\nAvailable Tools:\n`;
        availableTools.forEach(tool => {
          result += `  ${tool.name} - ${tool.description}\n`;
          if (tool.usage) {
            result += `    Usage: ${tool.usage}\n`;
          }
        });
      }
      
      // Add hint about scenario-specific commands
      result += `\nNote: Additional commands may be available based on your current mission.\n`;
      result += `Refer to the mission objectives and tutorial for specific command examples.`;
    } else if (command.trim().toLowerCase() === 'history') {
      // Display command history
      result = `=== COMMAND HISTORY ===\n`;
      if (game.commandHistory && game.commandHistory.length > 0) {
        game.commandHistory.forEach((entry, index) => {
          result += `  ${game.commandHistory.length - index}: ${entry.command}\n`;
        });
      } else {
        result += `  No commands in history\n`;
      }
    } else if (command.trim().toLowerCase() === 'clear') {
      // Clear terminal
      result = '\n'.repeat(50);
    } else {
      // Default command processing for other commands
      const currentDirectory = game.currentDirectory || '~';
      const promptStyle = `${game.username || 'hacker'}@cyber-siege:${currentDirectory}# `;
      result = `${promptStyle}${command}\n`;

      // Simulate command processing delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

      // Process basic Linux commands
      const args = command.trim().split(/\s+/);
      const cmd = args[0].toLowerCase();

      switch(cmd) {
        case 'ls':
          // Get current scenario assets and tools
          const scenario = game.scenario;
          if (!scenario) {
            result += 'Error: No active scenario\n';
            break;
          }

          const files = [];
          
          // Add tools directory with available tools
          if (scenario.availableTools && scenario.availableTools.length > 0) {
            files.push('tools/');
            if (currentDirectory === '/tools') {
              scenario.availableTools.forEach(tool => {
                files.push(tool.name.toLowerCase());
              });
            }
          }
          
          // Add assets based on scenario
          if (scenario.assets) {
            files.push('assets/');
            if (currentDirectory === '/assets') {
              scenario.assets.forEach(asset => {
                if (game.gameState.visibleAssets.includes(asset.name)) {
                  if (asset.type === 'network' || asset.type === 'server') {
                    files.push(asset.name.toLowerCase().replace(/\s+/g, '-') + '/');
                  } else {
                    files.push(asset.name.toLowerCase().replace(/\s+/g, '-'));
                  }
                }
              });
            }
          }
          
          // Add logs directory if we're tracking actions
          if (game.actions && game.actions.length > 0) {
            files.push('logs/');
            if (currentDirectory === '/logs') {
              files.push('activity.log');
              files.push('scan-results.log');
            }
          }

          // Add mission info files
          if (currentDirectory === '~') {
            files.push('mission-brief.txt');
            files.push('objectives.txt');
          }

          result += files.map(f => {
            if (f.endsWith('/')) {
              return `[1;34m${f}[0m`;
            }
            return f;
          }).join('  ') + '\n';
          break;

        case 'scan':
          if (!game.scenario) {
            result += 'Error: No active scenario\n';
            break;
          }

          const target = args[1];
          let scanType = null;
          let targetIP = null;

          // Parse scan arguments
          for (let i = 0; i < args.length; i++) {
            if (args[i] === '--type' && args[i + 1]) {
              scanType = args[i + 1];
            }
            if (args[i] === '--target' && args[i + 1]) {
              targetIP = args[i + 1];
            }
          }

          if (!target || !scanType) {
            result += 'Usage: scan <network|server> --type <type> [--target <ip>]\n';
            result += 'Scan types: basic, port, service, stealth\n';
            break;
          }

          // Find matching objective for this scan
          const scanObjective = game.scenario.objectives.find(obj => 
            obj.completionCriteria.actionType === 'scan' &&
            obj.completionCriteria.target === target &&
            obj.completionCriteria.parameters.scanType === scanType &&
            !obj.completed
          );

          if (target === 'network') {
            const network = game.scenario.assets.find(a => a.type === 'network');
            if (network && network.properties.hosts) {
              result += `\nScanning network ${network.properties.hosts[0]}/24...\n\n`;
              network.properties.hosts.forEach(host => {
                result += `Host ${host} is up\n`;
              });
              if (scanObjective) {
                scanObjective.completed = true;
                result += `\n[Achievement Unlocked] ${scanObjective.description}\n`;
              }
            }
          } else if (target === 'server' && targetIP) {
            const server = game.scenario.assets.find(a => 
              a.type === 'server' && a.properties.ip === targetIP
            );
            
            if (server) {
              switch(scanType) {
                case 'port':
                  result += `\nPort scan results for ${targetIP}:\n\n`;
                  server.properties.ports.forEach(port => {
                    result += `${port}/tcp open\n`;
                  });
                  break;
                case 'service':
                  result += `\nService detection results for ${targetIP}:\n\n`;
                  Object.entries(server.properties.services).forEach(([port, service]) => {
                    result += `${port}/tcp open  ${service}\n`;
                  });
                  break;
                case 'stealth':
                  result += `\nStealth scan results for ${targetIP}:\n\n`;
                  server.properties.ports.forEach(port => {
                    result += `${port}/tcp open  (TCP SYN scan)\n`;
                  });
                  break;
                default:
                  result += `Unknown scan type: ${scanType}\n`;
                  break;
              }
              
              if (scanObjective) {
                scanObjective.completed = true;
                result += `\n[Achievement Unlocked] ${scanObjective.description}\n`;
              }
            } else {
              result += `No such host: ${targetIP}\n`;
            }
          } else {
            result += 'Invalid scan target or missing IP address\n';
          }
          break;

        case 'identify':
          if (!args[1] || !args[2] || args[2] !== '--type') {
            result += 'Usage: identify incident --type <incident-type>\n';
            break;
          }

          const incidentType = args[3];
          if (!incidentType) {
            result += 'Missing incident type\n';
            break;
          }

          const event = game.scenario?.initialState?.events?.find(e => e.type === 'attack' && e.attackType === incidentType);
          if (event) {
            result += `\nIncident Analysis Results:\n\n`;
            result += `Type: ${event.attackType.toUpperCase()} attack\n`;
            result += `Initial Infection: ${event.target}\n`;
            result += `Attack Vector: ${event.source}\n`;
            result += `Timestamp: ${event.timestamp}\n`;
            
            if (event.details) {
              result += `\nDetails:\n`;
              Object.entries(event.details).forEach(([key, value]) => {
                result += `- ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}\n`;
              });
            }

            const objective = game.scenario.objectives.find(obj => 
              obj.completionCriteria.actionType === 'identify' &&
              obj.completionCriteria.target === 'incident' &&
              obj.completionCriteria.parameters.incidentType === incidentType &&
              !obj.completed
            );

            if (objective) {
              objective.completed = true;
              result += `\n[Achievement Unlocked] ${objective.description}\n`;
            }
          } else {
            result += `No ${incidentType} incident detected\n`;
          }
          break;

        case 'isolate':
          if (!args[1] || !args[2] || args[2] !== '--status') {
            result += 'Usage: isolate system --status <status>\n';
            break;
          }

          const systemStatus = args[3];
          if (!systemStatus) {
            result += 'Missing system status\n';
            break;
          }

          const infectedSystems = game.scenario?.assets?.filter(a => 
            (a.type === 'server' || a.type === 'workstation') && 
            a.properties.status === systemStatus
          );

          if (infectedSystems && infectedSystems.length > 0) {
            result += `\nIsolating infected systems:\n\n`;
            infectedSystems.forEach(system => {
              result += `[+] ${system.name} (${system.properties.ip})\n`;
              result += `    OS: ${system.properties.os}\n`;
              if (system.properties.services) {
                result += `    Services: ${Object.values(system.properties.services).join(', ')}\n`;
              }
              result += `    Status: Isolated\n\n`;
            });

            const objective = game.scenario.objectives.find(obj => 
              obj.completionCriteria.actionType === 'isolate' &&
              obj.completionCriteria.target === 'system' &&
              obj.completionCriteria.parameters.systemStatus === systemStatus &&
              !obj.completed
            );

            if (objective) {
              objective.completed = true;
              result += `[Achievement Unlocked] ${objective.description}\n`;
            }
          } else {
            result += `No systems found with status: ${systemStatus}\n`;
          }
          break;

        case 'analyze':
          if (!args[1] || !args[2] || args[2] !== '--type') {
            result += 'Usage: analyze <target> --type <analysis-type>\n';
            break;
          }

          const analysisTarget = args[1];
          const analysisType = args[3];

          if (!game.scenario?.assets?.find(a => a.name === 'Forensic Analysis Toolkit')) {
            result += 'Error: Forensic Analysis Toolkit not available\n';
            break;
          }

          if (analysisTarget === 'malware' && analysisType === 'forensic') {
            const event = game.scenario?.initialState?.events?.find(e => e.type === 'attack');
            if (event?.details) {
              result += `\nMalware Analysis Results:\n\n`;
              result += `Family: ${event.details.malwareFamily}\n`;
              result += `Affected Files: ${event.details.encryptedFiles}\n`;
              result += `Propagation Method: ${event.details.spreadMethod}\n`;
              result += `Initial Compromise: ${event.source}\n`;

              const objective = game.scenario.objectives.find(obj => 
                obj.completionCriteria.actionType === 'analyze' &&
                obj.completionCriteria.target === 'malware' &&
                obj.completionCriteria.parameters.analysisType === 'forensic' &&
                !obj.completed
              );

              if (objective) {
                objective.completed = true;
                result += `\n[Achievement Unlocked] ${objective.description}\n`;
              }
            }
          } else {
            result += `Invalid analysis target or type\n`;
          }
          break;

        case 'restore':
          if (!args[1] || !args[2] || args[2] !== '--type') {
            result += 'Usage: restore system --type <restore-type>\n';
            break;
          }

          const restoreType = args[3];
          if (restoreType === 'from-backup') {
            const backupServer = game.scenario?.assets?.find(a => a.name === 'Backup Server');
            if (backupServer?.properties?.status === 'operational') {
              result += `\nRestoring systems from backup:\n\n`;
              result += `Backup server: ${backupServer.properties.ip}\n`;
              result += `Last backup: ${backupServer.properties.lastBackup}\n\n`;

              const infectedAssets = game.scenario?.assets?.filter(a => 
                a.properties?.status === 'infected'
              );

              infectedAssets?.forEach(asset => {
                result += `[+] Restoring ${asset.name}\n`;
                result += `    Status: Restore Complete\n\n`;
              });

              const objective = game.scenario.objectives.find(obj => 
                obj.completionCriteria.actionType === 'restore' &&
                obj.completionCriteria.target === 'system' &&
                obj.completionCriteria.parameters.restoreType === 'from-backup' &&
                !obj.completed
              );

              if (objective) {
                objective.completed = true;
                result += `[Achievement Unlocked] ${objective.description}\n`;
              }
            } else {
              result += 'Error: Backup server not available\n';
            }
          } else {
            result += `Invalid restore type\n`;
          }
          break;

        case 'create':
          if (!args[1] || !args[2] || args[2] !== '--type') {
            result += 'Usage: create report --type <report-type>\n';
            break;
          }

          const reportType = args[3];
          if (reportType !== 'incident') {
            result += 'Invalid report type. Available type: incident\n';
            break;
          }

          if (!game.actions || game.actions.length === 0) {
            result += 'No actions recorded for report generation\n';
            break;
          }

          result += `\nGenerating Incident Report\n`;
          result += `=======================\n\n`;
          result += `Incident Summary:\n`;
          result += `-----------------\n`;
          const attackEvent = game.scenario?.initialState?.events?.find(e => e.type === 'attack');
          if (attackEvent) {
            result += `Type: ${attackEvent.attackType} attack\n`;
            result += `Initial Vector: ${attackEvent.source}\n`;
            result += `First Compromised System: ${attackEvent.target}\n`;
            result += `Time of Detection: ${attackEvent.timestamp}\n\n`;
          }

          result += `Response Actions:\n`;
          result += `----------------\n`;
          game.actions.forEach((action, index) => {
            const timestamp = new Date(action.timestamp).toISOString();
            result += `${index + 1}. [${timestamp}] ${action.actionType}`;
            if (action.target) result += ` on ${action.target}`;
            if (action.parameters) {
              Object.entries(action.parameters).forEach(([key, value]) => {
                result += ` --${key} ${value}`;
              });
            }
            result += '\n';
          });

          const reportObjective = game.scenario.objectives.find(obj => 
            obj.completionCriteria.actionType === 'create' &&
            obj.completionCriteria.target === 'report' &&
            obj.completionCriteria.parameters.reportType === 'incident' &&
            !obj.completed
          );

          if (reportObjective) {
            reportObjective.completed = true;
            result += `\n[Achievement Unlocked] ${reportObjective.description}\n`;
          }
          break;

        case 'implement':
          if (!args[1] || !args[2] || args[2] !== '--type') {
            result += 'Usage: implement security --type <improvement-type>\n';
            break;
          }

          const improvementType = args[3];
          if (improvementType !== 'preventive') {
            result += 'Invalid improvement type. Available type: preventive\n';
            break;
          }

          result += `\nImplementing Security Improvements\n`;
          result += `==============================\n\n`;

          // Get vulnerabilities from affected assets
          const vulnerabilities = new Set();
          game.scenario.assets.forEach(asset => {
            if (asset.vulnerabilities) {
              asset.vulnerabilities.forEach(v => vulnerabilities.add(v));
            }
          });

          // Implement fixes for each vulnerability
          [...vulnerabilities].forEach(vuln => {
            result += `[+] Addressing: ${vuln}\n`;
            switch(vuln) {
              case 'outdated-software':
                result += '    - Updating all systems to latest security patches\n';
                result += '    - Implementing automated patch management\n';
                break;
              case 'weak-authentication':
                result += '    - Enforcing strong password policies\n';
                result += '    - Implementing multi-factor authentication\n';
                break;
              case 'phishing-susceptible':
                result += '    - Deploying email filtering solutions\n';
                result += '    - Scheduling security awareness training\n';
                break;
              default:
                result += `    - Applying security hardening for ${vuln}\n`;
            }
            result += '\n';
          });

          const improvementObjective = game.scenario.objectives.find(obj => 
            obj.completionCriteria.actionType === 'implement' &&
            obj.completionCriteria.target === 'security' &&
            obj.completionCriteria.parameters.improvementType === 'preventive' &&
            !obj.completed
          );

          if (improvementObjective) {
            improvementObjective.completed = true;
            result += `[Achievement Unlocked] ${improvementObjective.description}\n`;
          }
          break;


        case 'pwd':
          result += `/home/hacker${currentDirectory === '~' ? '' : currentDirectory}\n`;
          break;

        case 'cat':
          if (!game.scenario) {
            result += 'Error: No active scenario\n';
            break;
          }

          if (!args[1]) {
            result += 'Usage: cat <filename>\n';
            break;
          }

          switch(args[1]) {
            case 'mission-brief.txt':
              result += `=== MISSION BRIEF ===\n\n`;
              result += `${game.scenario.description}\n\n`;
              result += `Mission Type: ${game.scenario.type}\n`;
              result += `Category: ${game.scenario.category}\n`;
              result += `Difficulty: ${game.scenario.difficulty}\n`;
              if (game.scenario.timeLimit) {
                result += `Time Limit: ${game.scenario.timeLimit} minutes\n`;
              }
              break;

            case 'objectives.txt':
              result += `=== MISSION OBJECTIVES ===\n\n`;
              game.scenario.objectives.forEach((obj, i) => {
                result += `${i + 1}. ${obj.description}\n`;
                result += `   Type: ${obj.type}\n`;
                result += `   Points: ${obj.points}\n`;
                result += `   Status: ${obj.completed ? '[COMPLETED]' : '[PENDING]'}\n\n`;
              });
              break;

            case 'activity.log':
              if (currentDirectory === '/logs' && game.actions) {
                result += `=== ACTIVITY LOG ===\n\n`;
                game.actions.forEach(action => {
                  const timestamp = new Date(action.timestamp).toISOString();
                  result += `[${timestamp}] ${action.actionType}`;
                  if (action.target) result += ` on ${action.target}`;
                  if (action.parameters) {
                    Object.entries(action.parameters).forEach(([key, value]) => {
                      result += ` --${key} ${value}`;
                    });
                  }
                  result += '\n';
                });
              } else {
                result += `cat: ${args[1]}: No such file or directory\n`;
              }
              break;

            case 'scan-results.log':
              if (currentDirectory === '/logs') {
                result += `=== SCAN RESULTS ===\n\n`;
                const scanActions = game.actions.filter(a => a.actionType === 'scan');
                scanActions.forEach(action => {
                  const timestamp = new Date(action.timestamp).toISOString();
                  result += `[${timestamp}] Scan Type: ${action.parameters.scanType}\n`;
                  if (action.target) result += `Target: ${action.target}\n`;
                  result += '\n';
                });
              } else {
                result += `cat: ${args[1]}: No such file or directory\n`;
              }
              break;

            default:
              result += `cat: ${args[1]}: No such file or directory\n`;
          }
          break;

        case 'cd':
          const newDir = args[1] || '~';
          const validDirs = ['~'];
          
          // Add scenario-specific directories
          if (game.scenario) {
            if (game.scenario.availableTools?.length > 0) validDirs.push('tools');
            if (game.scenario.assets?.length > 0) validDirs.push('assets');
            if (game.actions?.length > 0) validDirs.push('logs');
          }

          const cleanDir = newDir.replace('/', '');
          if (validDirs.includes(cleanDir)) {
            game.currentDirectory = newDir === '~' ? '~' : `/${cleanDir}`;
          } else if (currentDirectory === '/assets' && 
                    game.scenario?.assets?.some(a => 
                      game.gameState.visibleAssets.includes(a.name) &&
                      a.name.toLowerCase().replace(/\s+/g, '-') === cleanDir
                    )) {
            game.currentDirectory = `/assets/${cleanDir}`;
          } else {
            result += `cd: ${newDir}: No such directory\n`;
          }
          break;

        case 'whoami':
          result += 'hacker\n';
          break;

        case 'date':
          result += new Date().toString() + '\n';
          break;

        case 'uname':
          if (args.includes('-a')) {
            result += 'CyberSiege 1.0 cybersim 5.15.0 #1 2025-04-01 x86_64 GNU/Linux\n';
          } else {
            result += 'CyberSiege\n';
          }
          break;

        default:
          result += `Command '${cmd}' not found. Use 'help' to see available commands.\n`;
      }
    }
    
    console.log(`Command processed for game ${req.params.id}`);
    res.json({ result, game });
  } catch (err) {
    console.error(`Error processing command for game ${req.params.id}:`, err);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game session not found' });
    }
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// @route   GET api/game/:id
// @desc    Get game by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`Attempting to fetch game with ID: ${req.params.id}`);
    
    // Validate if the ID is in a valid format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid game ID format' });
    }
    
    const game = await Game.findById(req.params.id).populate('scenario');
    
    if (!game) {
      console.log(`Game not found with ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'Game session not found' });
    }
    
    // Verify user owns this game session
    if (game.player.toString() !== req.user.id) {
      console.log(`User ${req.user.id} not authorized to access game ${req.params.id}`);
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    console.log(`Successfully retrieved game ${req.params.id}`);
    res.json(game);
  } catch (err) {
    console.error(`Error fetching game ${req.params.id}:`, err);
    
    // More detailed error handling
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game session not found' });
    }
    
    // Check for database connection issues
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ msg: 'Database connection error' });
    }
    
    // Return a more descriptive error message
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

module.exports = router;
