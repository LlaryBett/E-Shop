const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    // Check system information
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus[dbState],
        connected: dbState === 1
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      cpu: process.cpuUsage()
    };

    // If database is not connected, mark as unhealthy
    if (dbState !== 1) {
      healthCheck.status = 'UNHEALTHY';
      return res.status(503).json(healthCheck);
    }

    res.json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Detailed system status
// @route   GET /api/health/detailed
// @access  Public
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        pid: process.pid
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: Object.keys(mongoose.connection.collections)
      },
      memory: process.memoryUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      }
    };

    res.json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
