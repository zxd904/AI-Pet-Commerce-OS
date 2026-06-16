// 数据源服务层 - 接入多平台数据
// 注意：由于真实爬取存在限制，本服务提供模拟数据 + 可扩展的真实API接口

export interface ProductDataSource {
  title: string;
  price: number;
  sales_volume: number;
  rating: number;
  review_count: number;
  category: string;
  image_url: string;
  supplier_price: number;
  shipping_cost: number;
  source: string;
  source_url: string;
}

const PET_CATEGORIES = [
  'automatic cat litter box',
  'smart pet feeder',
  'pet water fountain',
  'pet camera',
  'dog gps tracker',
  'pet grooming kit',
  'cat scratching post',
  'dog training collar',
  'pet carrier',
  'pet bed',
  'pet hair remover',
  'smart pet bowl',
  'pet thermal mat',
  'pet travel bag',
  'pet automatic waterer'
];

const BRANDS = [
  'PETKIT', 'PetSafe', 'Catit', 'Furbo', 'Whistle',
  'Sure Petcare', 'Petcube', 'Petcam', 'SmartPaw', 'PetTech',
  'Pawsome', 'FurryFriends', 'PetLovers', 'CatNip', 'DoggyDelight'
];

const PRODUCT_DESCRIPTIONS = [
  'Premium Quality', 'Smart Automatic', 'Wireless', 'Portable',
  'Advanced Technology', 'Ultra Quiet', 'Energy Efficient',
  'Durable', 'Eco-Friendly', 'Professional Grade'
];

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export async function fetchAmazonBestSellers(): Promise<ProductDataSource[]> {
  const brand = BRANDS[randomInt(0, BRANDS.length - 1)];
  const category = PET_CATEGORIES[randomInt(0, PET_CATEGORIES.length - 1)];
  const desc = PRODUCT_DESCRIPTIONS[randomInt(0, PRODUCT_DESCRIPTIONS.length - 1)];

  const mockData: ProductDataSource[] = [
    {
      title: `${brand} ${desc} Automatic Cat Litter Box`,
      price: randomFloat(120, 250),
      sales_volume: randomInt(5000, 20000),
      rating: randomFloat(4.0, 4.9),
      review_count: randomInt(2000, 15000),
      category: 'Cat Litter Boxes',
      image_url: 'https://example.com/cat-litter-box.jpg',
      supplier_price: randomFloat(40, 100),
      shipping_cost: randomFloat(8, 20),
      source: 'amazon',
      source_url: 'https://amazon.com/dp/B0014DNJQI'
    },
    {
      title: `${brand} Smart Pet Feeder with Camera`,
      price: randomFloat(80, 180),
      sales_volume: randomInt(3000, 12000),
      rating: randomFloat(4.2, 4.8),
      review_count: randomInt(1000, 8000),
      category: 'Automatic Feeders',
      image_url: 'https://example.com/pet-feeder.jpg',
      supplier_price: randomFloat(30, 70),
      shipping_cost: randomFloat(5, 15),
      source: 'amazon',
      source_url: 'https://amazon.com/dp/B08XYZ123'
    },
    {
      title: `${brand} Flower Fountain for Pets`,
      price: randomFloat(25, 60),
      sales_volume: randomInt(8000, 25000),
      rating: randomFloat(4.1, 4.7),
      review_count: randomInt(5000, 20000),
      category: 'Pet Water Fountains',
      image_url: 'https://example.com/water-fountain.jpg',
      supplier_price: randomFloat(10, 25),
      shipping_cost: randomFloat(3, 8),
      source: 'amazon',
      source_url: 'https://amazon.com/dp/B00VCWNJUI'
    },
    {
      title: `${brand} Dog Camera with Treat Dispenser`,
      price: randomFloat(100, 200),
      sales_volume: randomInt(4000, 15000),
      rating: randomFloat(4.0, 4.6),
      review_count: randomInt(2000, 10000),
      category: 'Pet Cameras',
      image_url: 'https://example.com/furbo-camera.jpg',
      supplier_price: randomFloat(45, 85),
      shipping_cost: randomFloat(8, 18),
      source: 'amazon',
      source_url: 'https://amazon.com/dp/B075WN7Y9M'
    },
    {
      title: `${brand} GO Explore GPS Pet Tracker`,
      price: randomFloat(60, 150),
      sales_volume: randomInt(2000, 8000),
      rating: randomFloat(3.9, 4.5),
      review_count: randomInt(500, 3000),
      category: 'Pet GPS Trackers',
      image_url: 'https://example.com/gps-tracker.jpg',
      supplier_price: randomFloat(25, 60),
      shipping_cost: randomFloat(4, 10),
      source: 'amazon',
      source_url: 'https://amazon.com/dp/B07N7XZZZZ'
    }
  ];

  console.log(`✅ [Amazon] 获取 ${mockData.length} 个热销商品`);
  return shuffleArray(mockData);
}

export async function fetchAliExpressHot(): Promise<ProductDataSource[]> {
  const brand = BRANDS[randomInt(0, BRANDS.length - 1)];
  const category = PET_CATEGORIES[randomInt(0, PET_CATEGORIES.length - 1)];
  const desc = PRODUCT_DESCRIPTIONS[randomInt(0, PRODUCT_DESCRIPTIONS.length - 1)];

  const mockData: ProductDataSource[] = [
    {
      title: `${brand} ${desc} Smart Automatic Pet Feeder 5L`,
      price: randomFloat(20, 80),
      sales_volume: randomInt(15000, 50000),
      rating: randomFloat(4.2, 4.8),
      review_count: randomInt(5000, 20000),
      category: 'Pet Feeders',
      image_url: 'https://example.com/ae-feeder.jpg',
      supplier_price: randomFloat(8, 30),
      shipping_cost: randomFloat(1, 5),
      source: 'aliexpress',
      source_url: 'https://aliexpress.com/item/1234567890'
    },
    {
      title: `${brand} Electric Cat Toys Automatic Rotating Ball`,
      price: randomFloat(5, 25),
      sales_volume: randomInt(30000, 80000),
      rating: randomFloat(4.0, 4.6),
      review_count: randomInt(10000, 40000),
      category: 'Cat Toys',
      image_url: 'https://example.com/cat-toy.jpg',
      supplier_price: randomFloat(1, 8),
      shipping_cost: randomFloat(0.5, 3),
      source: 'aliexpress',
      source_url: 'https://aliexpress.com/item/2345678901'
    },
    {
      title: `${brand} Pet Grooming Vacuum Suction Brush`,
      price: randomFloat(15, 60),
      sales_volume: randomInt(10000, 30000),
      rating: randomFloat(4.1, 4.7),
      review_count: randomInt(3000, 15000),
      category: 'Pet Grooming',
      image_url: 'https://example.com/grooming-vacuum.jpg',
      supplier_price: randomFloat(5, 25),
      shipping_cost: randomFloat(2, 8),
      source: 'aliexpress',
      source_url: 'https://aliexpress.com/item/3456789012'
    },
    {
      title: `${brand} Smart Water Dispenser for Pets`,
      price: randomFloat(12, 40),
      sales_volume: randomInt(20000, 45000),
      rating: randomFloat(4.3, 4.8),
      review_count: randomInt(6000, 25000),
      category: 'Pet Water Fountains',
      image_url: 'https://example.com/water-dispenser.jpg',
      supplier_price: randomFloat(4, 15),
      shipping_cost: randomFloat(1, 4),
      source: 'aliexpress',
      source_url: 'https://aliexpress.com/item/4567890123'
    }
  ];

  console.log(`✅ [AliExpress] 获取 ${mockData.length} 个热销商品`);
  return shuffleArray(mockData);
}

export async function fetch1688Supply(): Promise<ProductDataSource[]> {
  const chineseProducts = [
    { title: '全自动猫砂盆 智能猫厕所', category: '宠物用品' },
    { title: '宠物智能喂食器 定时投食器', category: '宠物用品' },
    { title: '猫咪饮水机 活氧循环静音', category: '宠物用品' },
    { title: '宠物烘干箱 猫狗洗澡吹干设备', category: '宠物用品' },
    { title: '智能宠物项圈 GPS定位追踪', category: '宠物用品' },
    { title: '宠物梳毛器 除毛神器', category: '宠物用品' },
    { title: '猫抓板 瓦楞纸猫窝', category: '宠物用品' },
    { title: '宠物旅行箱 便携外出包', category: '宠物用品' }
  ];

  const mockData: ProductDataSource[] = chineseProducts.map(p => ({
    title: p.title + (Math.random() > 0.5 ? ' 批发代发' : ' 工厂直销'),
    price: randomFloat(10, 150),
    sales_volume: randomInt(1000, 15000),
    rating: randomFloat(4.3, 4.9),
    review_count: randomInt(200, 3000),
    category: p.category,
    image_url: 'https://example.com/1688-product.jpg',
    supplier_price: randomFloat(5, 100),
    shipping_cost: randomFloat(2, 20),
    source: '1688',
    source_url: 'https://1688.com/item/' + Math.random().toString(36).substr(2, 6)
  }));

  console.log(`✅ [1688] 获取 ${mockData.length} 个供应链商品`);
  return shuffleArray(mockData);
}

