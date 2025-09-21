// Database initialization script for FlockByAttiq
// Run this script to set up the database with default data

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flockbyattiq';

async function initDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Create collections
    await db.createCollection('users');
    await db.createCollection('products');
    await db.createCollection('orders');
    await db.createCollection('categories');
    
    console.log('Collections created successfully');
    
    // Insert default admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = {
      name: 'Admin User',
      email: 'admin@flockbyattiq.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('users').insertOne(adminUser);
    console.log('Default admin user created: admin@flockbyattiq.com / admin123');
    
    // Insert sample products
    const sampleProducts = [
      {
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
        price: 199.99,
        originalPrice: 249.99,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
        category: 'Electronics',
        subcategory: 'Audio',
        brand: 'SoundMax',
        sku: 'WH-001',
        stock: 50,
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        tags: ['wireless', 'noise-cancellation', 'premium'],
        specifications: {
          'Battery Life': '30 hours',
          'Connectivity': 'Bluetooth 5.0',
          'Weight': '250g',
          'Color': 'Black'
        },
        rating: 4.8,
        reviewCount: 124,
        weight: 250,
        dimensions: { length: 20, width: 18, height: 8 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking with heart rate monitoring, GPS, and water resistance.',
        price: 299.99,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
        category: 'Electronics',
        subcategory: 'Wearables',
        brand: 'FitTech',
        sku: 'SW-002',
        stock: 30,
        isActive: true,
        isFeatured: true,
        isOnSale: false,
        tags: ['fitness', 'smartwatch', 'health'],
        specifications: {
          'Display': '1.4" AMOLED',
          'Battery Life': '7 days',
          'Water Resistance': '50m',
          'Sensors': 'Heart Rate, GPS, Accelerometer'
        },
        rating: 4.6,
        reviewCount: 89,
        weight: 45,
        dimensions: { length: 4, width: 4, height: 1 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt made from 100% organic materials.',
        price: 29.99,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
        category: 'Fashion',
        subcategory: 'Tops',
        brand: 'EcoWear',
        sku: 'TS-003',
        stock: 100,
        isActive: true,
        isFeatured: false,
        isOnSale: false,
        tags: ['organic', 'cotton', 'sustainable'],
        specifications: {
          'Material': '100% Organic Cotton',
          'Care Instructions': 'Machine wash cold',
          'Sizes': 'S, M, L, XL',
          'Color': 'White'
        },
        rating: 4.7,
        reviewCount: 203,
        weight: 150,
        dimensions: { length: 30, width: 25, height: 1 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Minimalist Backpack',
        description: 'Stylish and functional backpack for everyday use with multiple compartments.',
        price: 79.99,
        originalPrice: 99.99,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'],
        category: 'Accessories',
        subcategory: 'Bags',
        brand: 'UrbanGear',
        sku: 'BP-004',
        stock: 25,
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        tags: ['backpack', 'minimalist', 'urban'],
        specifications: {
          'Capacity': '25L',
          'Material': 'Nylon',
          'Compartments': '3',
          'Laptop Sleeve': 'Yes'
        },
        rating: 4.9,
        reviewCount: 156,
        weight: 800,
        dimensions: { length: 45, width: 30, height: 15 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable speaker with excellent sound quality and long battery life.',
        price: 89.99,
        images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'],
        category: 'Electronics',
        subcategory: 'Audio',
        brand: 'SoundWave',
        sku: 'BS-005',
        stock: 40,
        isActive: true,
        isFeatured: false,
        isOnSale: false,
        tags: ['bluetooth', 'portable', 'speaker'],
        specifications: {
          'Battery Life': '12 hours',
          'Connectivity': 'Bluetooth 5.0',
          'Water Resistance': 'IPX7',
          'Power': '20W'
        },
        rating: 4.5,
        reviewCount: 78,
        weight: 600,
        dimensions: { length: 20, width: 8, height: 8 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gaming Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with tactile switches for gaming and typing.',
        price: 149.99,
        originalPrice: 179.99,
        images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop'],
        category: 'Electronics',
        subcategory: 'Gaming',
        brand: 'GameTech',
        sku: 'KB-006',
        stock: 35,
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        tags: ['gaming', 'mechanical', 'rgb'],
        specifications: {
          'Switch Type': 'Cherry MX Blue',
          'Backlight': 'RGB',
          'Connectivity': 'USB-C',
          'Layout': 'Full Size'
        },
        rating: 4.7,
        reviewCount: 92,
        weight: 1200,
        dimensions: { length: 45, width: 15, height: 3 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Yoga Mat Premium',
        description: 'Non-slip yoga mat with excellent grip and cushioning for all yoga practices.',
        price: 49.99,
        images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop'],
        category: 'Sports',
        subcategory: 'Fitness',
        brand: 'ZenFit',
        sku: 'YM-007',
        stock: 60,
        isActive: true,
        isFeatured: false,
        isOnSale: false,
        tags: ['yoga', 'fitness', 'non-slip'],
        specifications: {
          'Material': 'TPE',
          'Thickness': '6mm',
          'Size': '72" x 24"',
          'Weight': '2.5 lbs'
        },
        rating: 4.8,
        reviewCount: 167,
        weight: 1134,
        dimensions: { length: 72, width: 24, height: 0.6 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ceramic Coffee Mug Set',
        description: 'Handcrafted ceramic coffee mugs perfect for your morning brew.',
        price: 24.99,
        images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop'],
        category: 'Home',
        subcategory: 'Kitchen',
        brand: 'Artisan',
        sku: 'CM-008',
        stock: 80,
        isActive: true,
        isFeatured: false,
        isOnSale: false,
        tags: ['ceramic', 'coffee', 'handcrafted'],
        specifications: {
          'Material': 'Ceramic',
          'Capacity': '12 oz',
          'Dishwasher Safe': 'Yes',
          'Microwave Safe': 'Yes'
        },
        rating: 4.6,
        reviewCount: 134,
        weight: 300,
        dimensions: { length: 10, width: 8, height: 10 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Wireless Phone Charger',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
        price: 39.99,
        originalPrice: 49.99,
        images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop'],
        category: 'Electronics',
        subcategory: 'Accessories',
        brand: 'ChargeMax',
        sku: 'WC-009',
        stock: 45,
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        tags: ['wireless', 'charging', 'fast'],
        specifications: {
          'Power': '15W',
          'Compatibility': 'Qi Standard',
          'LED Indicator': 'Yes',
          'Cable Length': '3ft'
        },
        rating: 4.4,
        reviewCount: 89,
        weight: 200,
        dimensions: { length: 10, width: 10, height: 1 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Face Serum',
        description: 'Natural anti-aging face serum with vitamin C and hyaluronic acid.',
        price: 34.99,
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'],
        category: 'Beauty',
        subcategory: 'Skincare',
        brand: 'NaturalGlow',
        sku: 'FS-010',
        stock: 70,
        isActive: true,
        isFeatured: false,
        isOnSale: false,
        tags: ['organic', 'skincare', 'anti-aging'],
        specifications: {
          'Volume': '30ml',
          'Ingredients': 'Vitamin C, Hyaluronic Acid',
          'Skin Type': 'All Types',
          'Cruelty Free': 'Yes'
        },
        rating: 4.9,
        reviewCount: 203,
        weight: 50,
        dimensions: { length: 6, width: 3, height: 12 },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('products').insertMany(sampleProducts);
    console.log('Sample products inserted successfully');
    
    // Insert categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets', isActive: true, createdAt: new Date() },
      { name: 'Fashion', description: 'Clothing and fashion accessories', isActive: true, createdAt: new Date() },
      { name: 'Accessories', description: 'Various accessories and lifestyle products', isActive: true, createdAt: new Date() },
      { name: 'Sports', description: 'Sports and fitness equipment', isActive: true, createdAt: new Date() },
      { name: 'Home', description: 'Home and kitchen products', isActive: true, createdAt: new Date() },
      { name: 'Beauty', description: 'Beauty and personal care products', isActive: true, createdAt: new Date() },
      { name: 'Books', description: 'Books and educational materials', isActive: true, createdAt: new Date() }
    ];
    
    await db.collection('categories').insertMany(categories);
    console.log('Categories inserted successfully');
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nDefault credentials:');
    console.log('Email: admin@flockbyattiq.com');
    console.log('Password: admin123');
    console.log('\nYou can now start the application and login with these credentials.');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
  }
}

// Run the initialization
initDatabase();
