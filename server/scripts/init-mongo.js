// MongoDB initialization script for Docker
// This script will be executed when the MongoDB container starts for the first time

// Switch to the eshop database
db = db.getSiblingDB('eshop');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "must be a valid email address and is required"
        },
        password: {
          bsonType: "string",
          minLength: 6,
          description: "must be a string of at least 6 characters and is required"
        },
        role: {
          bsonType: "string",
          enum: ["user", "admin"],
          description: "must be either user or admin"
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price", "category"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        price: {
          bsonType: "number",
          minimum: 0,
          description: "must be a positive number and is required"
        },
        category: {
          bsonType: "objectId",
          description: "must be a valid ObjectId and is required"
        }
      }
    }
  }
});

db.createCollection('categories');
db.createCollection('orders');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "featured": 1 });
db.products.createIndex({ "createdAt": -1 });

db.categories.createIndex({ "name": 1 }, { unique: true });
db.categories.createIndex({ "parent": 1 });

db.orders.createIndex({ "user": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });

print("Database initialization completed successfully!");
print("Collections created: users, products, categories, orders");
print("Indexes created for optimal performance");
