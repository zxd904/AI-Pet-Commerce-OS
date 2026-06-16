// Agent执行层 - 工具实现
import { prisma } from '../lib/prisma.js';
import { ProductDataSource, calculateProfitMargin } from './dataSourceService.js';
import { ProductDecision, generateProductDescription, generateMarketingContent } from './agentService.js';
import { getDouyinService, PET_CATEGORIES } from './douyinService.js';

// 工具执行结果
export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

// ==================== 工具1: 创建商品草稿 ====================
export async function createProduct(
  product: ProductDataSource,
  decision: ProductDecision
): Promise<ToolResult> {
  try {
    // 生成商品描述
    const description = await generateProductDescription(product);

    // 计算利润率
    const profitMargin = calculateProfitMargin(
      product.price,
      product.supplier_price,
      product.shipping_cost
    );

    // 保存到数据库
    const newProduct = await prisma.productItem.create({
      data: {
        title: product.title,
        description,
        price: product.price,
        cost: product.supplier_price + product.shipping_cost,
        profitMargin,
        score: decision.score,
        level: decision.level,
        decision: decision.decision,
        reason: decision.reason,
        recommendedPrice: decision.recommended_price,
        expectedProfit: decision.expected_profit_margin,
        status: 'draft',
        imageUrl: product.image_url,
        category: product.category,
        supplierPrice: product.supplier_price,
        shippingCost: product.shipping_cost,
        salesVolume: product.sales_volume,
        rating: product.rating,
        reviewCount: product.review_count,
        source: product.source,
        sourceUrl: product.source_url
      }
    });

    // 记录日志
    await logAction(newProduct.id, 'create_product', 'success', `创建商品草稿: ${product.title}`);

    console.log(`✅ [create_product] 成功创建商品 ID: ${newProduct.id}`);

    return {
      success: true,
      message: `商品草稿创建成功`,
      data: { productId: newProduct.id, title: product.title }
    };
  } catch (error: any) {
    console.error(`❌ [create_product] 创建失败:`, error.message);
    await logAction(null, 'create_product', 'failed', error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 工具2: 上架Shopify商品 ====================
export async function publishShopifyProduct(productId: number): Promise<ToolResult> {
  try {
    // 获取商品信息
    const product = await prisma.productItem.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return { success: false, message: '商品不存在' };
    }

    // 检查上架条件
    if (product.score < 75) {
      return { success: false, message: `评分不足: ${product.score} < 75` };
    }

    if (product.profitMargin && product.profitMargin < 20) {
      return { success: false, message: `利润率不足: ${product.profitMargin}% < 20%` };
    }

    // 模拟Shopify API调用
    // 实际生产环境需要配置真实的Shopify API
    const shopifyProductId = `shopify_${Date.now()}_${productId}`;

    // 更新商品状态
    await prisma.productItem.update({
      where: { id: productId },
      data: {
        status: 'listed',
        shopifyId: shopifyProductId
      }
    });

    // 记录日志
    await logAction(productId, 'publish_shopify', 'success', `上架成功，Shopify ID: ${shopifyProductId}`);

    console.log(`✅ [publish_shopify] 商品上架成功: ${product.title}`);

    return {
      success: true,
      message: '商品已上架到Shopify',
      data: { shopifyId: shopifyProductId }
    };
  } catch (error: any) {
    console.error(`❌ [publish_shopify] 上架失败:`, error.message);
    await logAction(productId, 'publish_shopify', 'failed', error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 工具3: 获取供应商数据 ====================
export async function fetchSupplierData(productName: string): Promise<ToolResult> {
  try {
    // 模拟从1688获取供应商数据
    // 实际生产环境需要接入1688开放平台API
    const supplierData = {
      name: `供应商_${productName.substring(0, 10)}`,
      platform: '1688',
      supplierPrice: Math.random() * 50 + 10,
      moq: Math.floor(Math.random() * 100) + 10,
      leadTime: Math.floor(Math.random() * 7) + 3,
      quality: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      reliability: Math.random() * 0.5 + 0.5
    };

    // 保存供应商信息
    const supplier = await prisma.supplier.create({
      data: {
        name: supplierData.name,
        platform: supplierData.platform,
        supplierPrice: supplierData.supplierPrice,
        moq: supplierData.moq,
        leadTime: supplierData.leadTime,
        quality: supplierData.quality,
        reliability: supplierData.reliability
      }
    });

    await logAction(null, 'fetch_supplier', 'success', `获取供应商: ${supplierData.name}`);

    console.log(`✅ [fetch_supplier] 获取供应商数据: ${productName}`);

    return {
      success: true,
      message: '供应商数据获取成功',
      data: supplier
    };
  } catch (error: any) {
    console.error(`❌ [fetch_supplier] 获取失败:`, error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 工具4: 生成营销内容 ====================
export async function generateMarketing(
  productId: number,
  platform: 'tiktok' | 'xiaohongshu' | 'seo'
): Promise<ToolResult> {
  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return { success: false, message: '商品不存在' };
    }

    const content = await generateMarketingContent(product.title, platform);

    await logAction(productId, `generate_${platform}`, 'success', `生成${platform}营销内容`);

    console.log(`✅ [generate_marketing] 生成${platform}内容: ${product.title}`);

    return {
      success: true,
      message: `${platform}营销内容生成成功`,
      data: { content }
    };
  } catch (error: any) {
    console.error(`❌ [generate_marketing] 生成失败:`, error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 工具5: 更新商品价格 ====================
export async function updateProductPrice(productId: number, newPrice: number): Promise<ToolResult> {
  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return { success: false, message: '商品不存在' };
    }

    const oldPrice = product.price;

    await prisma.productItem.update({
      where: { id: productId },
      data: { price: newPrice }
    });

    await logAction(productId, 'update_price', 'success', `价格更新: $${oldPrice} -> $${newPrice}`);

    console.log(`✅ [update_price] 价格更新: ${product.title} $${oldPrice} -> $${newPrice}`);

    return {
      success: true,
      message: '价格更新成功',
      data: { oldPrice, newPrice }
    };
  } catch (error: any) {
    console.error(`❌ [update_price] 更新失败:`, error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 辅助函数：记录日志 ====================
async function logAction(
  productId: number | null,
  action: string,
  result: string,
  message: string,
  details?: any
): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        productId,
        action,
        result,
        message,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (error) {
    console.error('日志记录失败:', error);
  }
}

// ==================== 自动选品流程 ====================
export async function runAutoSelection(): Promise<{
  total: number;
  processed: number;
  listed: number;
  rejected: number;
}> {
  console.log('🚀 开始执行自动选品流程...');

  // 创建任务记录
  const task = await prisma.selectionTask.create({
    data: {
      status: 'running',
      startedAt: new Date()
    }
  });

  try {
    // Step 1: 获取所有数据源
    const { fetchAllSources } = await import('./dataSourceService.js');
    const products = await fetchAllSources();

    // Step 2: AI评分
    const { scoreProductsBatch } = await import('./agentService.js');
    const decisions = await scoreProductsBatch(products);

    let listed = 0;
    let rejected = 0;

    // Step 3: 创建所有商品草稿
    const createdProducts: { id: number; decision: ProductDecision }[] = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const decision = decisions[i];
      
      // 创建商品草稿
      const result = await createProduct(product, decision);
      if (result.success && result.data?.productId) {
        createdProducts.push({ id: result.data.productId, decision });
      }
    }

    // Step 4: 筛选TOP20并上架
    const topProducts = createdProducts
      .filter(p => p.decision.decision === 'LIST')
      .sort((a, b) => b.decision.score - a.decision.score)
      .slice(0, 20);

    for (const item of topProducts) {
      const result = await publishShopifyProduct(item.id);
      if (result.success) {
        listed++;
      } else {
        rejected++;
      }
    }

    // 统计拒绝数量
    rejected += createdProducts.filter(p => p.decision.decision === 'REJECT').length;

    // 更新任务状态
    await prisma.selectionTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        totalItems: products.length,
        processed: decisions.length,
        listed,
        rejected,
        completedAt: new Date()
      }
    });

    console.log(`✅ 自动选品完成: 总计${products.length}个，上架${listed}个，拒绝${rejected}个`);

    return {
      total: products.length,
      processed: decisions.length,
      listed,
      rejected
    };
  } catch (error: any) {
    await prisma.selectionTask.update({
      where: { id: task.id },
      data: {
        status: 'failed',
        completedAt: new Date()
      }
    });

    console.error('❌ 自动选品失败:', error);
    throw error;
  }
}

// ==================== 回滚操作 ====================
export async function rollbackProduct(productId: number): Promise<ToolResult> {
  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return { success: false, message: '商品不存在' };
    }

    if (product.status !== 'listed') {
      return { success: false, message: '商品未上架，无需回滚' };
    }

    // 更新状态为草稿
    await prisma.productItem.update({
      where: { id: productId },
      data: {
        status: 'draft',
        shopifyId: null
      }
    });

    await logAction(productId, 'rollback', 'success', '商品已回滚');

    console.log(`✅ [rollback] 商品已回滚: ${product.title}`);

    return {
      success: true,
      message: '商品已回滚到草稿状态'
    };
  } catch (error: any) {
    console.error(`❌ [rollback] 回滚失败:`, error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 抖音小店上架 ====================
export async function publishToDouyin(productId: number): Promise<ToolResult> {
  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return { success: false, message: '商品不存在' };
    }

    // 检查上架条件
    if (product.score < 75) {
      return { success: false, message: `评分不足: ${product.score} < 75` };
    }

    if (product.profitMargin && product.profitMargin < 20) {
      return { success: false, message: `利润率不足: ${product.profitMargin}% < 20%` };
    }

    // 获取抖音小店服务实例
    const douyinService = getDouyinService();
    
    if (!douyinService) {
      // 未配置抖音API，返回模拟结果
      const mockDouyinId = `douyin_${Date.now()}_${productId}`;
      
      await prisma.productItem.update({
        where: { id: productId },
        data: {
          douyinProductId: mockDouyinId,
          douyinStatus: 'draft'
        }
      });

      await logAction(productId, 'publish_douyin', 'success', 
        `抖音小店API未配置，已创建模拟上架记录。请在.env中配置DOUYIN_APP_ID和DOUYIN_APP_SECRET`);

      return {
        success: true,
        message: '⚠️ 抖音小店API未配置，已创建模拟记录。请配置API凭证后重新上架。',
        data: { douyinProductId: mockDouyinId, needConfig: true }
      };
    }

    // 获取类目ID
    const categoryInfo = PET_CATEGORIES[product.category || '宠物用品'] || PET_CATEGORIES['宠物用品'];

    // 调用抖音API创建商品
    const result = await douyinService.createProduct({
      name: product.title,
      description: product.description || product.title,
      price: Math.round(product.price * 100), // 转换为分
      market_price: Math.round((product.recommendedPrice || product.price) * 100),
      category_id: categoryInfo.category_id,
      img: product.imageUrl ? [product.imageUrl] : [],
      outer_product_id: `pet_${productId}_${Date.now()}`
    });

    if (result.code === 0 && result.data) {
      // 创建成功，提交审核
      const listResult = await douyinService.listProduct(result.data.product_id);
      
      await prisma.productItem.update({
        where: { id: productId },
        data: {
          douyinProductId: result.data.product_id,
          douyinStatus: listResult.code === 0 ? 'auditing' : 'draft'
        }
      });

      await logAction(productId, 'publish_douyin', 'success', 
        `抖音小店商品已提交审核，商品ID: ${result.data.product_id}`);

      return {
        success: true,
        message: '商品已提交到抖音小店，等待审核',
        data: { douyinProductId: result.data.product_id }
      };
    } else {
      await logAction(productId, 'publish_douyin', 'failed', result.message);
      return { success: false, message: `抖音小店上架失败: ${result.message}` };
    }
  } catch (error: any) {
    console.error(`❌ [publish_douyin] 上架失败:`, error.message);
    await logAction(productId, 'publish_douyin', 'failed', error.message);
    return { success: false, message: error.message };
  }
}

// ==================== 抖音小店下架 ====================
export async function delistFromDouyin(productId: number): Promise<ToolResult> {
  try {
    const product = await prisma.productItem.findUnique({
      where: { id: productId }
    });

    if (!product || !product.douyinProductId) {
      return { success: false, message: '商品不存在或未上架到抖音小店' };
    }

    const douyinService = getDouyinService();
    
    if (!douyinService) {
      await prisma.productItem.update({
        where: { id: productId },
        data: { douyinStatus: 'offline' }
      });
      return { success: true, message: '商品已下架（模拟）' };
    }

    const result = await douyinService.delistProduct(product.douyinProductId);
    
    if (result.code === 0) {
      await prisma.productItem.update({
        where: { id: productId },
        data: { douyinStatus: 'offline' }
      });

      await logAction(productId, 'delist_douyin', 'success', '抖音小店商品已下架');
      return { success: true, message: '商品已从抖音小店下架' };
    } else {
      return { success: false, message: `下架失败: ${result.message}` };
    }
  } catch (error: any) {
    console.error(`❌ [delist_douyin] 下架失败:`, error.message);
    return { success: false, message: error.message };
  }
}
