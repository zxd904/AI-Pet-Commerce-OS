/**
 * Railway 部署检查脚本
 * 用于验证项目是否满足 Railway 部署要求
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const checks = [];
let allPassed = true;

// 检查函数
function check(name, condition, message) {
  const passed = condition;
  checks.push({ name, passed, message });
  if (!passed) allPassed = false;
  return passed;
}

console.log('🔍 AI Pet Commerce OS - Railway 部署检查\n');
console.log('=' .repeat(50));

// 1. 检查 package.json
console.log('\n📦 检查 package.json...');
try {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  
  check('package.json 存在', true, '✅ package.json 文件存在');
  check('scripts.start 存在', !!packageJson.scripts?.start, `✅ start: ${packageJson.scripts?.start || '❌ 未定义'}`);
  check('scripts.build 存在', !!packageJson.scripts?.build, `✅ build: ${packageJson.scripts?.build || '❌ 未定义'}`);
  check('scripts.db:migrate 存在', !!packageJson.scripts?.['db:migrate'], `✅ db:migrate: ${packageJson.scripts?.['db:migrate'] || '❌ 未定义'}`);
  check('type 为 module', packageJson.type === 'module', `✅ type: ${packageJson.type || '❌ 未设置'}`);
  check('engines.node 存在', !!packageJson.engines?.node, `✅ engines.node: ${packageJson.engines?.node || '❌ 未设置'}`);
} catch (e) {
  check('package.json 存在', false, `❌ 无法读取 package.json: ${e.message}`);
}

// 2. 检查 dist/index.js
console.log('\n📂 检查构建输出...');
check('dist 目录存在', existsSync(join(rootDir, 'dist')), existsSync(join(rootDir, 'dist')) ? '✅ dist 目录存在' : '❌ dist 目录不存在');
check('dist/index.js 存在', existsSync(join(rootDir, 'dist', 'index.js')), existsSync(join(rootDir, 'dist', 'index.js')) ? '✅ dist/index.js 存在' : '❌ dist/index.js 不存在');

// 3. 检查 tsconfig.json
console.log('\n⚙️ 检查 tsconfig.json...');
try {
  const tsconfig = JSON.parse(readFileSync(join(rootDir, 'tsconfig.json'), 'utf-8'));
  check('outDir 设置为 dist', tsconfig.compilerOptions?.outDir === 'dist' || tsconfig.compilerOptions?.outDir === './dist', `✅ outDir: ${tsconfig.compilerOptions?.outDir || '❌ 未设置'}`);
  check('target 为 ES2020+', ['ES2020', 'ES2021', 'ES2022', 'ESNext'].includes(tsconfig.compilerOptions?.target), `✅ target: ${tsconfig.compilerOptions?.target}`);
} catch (e) {
  check('tsconfig.json 存在', false, `❌ 无法读取 tsconfig.json: ${e.message}`);
}

// 4. 检查 prisma/schema.prisma
console.log('\n🗄️ 检查 Prisma 配置...');
check('prisma/schema.prisma 存在', existsSync(join(rootDir, 'prisma', 'schema.prisma')), existsSync(join(rootDir, 'prisma', 'schema.prisma')) ? '✅ prisma/schema.prisma 存在' : '❌ prisma/schema.prisma 不存在');

try {
  const schema = readFileSync(join(rootDir, 'prisma', 'schema.prisma'), 'utf-8');
  check('database provider 设置', schema.includes('provider'), '✅ database provider 已设置');
  check('DATABASE_URL 环境变量', schema.includes('env('), '✅ DATABASE_URL 环境变量已配置');
} catch (e) {
  check('prisma/schema.prisma 可读', false, `❌ 无法读取 schema.prisma`);
}

// 5. 检查 railway.json
console.log('\n🚂 检查 Railway 配置...');
try {
  const railway = JSON.parse(readFileSync(join(rootDir, 'railway.json'), 'utf-8'));
  check('railway.json 存在', true, '✅ railway.json 存在');
  check('deploy.startCommand 存在', !!railway.deploy?.startCommand, `✅ startCommand: ${railway.deploy?.startCommand || '❌ 未设置'}`);
  check('deploy.healthcheckPath 存在', !!railway.deploy?.healthcheckPath, `✅ healthcheckPath: ${railway.deploy?.healthcheckPath || '❌ 未设置'}`);
} catch (e) {
  check('railway.json 存在', false, `❌ railway.json 不存在或格式错误`);
}

// 6. 检查环境变量
console.log('\n🔐 检查环境变量支持...');
try {
  const indexSrc = readFileSync(join(rootDir, 'src', 'index.ts'), 'utf-8');
  check('PORT 环境变量支持', indexSrc.includes('process.env.PORT'), '✅ PORT 环境变量已支持');
  check('CORS 环境变量支持', indexSrc.includes('process.env.CORS_ORIGIN'), '✅ CORS_ORIGIN 环境变量已支持');
} catch (e) {
  check('src/index.ts 可读', false, `❌ 无法读取 src/index.ts`);
}

try {
  const authService = readFileSync(join(rootDir, 'src', 'services', 'authService.ts'), 'utf-8');
  check('JWT_SECRET 环境变量支持', authService.includes('process.env.JWT_SECRET'), '✅ JWT_SECRET 环境变量已支持');
} catch (e) {
  check('authService.ts 可读', false, `❌ 无法读取 authService.ts`);
}

// 输出检查结果
console.log('\n' + '=' .repeat(50));
console.log('\n📊 检查结果汇总:\n');

checks.forEach(({ name, passed, message }) => {
  console.log(`${passed ? '✅' : '❌'} ${message}`);
});

console.log('\n' + '=' .repeat(50));

if (allPassed) {
  console.log('\n🎉 所有检查通过！项目已准备好部署到 Railway。\n');
  console.log('📋 Railway 部署配置:');
  console.log('   Root Directory: server');
  console.log('   Build Command:  npm run build');
  console.log('   Start Command:  npm run db:migrate && npm start');
  console.log('   Health Check:   /api/health\n');
  process.exit(0);
} else {
  console.log('\n⚠️  部分检查未通过，请修复后再部署。\n');
  process.exit(1);
}
