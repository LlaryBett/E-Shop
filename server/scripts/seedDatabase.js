const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create categories
    console.log('Creating categories...');
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Clothing',
        description: 'Fashion and apparel',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Books',
        description: 'Books and educational materials',
        isActive: true,
        sortOrder: 5
      }
    ]);

    // Create subcategories
    const subcategories = await Category.insertMany([
      {
        name: 'Smartphones',
        parent: categories[0]._id,
        description: 'Mobile phones and accessories',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Laptops',
        parent: categories[0]._id,
        description: 'Portable computers',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Audio',
        parent: categories[0]._id,
        description: 'Headphones and speakers',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Men\'s Clothing',
        parent: categories[1]._id,
        description: 'Clothing for men',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Women\'s Clothing',
        parent: categories[1]._id,
        description: 'Clothing for women',
        isActive: true,
        sortOrder: 2
      }
    ]);

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('password123', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    // Create customer user
    console.log('Creating customer user...');
    const customerPassword = await bcrypt.hash('password123', 12);
    const customerUser = await User.create({
      name: 'John Doe',
      email: 'customer@example.com',
      password: customerPassword,
      role: 'customer',
      isActive: true,
      isEmailVerified: true,
      addresses: [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'customer@example.com',
        phone: '555-0123',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        isDefault: true
      }]
    });

    // Create products
    console.log('Creating products...');
    const products = await Product.insertMany([
      {
        title: 'Wireless Bluetooth Headphones',
        description: 'Premium wireless headphones with noise cancellation and 30-hour battery life. Features advanced Bluetooth 5.0 technology for seamless connectivity.',
        price: 299.99,
        salePrice: 199.99,
        images: [
          {
            url: 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=500',
            alt: 'Wireless Bluetooth Headphones',
            isPrimary: true
          }
        ],
        category: categories[0]._id,
        subcategory: subcategories[2]._id,
        brand: 'AudioTech',
        stock: 45,
        tags: ['wireless', 'bluetooth', 'noise-cancellation', 'premium'],
        specifications: new Map([
          ['Battery Life', '30 hours'],
          ['Connectivity', 'Bluetooth 5.0'],
          ['Weight', '250g'],
          ['Color', 'Black']
        ]),
        featured: true,
        trending: false,
        status: 'active'
      },
      {
        title: 'Smart Fitness Watch',
        description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life. Perfect for tracking your daily activities and workouts.',
        price: 399.99,
        images: [
          {
            url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
            alt: 'Smart Fitness Watch',
            isPrimary: true
          }
        ],
        category: categories[0]._id,
        brand: 'FitTech',
        stock: 23,
        tags: ['fitness', 'smart', 'gps', 'heart-rate'],
        specifications: new Map([
          ['Battery Life', '7 days'],
          ['Display', 'OLED'],
          ['Water Resistance', '50m'],
          ['GPS', 'Built-in']
        ]),
        featured: true,
        trending: true,
        status: 'active'
      },
      {
        title: 'Professional Camera Lens',
        description: '85mm f/1.4 prime lens perfect for portraits and professional photography. Delivers stunning image quality with beautiful bokeh.',
        price: 1299.99,
        images: [
          {
            url: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=500',
            alt: 'Professional Camera Lens',
            isPrimary: true
          }
        ],
        category: categories[0]._id,
        brand: 'PhotoPro',
        stock: 12,
        tags: ['camera', 'lens', 'photography', 'professional'],
        specifications: new Map([
          ['Focal Length', '85mm'],
          ['Aperture', 'f/1.4'],
          ['Mount', 'Canon EF'],
          ['Weight', '950g']
        ]),
        featured: false,
        trending: false,
        status: 'active'
      },
      {
        title: 'Men\'s Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt available in multiple colors. Perfect for casual wear with a relaxed fit.',
        price: 29.99,
        salePrice: 19.99,
        images: [
          {
            url: 'https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg?auto=compress&cs=tinysrgb&w=500',
            alt: 'Men\'s Cotton T-Shirt',
            isPrimary: true
          }
        ],
        category: categories[1]._id,
        subcategory: subcategories[3]._id,
        brand: 'ComfortWear',
        stock: 150,
        tags: ['cotton', 'casual', 'comfortable', 'basic'],
        variants: [
          { name: 'Size', value: 'S', stock: 30 },
          { name: 'Size', value: 'M', stock: 50 },
          { name: 'Size', value: 'L', stock: 40 },
          { name: 'Size', value: 'XL', stock: 30 },
          { name: 'Color', value: 'Black', stock: 75 },
          { name: 'Color', value: 'White', stock: 75 }
        ],
        specifications: new Map([
          ['Material', '100% Cotton'],
          ['Fit', 'Relaxed'],
          ['Care', 'Machine wash cold']
        ]),
        featured: false,
        trending: true,
        status: 'active'
      },
      {
        title: 'Ceramic Coffee Mug Set',
        description: 'Set of 4 elegant ceramic coffee mugs perfect for your morning coffee or tea. Dishwasher and microwave safe.',
        price: 49.99,
        images: [
          {
            url: 'https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=500',
            alt: 'Ceramic Coffee Mug Set',
            isPrimary: true
          }
        ],
        category: categories[2]._id,
        brand: 'HomeEssentials',
        stock: 80,
        tags: ['ceramic', 'coffee', 'kitchen', 'set'],
        specifications: new Map([
          ['Material', 'Ceramic'],
          ['Capacity', '12 oz'],
          ['Set Size', '4 mugs'],
          ['Dishwasher Safe', 'Yes']
        ]),
        featured: false,
        trending: false,
        status: 'active'
      },
      {
        title: 'Yoga Mat Premium',
        description: 'High-quality yoga mat with excellent grip and cushioning. Perfect for all types of yoga practice and exercise.',
        price: 79.99,
        salePrice: 59.99,
        images: [
          {
            url: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=500',
            alt: 'Yoga Mat Premium',
            isPrimary: true
          }
        ],
        category: categories[3]._id,
        brand: 'FitLife',
        stock: 65,
        tags: ['yoga', 'exercise', 'fitness', 'mat'],
        specifications: new Map([
          ['Thickness', '6mm'],
          ['Material', 'TPE'],
          ['Size', '183cm x 61cm'],
          ['Weight', '1.2kg']
        ]),
        featured: true,
        trending: false,
        status: 'active'
      }
    ]);

    // Add some reviews to products
    console.log('Adding reviews to products...');
    products[0].reviews.push({
      user: customerUser._id,
      name: customerUser.name,
      rating: 5,
      comment: 'Excellent sound quality and very comfortable to wear for long periods.',
      isVerifiedPurchase: true
    });

    products[1].reviews.push({
      user: customerUser._id,
      name: customerUser.name,
      rating: 4,
      comment: 'Great fitness tracker with accurate measurements. Battery life is impressive.',
      isVerifiedPurchase: true
    });

    // Save products with reviews
    await Promise.all(products.map(product => product.save()));

    console.log('Database seeded successfully!');
    console.log('Admin credentials: admin@example.com / password123');
    console.log('Customer credentials: customer@example.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedData };
