// 抖音小店API集成服务
// 文档: https://op.jinritemai.com/docs/guide-docs/9/23

import crypto from 'crypto';

// 抖音小店配置
interface DouyinConfig {
  appId: string;        // 应用ID (AppKey)
  appSecret: string;    // 应用密钥 (AppSecret)
  shopId?: string;      // 店铺ID
  accessToken?: string; // 授权Token
}

// 商品数据结构
interface DouyinProduct {
  product_id?: string;
  name: string;
  description: string;
  price: number;        // 单位：分
  market_price?: number;
  category_id: string;
  img: string[];        // 图片URL列表
  spec_id?: string;
  outer_product_id?: string; // 外部商品ID
}

// API响应
interface DouyinResponse<T> {
  code: number;
  message: string;
  data?: T;
}

class DouyinShopService {
  private config: DouyinConfig;
  private baseUrl = 'https://developer.toutiao.com/api';

  constructor(config: DouyinConfig) {
    this.config = config;
  }

  // ==================== 签名生成 ====================
  private generateSign(params: Record<string, any>): string {
    // 1. 按key字典序排序
    const sortedKeys = Object.keys(params).sort();
    
    // 2. 拼接字符串
    const signStr = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&') + `&app_secret=${this.config.appSecret}`;
    
    // 3. MD5加密
    return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  }

  // ==================== 获取AccessToken ====================
  async getAccessToken(): Promise<string> {
    const params = {
      app_id: this.config.appId,
      app_secret: this.config.appSecret,
      grant_type: 'authorization_self'
    };

    try {
      const response = await fetch(`${this.baseUrl}/apps/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await response.json() as DouyinResponse<{ access_token: string; expires_in: number }>;
      
      if (data.code === 0 && data.data) {
        this.config.accessToken = data.data.access_token;
        return data.data.access_token;
      }

      throw new Error(`获取Token失败: ${data.message}`);
    } catch (error) {
      console.error('获取AccessToken失败:', error);
      throw error;
    }
  }

  // ==================== 商品发布 ====================
  async createProduct(product: DouyinProduct): Promise<DouyinResponse<{ product_id: string }>> {
    if (!this.config.accessToken) {
      await this.getAccessToken();
    }

    const params = {
      app_id: this.config.appId,
      access_token: this.config.accessToken,
      method: 'product.add',
      timestamp: Math.floor(Date.now() / 1000),
      param: JSON.stringify({
        product_name: product.name,
        product_description: product.description,
        price_info: {
          price: product.price,  // 单位：分
          market_price: product.market_price || product.price * 120
        },
        category_id: product.category_id,
        img_info: {
          img_url_list: product.img
        },
        outer_product_id: product.outer_product_id || `pet_${Date.now()}`
      })
    };

    // 生成签名
    const sign = this.generateSign(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/product/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, sign })
      });

      const data = await response.json() as DouyinResponse<{ product_id: string }>;
      
      if (data.code === 0) {
        console.log(`✅ 抖音小店商品发布成功: ${product.name}`);
      } else {
        console.error(`❌ 抖音小店商品发布失败: ${data.message}`);
      }

      return data;
    } catch (error) {
      console.error('商品发布失败:', error);
      throw error;
    }
  }

  // ==================== 商品上架 ====================
  async listProduct(productId: string): Promise<DouyinResponse<{}>> {
    if (!this.config.accessToken) {
      await this.getAccessToken();
    }

    const params = {
      app_id: this.config.appId,
      access_token: this.config.accessToken,
      method: 'product.setOnline',
      timestamp: Math.floor(Date.now() / 1000),
      product_id: productId
    };

    const sign = this.generateSign(params);

    try {
      const response = await fetch(`${this.baseUrl}/product/setOnline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, sign })
      });

      const data = await response.json() as DouyinResponse<{}>;
      
      if (data.code === 0) {
        console.log(`✅ 商品上架成功: ${productId}`);
      }

      return data;
    } catch (error) {
      console.error('商品上架失败:', error);
      throw error;
    }
  }

  // ==================== 商品下架 ====================
  async delistProduct(productId: string): Promise<DouyinResponse<{}>> {
    if (!this.config.accessToken) {
      await this.getAccessToken();
    }

    const params = {
      app_id: this.config.appId,
      access_token: this.config.accessToken,
      method: 'product.setOffline',
      timestamp: Math.floor(Date.now() / 1000),
      product_id: productId
    };

    const sign = this.generateSign(params);

    try {
      const response = await fetch(`${this.baseUrl}/product/setOffline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, sign })
      });

      return await response.json() as DouyinResponse<{}>;
    } catch (error) {
      console.error('商品下架失败:', error);
      throw error;
    }
  }

  // ==================== 获取商品详情 ====================
  async getProductDetail(productId: string): Promise<DouyinResponse<any>> {
    if (!this.config.accessToken) {
      await this.getAccessToken();
    }

    const params = {
      app_id: this.config.appId,
      access_token: this.config.accessToken,
      method: 'product.detail',
      timestamp: Math.floor(Date.now() / 1000),
      product_id: productId
    };

    const sign = this.generateSign(params);

    try {
      const response = await fetch(`${this.baseUrl}/product/detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, sign })
      });

      return await response.json() as DouyinResponse<any>;
    } catch (error) {
      console.error('获取商品详情失败:', error);
      throw error;
    }
  }

  // ==================== 获取类目列表 ====================
  async getCategories(parentId: number = 0): Promise<DouyinResponse<any[]>> {
    if (!this.config.accessToken) {
      await this.getAccessToken();
    }

    const params = {
      app_id: this.config.appId,
      access_token: this.config.accessToken,
      method: 'product.category.list',
      timestamp: Math.floor(Date.now() / 1000),
      parent_id: parentId
    };

    const sign = this.generateSign(params);

    try {
      const response = await fetch(`${this.baseUrl}/product/category/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, sign })
      });

      return await response.json() as DouyinResponse<any[]>;
    } catch (error) {
      console.error('获取类目列表失败:', error);
      throw error;
    }
  }
}

// ==================== 宠物用品类目ID ====================
// 抖音小店宠物用品类目（需要根据实际类目树更新）
export interface CategoryInfo {
  name: string;
  category_id: string;
}

export const PET_CATEGORIES: Record<string, CategoryInfo> = {
  'Cat Litter Boxes': { name: '猫砂盆', category_id: '201500000' },
  'Automatic Feeders': { name: '智能喂食器', category_id: '201501000' },
  'Pet Water Fountains': { name: '宠物饮水机', category_id: '201502000' },
  'Pet Cameras': { name: '宠物监控', category_id: '201503000' },
  'Pet GPS Trackers': { name: '宠物定位器', category_id: '201504000' },
  'Cat Toys': { name: '猫玩具', category_id: '201505000' },
  'Pet Grooming': { name: '宠物美容', category_id: '201506000' },
  'Cat Furniture': { name: '猫家具', category_id: '201507000' },
  '宠物用品': { name: '宠物用品', category_id: '201500000' }
};

// ==================== 导出服务实例 ====================
let douyinService: DouyinShopService | null = null;

export function initDouyinService(config: DouyinConfig): DouyinShopService {
  douyinService = new DouyinShopService(config);
  return douyinService;
}

export function getDouyinService(): DouyinShopService | null {
  return douyinService;
}

export { DouyinShopService, DouyinConfig, DouyinProduct };
