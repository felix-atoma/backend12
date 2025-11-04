const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Message indexes
    await mongoose.model('Message').createIndexes();
    
    // Application indexes - with conflict handling
    await fixApplicationIndexes();
    
    // User indexes
    await mongoose.model('User').createIndexes();
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

const fixApplicationIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('applications');
    
    // Get all existing indexes
    const indexes = await collection.listIndexes().toArray();
    
    // Check if applicationNumber index exists and has conflicts
    const appNumberIndex = indexes.find(index => index.name === 'applicationNumber_1');
    
    if (appNumberIndex) {
      console.log('ℹ️ Found existing applicationNumber index, checking for conflicts...');
      
      // If the existing index doesn't have unique constraint but we want one
      if (!appNumberIndex.unique) {
        console.log('🔄 Recreating applicationNumber index with unique constraint...');
        
        // Drop the existing non-unique index
        await collection.dropIndex('applicationNumber_1');
        
        // Create new unique index
        await collection.createIndex(
          { applicationNumber: 1 }, 
          { 
            unique: true, 
            name: 'applicationNumber_1',
            background: true 
          }
        );
        console.log('✅ Recreated applicationNumber index with unique constraint');
      } else {
        console.log('✅ applicationNumber index already has unique constraint');
      }
    } else {
      // Create the index if it doesn't exist
      await collection.createIndex(
        { applicationNumber: 1 }, 
        { 
          unique: true, 
          name: 'applicationNumber_1',
          background: true 
        }
      );
      console.log('✅ Created new applicationNumber index with unique constraint');
    }
    
    // Also create other application indexes safely
    try {
      await mongoose.model('Application').createIndexes();
    } catch (error) {
      console.log('ℹ️ Some Application indexes already exist, continuing...');
    }
    
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('ℹ️ Index not found, creating new one...');
      // Create the index if it was already dropped
      await collection.createIndex(
        { applicationNumber: 1 }, 
        { 
          unique: true, 
          name: 'applicationNumber_1',
          background: true 
        }
      );
    } else if (error.code === 86) { // IndexKeySpecsConflict
      console.log('🔄 Handling index conflict...');
      // Drop conflicting index and recreate
      await collection.dropIndex('applicationNumber_1');
      await collection.createIndex(
        { applicationNumber: 1 }, 
        { 
          unique: true, 
          name: 'applicationNumber_1',
          background: true 
        }
      );
      console.log('✅ Resolved index conflict');
    } else {
      console.error('Error fixing application indexes:', error);
    }
  }
};

// Handle index creation after connection
mongoose.connection.once('open', async () => {
  console.log('MongoDB connection established');
});

module.exports = connectDB;