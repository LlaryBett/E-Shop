// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import helmet from 'helmet';
// import compression from 'compression';
// import morgan from 'morgan';
// import cookieParser from 'cookie-parser';
// import mongoSanitize from 'express-mongo-sanitize';
// import xss from 'xss-clean';
// import hpp from 'hpp';
// import rateLimit from 'express-rate-limit';

// // Import routes
// import authRoutes from './routes/auth.js';
// import userRoutes from './routes/users.js';
// import productRoutes from './routes/products.js';
// import categoryRoutes from './routes/categories.js';
// import orderRoutes from './routes/orders.js';
// import reviewRoutes from './routes/reviews.js';
// import uploadRoutes from './routes/upload.js';
// import paymentRoutes from './routes/payments.js';
// import adminRoutes from './routes/admin.js';
// import blogRoutes from './routes/blog.js';

// // Import middleware
// import { errorHandler } from './middleware/errorHandler.js';
// import { notFound } from './middleware/notFound.js';

// // Load environment variables
// dotenv.config();

// const app = express();

// // Trust proxy
// app.set('trust proxy', 1);

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
// });

// // Security middleware
// app.use(helmet());
// app.use(compression());
// app.use(limiter);

// // CORS configuration
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cookieParser());

// // Data sanitization
// app.use(mongoSanitize());
// app.use(xss());
// app.use(hpp());

// // Logging
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// // Health check route
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString(),
//   });
// });

// // API routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/blog', blogRoutes);

// // Error handling middleware
// app.use(notFound);
// app.use(errorHandler);

// // Database connection
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error('Database connection error:', error);
//     process.exit(1);
//   }
// };

// // Start server
// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();
  
//   app.listen(PORT, () => {
//     console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
//   });
// };

// startServer();

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.log('Unhandled Rejection:', err.message);
//   process.exit(1);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.log('Uncaught Exception:', err.message);
//   process.exit(1);
// });

// export default app;