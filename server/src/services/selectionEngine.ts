import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { analyzeProduct, generateContent, isOllamaAvailable, analyzeProductsBatch } from '../services/llmService.js';

const PRODUCT_CATEGORIES = [
  '自动猫砂盆',
  '智能喂食器',
  '宠物饮水机',
  '智能逗猫器',
  '宠物监控摄像头',
  '智能宠物项圈',
  '宠物空气净化器',
  '宠物烘干箱'
];

let isRunning = false;

export async function runSelection(): Promise<void> {
  if (isRunning) {
    console.log('⚠️ 选品任务正在运行中，跳过此次调用');
    return;
  }
  
  isRunning = true;
  console.log('🚀 开始执行自动选品任务...');
  
  try {
    const ollamaAvailable = await isOllamaAvailable();
    console.log(ollamaAvailable ? '✅ Ollama服务可用，使用本地模型分析' : '⚠️ Ollama服务不可用，使用fallback数据');

    const analyses = await analyzeProductsBatch(PRODUCT_CATEGORIES);

    for (const analysis of analyses) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: { productName: analysis.product_name }
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { productName: analysis.product_name },
            data: {
              painPoint: analysis.pain_point,
              sellingPoints: JSON.stringify(analysis.selling_points),
              viralScore: analysis.viral_score,
              targetUsers: analysis.target_users,
              recommendation: analysis.recommendation
            }
          });
          console.log(`✅ 更新产品: ${analysis.product_name}`);
        } else {
          await prisma.product.create({
            data: {
              productName: analysis.product_name,
              painPoint: analysis.pain_point,
              sellingPoints: JSON.stringify(analysis.selling_points),
              viralScore: analysis.viral_score,
              targetUsers: analysis.target_users,
              recommendation: analysis.recommendation
            }
          });
          console.log(`✅ 创建产品: ${analysis.product_name}`);
        }
      } catch (error) {
        console.error(`❌ 保存失败 ${analysis.product_name}:`, error);
      }
    }

    console.log('🎉 自动选品任务完成！');
  } finally {
    isRunning = false;
  }
}

export async function generateAllContent(): Promise<void> {
  console.log('📝 开始生成内容...');
  
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    try {
      console.log(`正在生成内容: ${product.productName}`);
      const content = await generateContent(product.productName);
      
      const existingContent = await prisma.content.findUnique({
        where: { productId: product.id }
      });

      if (existingContent) {
        await prisma.content.update({
          where: { productId: product.id },
          data: {
            douyinScript: content.douyin_script,
            xiaohongshuPost: content.xiaohongshu_post,
            liveScript: content.live_script,
            adTitles: JSON.stringify(content.ad_titles)
          }
        });
      } else {
        await prisma.content.create({
          data: {
            productId: product.id,
            douyinScript: content.douyin_script,
            xiaohongshuPost: content.xiaohongshu_post,
            liveScript: content.live_script,
            adTitles: JSON.stringify(content.ad_titles)
          }
        });
      }
    } catch (error) {
      console.error(`❌ 生成内容失败 ${product.productName}:`, error);
    }
  }
  
  console.log('✅ 内容生成完成！');
}

export function startCronJob(): void {
  const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *';
  
  cron.schedule(schedule, async () => {
    console.log(`⏰ 定时任务触发: ${new Date().toLocaleString()}`);
    await runSelection();
    await generateAllContent();
  });
  
  console.log(`⏰ 定时任务已启动，每6小时执行一次 (${schedule})`);
}

export function isSelectionRunning(): boolean {
  return isRunning;
}