export async function fetchTikTokShopTrending(): Promise<ProductDataSource[]> {
  const brand = BRANDS[randomInt(0, BRANDS.length - 1)];

  const mockData: ProductDataSource[] = [
    {
      title: `${brand} Viral Cat Toy Ball - Smart Interactive`,
      price: randomFloat(8, 35),
      sales_volume: randomInt(50000, 150000),
      rating: randomFloat(4.4, 4.9),
      review_count: randomInt(15000, 60000),
      category: 'Pet Toys',
      image_url: 'https://example.com/tiktok-cat-toy.jpg',
      supplier_price: randomFloat(2, 10),
      shipping_cost: randomFloat(0.5, 4),
      source: 'tiktok',
      source_url: 'https://shop.tiktok.com/item/' + randomInt(100, 999)
    },
    {
      title: `${brand} Pet Hair Remover Roller - TikTok Viral`,
      price: randomFloat(5, 25),
      sales_volume: randomInt(80000, 200000),
      rating: randomFloat(4.2, 4.8),
      review_count: randomInt(30000, 80000),
      category: 'Pet Grooming',
      image_url: 'https://example.com/tiktok-hair-remover.jpg',
      supplier_price: randomFloat(1, 6),
      shipping_cost: randomFloat(0.5, 3),
      source: 'tiktok',
      source_url: 'https://shop.tiktok.com/item/' + randomInt(100, 999)
    },
    {
      title: `${brand} Cat Scratcher Lounge Bed - Modern Design`,
      price: randomFloat(20, 70),
      sales_volume: randomInt(20000, 60000),
      rating: randomFloat(4.3, 4.8),
      review_count: randomInt(5000, 20000),
      category: 'Cat Furniture',
      image_url: 'https://example.com/tiktok-scratcher.jpg',
      supplier_price: randomFloat(8, 25),
      shipping_cost: randomFloat(3, 12),
      source: 'tiktok',
      source_url: 'https://shop.tiktok.com/item/' + randomInt(100, 999)
    },
    {
      title: `${brand} Portable Pet Water Bottle - Travel Essential`,
      price: randomFloat(10, 30),
      sales_volume: randomInt(40000, 100000),
      rating: randomFloat(4.1, 4.7),
      review_count: randomInt(10000, 40000),
      category: 'Pet Travel',
      image_url: 'https://example.com/tiktok-water-bottle.jpg',
      supplier_price: randomFloat(3, 10),
      shipping_cost: randomFloat(0.5, 3),
      source: 'tiktok',
      source_url: 'https://shop.tiktok.com/item/' + randomInt(100, 999)
    }
  ];

  console.log(`✅ [TikTok Shop] 获取 ${mockData.length} 个爆款商品`);
  return shuffleArray(mockData);
}

export async function fetchAllSources(): Promise<ProductDataSource[]> {
  console.log('🔄 开始从所有数据源获取商品数据...');

  const results = await Promise.allSettled([
    fetchAmazonBestSellers(),
    fetchAliExpressHot(),
    fetch1688Supply(),
    fetchTikTokShopTrending()
  ]);

  const allProducts: ProductDataSource[] = [];

  results.forEach((result, index) => {
    const sources = ['Amazon', 'AliExpress', '1688', 'TikTok Shop'];
    if (result.status === 'fulfilled') {
      allProducts.push(...result.value);
    } else {
      console.error(`❌ [${sources[index]}] 数据获取失败:`, result.reason);
    }
  });

  console.log(`✅ 总计获取 ${allProducts.length} 个商品数据`);
  return shuffleArray(allProducts);
}

export function calculateProfitMargin(price: number, cost: number, shipping: number): number {
  const totalCost = cost + shipping;
  const profit = price - totalCost;
  return Math.round((profit / price) * 100 * 100) / 100;
}

export function filterEligibleProducts(products: ProductDataSource[]): ProductDataSource[] {
  return products.filter(product => {
    const profitMargin = calculateProfitMargin(
      product.price,
      product.supplier_price,
      product.shipping_cost
    );
    
    return (
      profitMargin >= 20 &&
      product.rating >= 4.0 &&
      product.review_count < 10000
    );
  });
}