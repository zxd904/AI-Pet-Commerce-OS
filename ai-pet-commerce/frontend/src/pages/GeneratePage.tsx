import { useState } from 'react';
import { FileText, Tag, Video, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { productsAPI } from '../services/api';

export default function GeneratePage() {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState({
    title: '',
    selling_points: '',
    keywords: '',
    video_script: ''
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!productName.trim()) return;

    setLoading(true);

    try {
      const response = await productsAPI.generate(productName.trim());
      setGenerated({
        title: response.data.data.title || '',
        selling_points: response.data.data.selling_points || '',
        keywords: response.data.data.keywords || '',
        video_script: response.data.data.video_script || ''
      });
    } catch (err) {
      console.error('生成失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const contentFields = [
    { key: 'title', label: '商品标题', icon: FileText, placeholder: '输入商品名称生成标题' },
    { key: 'selling_points', label: '核心卖点', icon: Sparkles, placeholder: '生成3-5条核心卖点' },
    { key: 'keywords', label: 'SEO关键词', icon: Tag, placeholder: '生成相关关键词' },
    { key: 'video_script', label: '短视频脚本', icon: Video, placeholder: '生成30秒短视频脚本' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI内容生成</h1>
        <p className="text-gray-400 mt-1">自动生成商品标题、卖点、关键词和短视频脚本</p>
      </div>

      <div className="bg-gradient-card border-gradient rounded-xl p-6 shadow-glow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="输入商品名称，如：智能猫砂盆"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !productName.trim()}
            className="bg-gradient-primary py-3 px-6 rounded-xl font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span>{loading ? '生成中...' : 'AI生成'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentFields.map((field) => {
          const Icon = field.icon;
          const content = generated[field.key as keyof typeof generated];
          return (
            <div key={field.key} className="bg-gradient-card border-gradient rounded-xl p-5 shadow-glow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-medium">{field.label}</h3>
                </div>
                {content && (
                  <button
                    onClick={() => handleCopy(content, field.key)}
                    className="flex items-center gap-1 text-gray-400 hover:text-purple-400 text-sm transition-colors"
                  >
                    {copiedField === field.key ? (
                      <><Check className="w-4 h-4" /><span>已复制</span></>
                    ) : (
                      <><Copy className="w-4 h-4" /><span>复制</span></>
                    )}
                  </button>
                )}
              </div>
              
              <div className={`p-4 rounded-lg min-h-[120px] ${
                content ? 'bg-white/5' : 'bg-white/[0.02] border border-dashed border-white/10'
              }`}>
                {content ? (
                  <p className="text-white whitespace-pre-wrap">{content}</p>
                ) : (
                  <p className="text-gray-500 text-center py-6">{field.placeholder}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}