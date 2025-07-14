import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://llarykiplangat:Password123@cluster0.u85zl.mongodb.net/E-SHOPDB?retryWrites=true&w=majority&appName=Cluster0';

const migrateBrandReferences = async () => {
  let isConnected = false;

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');

    const products = await Product.find();
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`🔍 Found ${products.length} products to process...\n`);

    for (const product of products) {
      try {
        // Skip if already ObjectId
        if (mongoose.Types.ObjectId.isValid(product.brand) && typeof product.brand !== 'string') {
          skippedCount++;
          continue;
        }

        const brand = await Brand.findOne({ name: product.brand });

        if (brand) {
          product.brand = brand._id;
          await product.save();
          updatedCount++;
          console.log(`✅ Updated product ${product._id} with brand '${brand.name}'`);
        } else {
          console.warn(`⚠️ Brand not found: '${product.brand}' (Product: ${product._id})`);
          errorCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing product ${product._id}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Report:');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏩ Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (isConnected) await mongoose.disconnect();
    process.exit(0);
  }
};

migrateBrandReferences();
