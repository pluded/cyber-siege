# Cyber Siege Installation and Startup Script
# This script installs dependencies and starts the Cyber Siege application

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) { return $true }
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $oldPreference
    }
}

# Function to display colored messages
function Write-ColorOutput {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [string]$ForegroundColor = "White"
    )
    
    $previousForegroundColor = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $previousForegroundColor
}

# Display welcome message
Write-ColorOutput "===================================================" "Green"
Write-ColorOutput "      CYBER SIEGE - INSTALLATION SCRIPT" "Green"
Write-ColorOutput "===================================================" "Green"
Write-ColorOutput "This script will install and start the Cyber Siege application." "Cyan"
Write-ColorOutput "Requirements:" "Cyan"
Write-ColorOutput "  - Node.js (v14 or higher)" "Cyan"
Write-ColorOutput "  - MongoDB (running locally or accessible via connection string)" "Cyan"
Write-ColorOutput "===================================================" "Green"
Write-Output ""

# Check for Node.js
Write-Output "Checking for Node.js..."
if (-not (Test-CommandExists node)) {
    Write-ColorOutput "ERROR: Node.js is not installed or not in PATH." "Red"
    Write-ColorOutput "Please install Node.js from https://nodejs.org/ (v14 or higher recommended)" "Yellow"
    exit 1
}

$nodeVersion = node -v
Write-ColorOutput "Node.js found: $nodeVersion" "Green"

# Check for npm
Write-Output "Checking for npm..."
if (-not (Test-CommandExists npm)) {
    Write-ColorOutput "ERROR: npm is not installed or not in PATH." "Red"
    Write-ColorOutput "npm should be installed with Node.js. Please check your installation." "Yellow"
    exit 1
}

$npmVersion = npm -v
Write-ColorOutput "npm found: $npmVersion" "Green"

# Check for MongoDB
Write-Output "Checking MongoDB connection..."
try {
    # Read MongoDB URI from .env file or use default
    $envFile = Get-Content -Path ".env" -ErrorAction SilentlyContinue
    $mongoUri = "mongodb://localhost:27017/cyber-siege"
    
    foreach ($line in $envFile) {
        if ($line -match "MONGO_URI=(.+)") {
            $mongoUri = $matches[1]
            break
        }
    }
    
    Write-ColorOutput "MongoDB URI: $mongoUri" "Cyan"
    Write-ColorOutput "NOTE: Make sure MongoDB is running before starting the server." "Yellow"
    Write-ColorOutput "If you need to install MongoDB, visit: https://www.mongodb.com/try/download/community" "Yellow"
} catch {
    Write-ColorOutput "WARNING: Could not verify MongoDB connection." "Yellow"
    Write-ColorOutput "Please ensure MongoDB is installed and running before starting the server." "Yellow"
}

# Install server dependencies
Write-Output ""
Write-ColorOutput "Installing server dependencies..." "Cyan"
try {
    npm install
    Write-ColorOutput "Server dependencies installed successfully!" "Green"
} catch {
    Write-ColorOutput "ERROR: Failed to install server dependencies." "Red"
    Write-ColorOutput $_.Exception.Message "Red"
    exit 1
}

# Install client dependencies
Write-Output ""
Write-ColorOutput "Installing client dependencies..." "Cyan"
try {
    npm run install-client
    Write-ColorOutput "Client dependencies installed successfully!" "Green"
} catch {
    Write-ColorOutput "ERROR: Failed to install client dependencies." "Red"
    Write-ColorOutput $_.Exception.Message "Red"
    exit 1
}

# Installation complete
Write-Output ""
Write-ColorOutput "===================================================" "Green"
Write-ColorOutput "      INSTALLATION COMPLETED SUCCESSFULLY!" "Green"
Write-ColorOutput "===================================================" "Green"
Write-Output ""

# Provide options to start the application
Write-ColorOutput "How would you like to start Cyber Siege?" "Cyan"
Write-ColorOutput "1. Start server only (backend API)" "White"
Write-ColorOutput "2. Start full application (backend + frontend dev server)" "White"
Write-ColorOutput "3. Build client for production and start server" "White"
Write-ColorOutput "4. Exit without starting" "White"

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-ColorOutput "Starting server only..." "Green"
        Write-ColorOutput "The API will be available at http://localhost:5000" "Cyan"
        Write-ColorOutput "Press Ctrl+C to stop the server." "Yellow"
        npm run dev
    }
    "2" {
        Write-ColorOutput "Starting full application (backend + frontend)..." "Green"
        Write-ColorOutput "The API will be available at http://localhost:5000" "Cyan"
        Write-ColorOutput "The frontend will be available at http://localhost:3000 or http://localhost:5173" "Cyan"
        Write-ColorOutput "Press Ctrl+C to stop both servers." "Yellow"
        npm run dev-full
    }
    "3" {
        Write-ColorOutput "Building client for production..." "Green"
        npm run build-client
        
        Write-ColorOutput "Starting production server..." "Green"
        Write-ColorOutput "The application will be available at http://localhost:5000" "Cyan"
        Write-ColorOutput "Press Ctrl+C to stop the server." "Yellow"
        npm start
    }
    "4" {
        Write-ColorOutput "Exiting without starting the application." "Yellow"
        Write-ColorOutput "You can start the application later with:" "Cyan"
        Write-ColorOutput "  - Server only: npm run dev" "White"
        Write-ColorOutput "  - Full application: npm run dev-full" "White"
        Write-ColorOutput "  - Production mode: npm start (after building client)" "White"
    }
    default {
        Write-ColorOutput "Invalid choice. Exiting." "Red"
    }
}