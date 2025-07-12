export const mockProducts = [
  {
    id: '1',
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    price: 299.99,
    salePrice: 199.99,
    images: [
      'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'AudioTech',
    rating: 4.5,
    reviewCount: 128,
    stock: 45,
    tags: ['wireless', 'bluetooth', 'noise-cancellation'],
    featured: true,
    trending: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'Smart Fitness Watch',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life.',
    price: 399.99,
    images: [
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Wearables',
    brand: 'FitTech',
    rating: 4.7,
    reviewCount: 89,
    stock: 23,
    tags: ['fitness', 'smart', 'gps', 'heart-rate'],
    featured: true,
    trending: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    title: 'Professional Camera Lens',
    description: '85mm f/1.4 prime lens perfect for portraits and professional photography.',
    price: 1299.99,
    images: [
      'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Photography',
    brand: 'LensMaster',
    rating: 4.9,
    reviewCount: 45,
    stock: 12,
    tags: ['camera', 'lens', 'professional', 'portrait'],
    featured: false,
    trending: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '4',
    title: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt in various colors.',
    price: 29.99,
    salePrice: 19.99,
    images: [
      'https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Clothing',
    subcategory: 'T-Shirts',
    brand: 'EcoWear',
    rating: 4.3,
    reviewCount: 156,
    stock: 78,
    tags: ['organic', 'cotton', 'sustainable', 'casual'],
    variants: [
      { id: 'size-s', name: 'Size', value: 'S' },
      { id: 'size-m', name: 'Size', value: 'M' },
      { id: 'size-l', name: 'Size', value: 'L' },
      { id: 'color-white', name: 'Color', value: 'White' },
      { id: 'color-black', name: 'Color', value: 'Black' },
      { id: 'color-gray', name: 'Color', value: 'Gray' }
    ],
    featured: true,
    trending: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '5',
    title: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    price: 49.99,
    images: [
      'https://images.pexels.com/photos/4068314/pexels-photo-4068314.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Accessories',
    brand: 'ChargeTech',
    rating: 4.4,
    reviewCount: 67,
    stock: 34,
    tags: ['wireless', 'charging', 'qi', 'fast'],
    featured: true,
    trending: false,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22')
  },
  {
    id: '6',
    title: 'Leather Messenger Bag',
    description: 'Handcrafted leather messenger bag perfect for work and travel.',
    price: 179.99,
    images: [
      'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Accessories',
    subcategory: 'Bags',
    brand: 'LeatherCraft',
    rating: 4.6,
    reviewCount: 92,
    stock: 18,
    tags: ['leather', 'messenger', 'handcrafted', 'work'],
    featured: true,
    trending: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '7',
    title: 'Stainless Steel Water Bottle',
    description: 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.',
    price: 34.99,
    images: [
      'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Home & Kitchen',
    subcategory: 'Drinkware',
    brand: 'HydroLife',
    rating: 4.8,
    reviewCount: 134,
    stock: 56,
    tags: ['stainless-steel', 'insulated', 'eco-friendly', 'hydration'],
    featured: false,
    trending: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-24')
  },
  {
    id: '8',
    title: 'Wireless Gaming Mouse',
    description: 'High-precision wireless gaming mouse with RGB lighting and programmable buttons.',
    price: 89.99,
    images: [
      'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Gaming',
    brand: 'GameTech',
    rating: 4.5,
    reviewCount: 78,
    stock: 29,
    tags: ['gaming', 'wireless', 'rgb', 'precision'],
    featured: true,
    trending: false,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-19')
  },
  {
    id: '9',
    title: 'Yoga Mat Premium',
    description: 'Non-slip premium yoga mat with extra cushioning and carrying strap.',
    price: 79.99,
    salePrice: 59.99,
    images: [
      'https://images.pexels.com/photos/3822354/pexels-photo-3822354.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/3822354/pexels-photo-3822354.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Sports & Fitness',
    subcategory: 'Yoga',
    brand: 'YogaLife',
    rating: 4.7,
    reviewCount: 112,
    stock: 41,
    tags: ['yoga', 'non-slip', 'premium', 'fitness'],
    featured: false,
    trending: true,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: '10',
    title: 'Bluetooth Speaker Portable',
    description: 'Compact portable Bluetooth speaker with 360-degree sound and waterproof design.',
    price: 129.99,
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'SoundWave',
    rating: 4.4,
    reviewCount: 95,
    stock: 33,
    tags: ['bluetooth', 'portable', 'waterproof', '360-sound'],
    featured: true,
    trending: false,
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: '11',
    title: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic coffee mugs with unique designs.',
    price: 54.99,
    images: [
      'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Home & Kitchen',
    subcategory: 'Drinkware',
    brand: 'CeramicArt',
    rating: 4.6,
    reviewCount: 73,
    stock: 25,
    tags: ['ceramic', 'coffee', 'handcrafted', 'set'],
    featured: false,
    trending: false,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-23')
  },
  {
    id: '12',
    title: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with touch controls and USB charging port.',
    price: 69.99,
    images: [
      'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Home & Garden',
    subcategory: 'Lighting',
    brand: 'LightTech',
    rating: 4.3,
    reviewCount: 58,
    stock: 37,
    tags: ['led', 'desk', 'adjustable', 'usb'],
    featured: true,
    trending: true,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-20')
  }
];

export const categories = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Sports & Fitness',
  'Home & Garden',
  'Accessories'
];

export const brands = [
  'AudioTech',
  'FitTech',
  'LensMaster',
  'EcoWear',
  'ChargeTech',
  'LeatherCraft',
  'HydroLife',
  'GameTech',
  'YogaLife',
  'SoundWave',
  'CeramicArt',
  'LightTech'
];