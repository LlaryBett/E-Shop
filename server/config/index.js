module.exports = {
  // Development server configuration
  development: {
    port: process.env.PORT || 5000,
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop-dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // Production server configuration
  production: {
    port: process.env.PORT || 5000,
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50 // limit each IP to 50 requests per windowMs in production
    }
  },

  // Test environment configuration
  test: {
    port: process.env.PORT || 5001,
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop-test',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '1h'
    },
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000 // Higher limit for testing
    }
  }
};  //
