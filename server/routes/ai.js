import express from 'express';
import { generateProducts, generateProductDetail } from '../services/aiService.js';

const router = express.Router();

// POST /api/ai/selection - 选品分析
router.post('/selection', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '请输入关键词'
      });
    }

    console.log(`📊 开始分析: ${keyword}`);

    const result = await generateProducts(keyword.trim());

    console.log(`✅ 分析完成，生成 ${result.products?.length || 0} 个产品`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ 选品分析失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
});

// POST /api/ai/product-detail - 产品详情
router.post('/product-detail', async (req, res) => {
  try {
    const { keyword, productName } = req.body;

    if (!keyword || !productName) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    console.log(`📝 生成详情: ${productName}`);

    const result = await generateProductDetail(keyword, productName);

    console.log(`✅ 详情生成完成`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ 详情生成失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
});

export default router;
