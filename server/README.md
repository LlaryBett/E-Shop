# E-Shop Backend Server

A comprehensive MERN stack backend for an e-commerce application built with Express.js, MongoDB, and Node.js.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Product Management**: Full CRUD operations with filtering, search, and categorization
- **Order Management**: Complete order lifecycle with status tracking and analytics
- **User Management**: User profiles, addresses, and administrative functions
- **Cart & Wishlist**: Persistent cart and wishlist functionality
- **Reviews & Ratings**: Product review system with helpful voting
- **File Uploads**: Image upload with Cloudinary integration
- **Payment Processing**: Stripe integration for secure payments
- **Email Notifications**: Automated emails for orders, shipping, and account actions
- **Security**: Rate limiting, CORS protection, data validation, and sanitization

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary
- **Payment**: Stripe
- **Email**: Nodemailer
- **Security**: Helmet, express-rate-limit, express-validator
- **Development**: Nodemon, dotenv

## Installation

1. Clone the repository and navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with the following variables:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eshop
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_FROM=noreply@eshop.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:3000
```

5. Start MongoDB service on your machine

6. Seed the database (optional):
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run seed` - Seed the database with sample data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products (with filtering, sorting, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/trending` - Get trending products
- `GET /api/products/:id/related` - Get related products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)
- `GET /api/categories/:id/products` - Get products by category

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `GET /api/orders/admin/all` - Get all orders (admin only)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update cart item
- `DELETE /api/cart/items/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear cart
- `POST /api/cart/sync` - Sync cart with frontend

### Wishlist
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/toggle/:productId` - Toggle product in wishlist
- `DELETE /api/wishlist/:productId` - Remove item from wishlist
- `POST /api/wishlist/:productId/move-to-cart` - Move item to cart

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/helpful` - Mark review as helpful

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/:publicId` - Delete image
- `GET /api/upload/gallery` - Get user's uploaded images

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook
- `POST /api/payments/refund` - Process refund (admin only)

### Users (Admin)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)

## Project Structure

```
server/
├── middleware/          # Custom middleware
│   ├── auth.js         # Authentication & authorization
│   ├── errorHandler.js # Global error handling
│   ├── notFound.js     # 404 handler
│   └── validation.js   # Request validation
├── models/             # Mongoose models
│   ├── User.js         # User model
│   ├── Product.js      # Product model
│   ├── Category.js     # Category model
│   └── Order.js        # Order model
├── routes/             # Express routes
│   ├── authRoutes.js   # Authentication routes
│   ├── userRoutes.js   # User management routes
│   ├── productRoutes.js # Product routes
│   ├── categoryRoutes.js # Category routes
│   ├── orderRoutes.js  # Order routes
│   ├── cartRoutes.js   # Cart routes
│   ├── wishlistRoutes.js # Wishlist routes
│   ├── reviewRoutes.js # Review routes
│   ├── uploadRoutes.js # File upload routes
│   └── paymentRoutes.js # Payment routes
├── utils/              # Utility functions
│   └── emailService.js # Email service
├── scripts/            # Database scripts
│   └── seedDatabase.js # Database seeding
├── server.js           # Main application file
├── package.json        # Dependencies and scripts
└── .env.example        # Environment variables template
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing configuration
- **Data Validation**: Input validation and sanitization
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: Bcrypt for secure password storage
- **Admin Authorization**: Role-based access control

## Database Schema

The application uses MongoDB with Mongoose for data modeling. Key collections include:

- **Users**: User accounts with authentication and profile data
- **Products**: Product catalog with categories, pricing, and inventory
- **Categories**: Hierarchical product categorization
- **Orders**: Order management with items, status, and tracking
- **Reviews**: Product reviews and ratings

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Environment Setup

Make sure you have the following services configured:

1. **MongoDB**: Local or cloud instance (MongoDB Atlas)
2. **Stripe**: Payment processing account
3. **Cloudinary**: Image hosting and management
4. **Email Service**: SMTP configuration (Gmail, SendGrid, etc.)

## License

This project is licensed under the MIT License.
