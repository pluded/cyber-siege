# Cyber Siege - Administrator Guide

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [User Management](#user-management)
6. [Scenario Management](#scenario-management)
7. [Server Administration](#server-administration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Introduction

This guide is intended for administrators of the Cyber Siege platform. It covers all aspects of installing, configuring, and maintaining the system, as well as managing users and scenarios.

### Administrator Responsibilities
- Server installation and maintenance
- User account management
- Scenario creation and configuration
- System monitoring and performance optimization
- Security updates and patches
- Backup and recovery procedures

---

## System Requirements

### Server Requirements
- **Operating System**: Windows, macOS, or Linux
- **Node.js**: v14 or higher
- **MongoDB**: v4.4 or higher
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection with sufficient bandwidth for expected user load

### Development Environment
- Node.js and npm
- Git
- MongoDB
- Text editor or IDE (VS Code recommended)

---

## Installation

### Using the Installation Script

1. Clone the repository:
   ```
   git clone [repository-url] cyber-siege
   cd cyber-siege
   ```

2. Run the installation script:
   - On Windows: `./install-and-start.ps1`
   - On macOS/Linux: `bash install-and-start.sh`

3. Follow the prompts to complete the installation.

### Manual Installation

1. Clone the repository:
   ```
   git clone [repository-url] cyber-siege
   cd cyber-siege
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   npm run install-client
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/cyber-siege
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

5. Start the development server:
   ```
   npm run dev-full
   ```

---

## Configuration

### Environment Variables

The following environment variables can be configured in the `.env` file:

| Variable | Description | Default |
|----------|-------------|--------|
| NODE_ENV | Environment mode (development/production) | development |
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/cyber-siege |
| JWT_SECRET | Secret key for JWT token generation | (required) |
| JWT_EXPIRE | JWT token expiration time | 30d |

### Database Configuration

1. Ensure MongoDB is installed and running.
2. The application will automatically create the required collections.
3. For production environments, consider enabling authentication and TLS for MongoDB.

### Server Configuration

Additional server settings can be modified in `server.js` and related configuration files.

---

## User Management

### User Roles

Cyber Siege supports the following user roles:

- **Player**: Regular users who can participate in training and competitive modes
- **Instructor**: Can create and manage scenarios, view player progress
- **Administrator**: Full system access, including user management

### Creating Admin Users

1. Access the MongoDB database directly or use the API endpoint.
2. Create a user with the `role` field set to `admin`.

### Managing Users

Administrators can:

1. Create, edit, and delete user accounts
2. Reset user passwords
3. Assign and modify user roles
4. View user activity and progress
5. Disable or suspend accounts if necessary

### User Data Management

- User data is stored in the MongoDB database in the `users` collection
- Passwords are hashed using bcrypt
- Personal information should be handled according to relevant privacy regulations

---

## Scenario Management

### Creating Scenarios

Scenarios are the core content of Cyber Siege. To create a new scenario:

1. Access the Scenario Builder through the admin interface
2. Define scenario parameters:
   - Name and description
   - Difficulty level
   - Required skills and tools
   - Objectives for both red and blue teams
   - Assets and their values
   - Available resources

3. Configure the scenario phases and progression logic
4. Test the scenario thoroughly before publishing

### Editing Scenarios

1. Select the scenario from the management interface
2. Modify parameters as needed
3. Save changes and republish

### Scenario Database Structure

Scenarios are stored in the `scenarios` collection with the following structure:

```javascript
{
  name: String,
  description: String,
  difficulty: String,
  type: String, // 'training' or 'competitive'
  redTeamObjectives: Array,
  blueTeamObjectives: Array,
  assets: Array,
  phases: Array,
  createdBy: ObjectId,
  isActive: Boolean
}
```

---

## Server Administration

### Starting and Stopping the Server

- **Development Mode**: `npm run dev-full`
- **Production Mode**: `npm start` (after building client with `npm run build-client`)
- **Server Only**: `npm run dev` or `node server.js`

### Deployment Options

1. **Local Deployment**:
   - Follow the installation instructions above
   - Configure for production in the `.env` file

2. **Cloud Deployment**:
   - Deploy to services like AWS, Azure, or Heroku
   - Configure environment variables in the cloud provider's dashboard
   - Set up a MongoDB Atlas instance for the database

### Scaling Considerations

- Implement load balancing for high-traffic instances
- Consider using a process manager like PM2 for Node.js
- Monitor server resources and scale vertically or horizontally as needed

---

## Monitoring & Maintenance

### Performance Monitoring

1. Monitor server resources (CPU, memory, disk space)
2. Track database performance and query times
3. Monitor network traffic and response times
4. Set up alerts for critical issues

### Backup Procedures

1. **Database Backups**:
   - Schedule regular MongoDB backups
   - Store backups securely, preferably in multiple locations
   - Test restoration procedures periodically

2. **Application Backups**:
   - Back up the entire application directory
   - Include configuration files and environment variables
   - Document the backup and restoration process

### Updates and Patches

1. Regularly check for updates to dependencies
2. Apply security patches promptly
3. Test updates in a staging environment before deploying to production
4. Maintain a change log of all updates and modifications

---

## Troubleshooting

### Common Issues

#### Server Won't Start

1. Check if MongoDB is running
2. Verify environment variables in the `.env` file
3. Check for port conflicts
4. Review server logs for specific error messages

#### Database Connection Issues

1. Verify MongoDB connection string
2. Check MongoDB service status
3. Ensure network connectivity between the server and database
4. Check authentication credentials if using authenticated MongoDB

#### Client-Side Issues

1. Clear browser cache and cookies
2. Check for JavaScript console errors
3. Verify that the client build is up to date
4. Test with different browsers

### Logging

- Server logs are output to the console by default
- Consider implementing a more robust logging solution for production
- Monitor logs regularly for errors and warnings

---

## Security Considerations

### Authentication Security

1. Use strong, unique passwords for admin accounts
2. Implement multi-factor authentication if possible
3. Regularly rotate JWT secrets and admin credentials
4. Set appropriate token expiration times

### Data Security

1. Ensure all sensitive data is encrypted at rest and in transit
2. Implement proper access controls for different user roles
3. Regularly audit user permissions and access patterns
4. Follow the principle of least privilege for all accounts

### Network Security

1. Use HTTPS for all connections
2. Configure proper CORS settings
3. Implement rate limiting to prevent abuse
4. Consider using a Web Application Firewall (WAF)

### Regular Security Audits

1. Conduct periodic security assessments
2. Review and test authentication mechanisms
3. Check for common vulnerabilities (OWASP Top 10)
4. Keep all dependencies updated to prevent known vulnerabilities

---

For additional support or questions not covered in this guide, please contact the development team or refer to the project documentation repository.