// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brandRoutes.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import blogRoutes from './routes/blog.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import notificationsRoutes from './routes/notifications.js';
import newsletterRoutes from './routes/newsletter.js';
import contactRoutes from './routes/contact.js';
import configRoutes from './routes/configRoutes.js';
import mpesaRoutes from './routes/mpesa.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Env
dotenv.config();

const app = express();
app.set('trust proxy', 1); // needed for secure cookies behind proxy (Render, Heroku, etc.)

// Security middleware
app.use(helmet());
app.use(compression());


// Replace your CORS configuration with this:

const allowedOrigins = [
  'http://localhost:5173',
  'https://e-shop-lyart-beta.vercel.app'
];

// 🔍 Detailed CORS origin logging
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('🌍 Incoming request Origin:', origin);
      if (!origin || allowedOrigins.includes(origin)) {
        console.log('✅ Origin allowed:', origin);
        callback(null, origin);
      } else {
        console.log('❌ Origin blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // ✅ This is correct
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // ✅ Added OPTIONS
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Cookie',           // ✅ CRITICAL - This was missing!
      'X-Requested-With', // ✅ Good to have
      'Accept'            // ✅ Good to have
    ],
    exposedHeaders: ['Set-Cookie'], // ✅ CRITICAL - This was missing!
    optionsSuccessStatus: 200,      // ✅ For legacy browser support
    preflightContinue: false,       // ✅ Let CORS handle preflight
    maxAge: 86400                   // ✅ Cache preflight for 24 hours
  })
);

// 🔍 Enhanced cookie logging middleware
app.use((req, res, next) => {
  console.log('📦 Incoming cookies:', req.cookies);
  console.log('📦 Raw cookie header:', req.headers.cookie);
  console.log('📦 User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
  console.log('📦 Request URL:', req.method, req.url);
  next();
});

// Body & cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 🔍 Cookie logging middleware
app.use((req, res, next) => {
  console.log('📦 Incoming cookies:', req.cookies);
  next();
});

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/config', configRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// DB connect
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} on port ${PORT}`);
  });
};

startServer();

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

export default app;
