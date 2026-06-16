import { useState } from 'react';
import { Sparkles, Copy, Check, Video, Heart, Radio, DollarSign, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/ui/Button';
import { generateContent } from '../services/api';

interface GeneratedContent {
  douyin_script: string;
  xiaohongshu_post: string;
  live_script: string;
  ad_titles: string[];
}

export default function ContentGeneratorPage() {
  const [productName, setProductName] = useState('');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!productName.trim()) return;

    setLoading(true);
    try {
      const response = await generateContent(productName.trim());
      if (response.success) {
        setContent(response.data);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">
          <span className="gradient-text">AI内容生成器</span>
        </h1>
        <p className="text-gray-400 mt-1">输入产品名称，AI自动生成带货内容</p>
      </div>

      {/* Input Section */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="输入产品名称，如：自动猫砂盆、智能喂食器..."
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button onClick={handleGenerate} disabled={loading || !productName.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成内容
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Content */}
      {content && (
        <div className="space-y-6">
          {/* Douyin Script */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold text-white">抖音脚本</h3>
              </div>
              <Button onClick={() => handleCopy(content.douyin_script, 'douyin')} className="h-8 px-3">
                {copied === 'douyin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-black/20 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-sans">
              {content.douyin_script}
            </pre>
          </div>

          {/* Xiaohongshu Content */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-white">小红书文案</h3>
              </div>
              <Button onClick={() => handleCopy(content.xiaohongshu_post, 'xiaohongshu')} className="h-8 px-3">
                {copied === 'xiaohongshu' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-black/20 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-sans">
              {content.xiaohongshu_post}
            </pre>
          </div>

          {/* Live Script */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">直播话术</h3>
              </div>
              <Button onClick={() => handleCopy(content.live_script, 'live')} className="h-8 px-3">
                {copied === 'live' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-black/20 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap font-sans">
              {content.live_script}
            </pre>
          </div>

          {/* Ad Titles */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">广告标题</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {content.ad_titles.map((title, i) => (
                <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                  <span className="text-amber-400 font-medium text-sm">{title}</span>
                  <Button onClick={() => handleCopy(title, `title-${i}`)} className="h-6 px-2 text-xs">
                    {copied === `title-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!content && !loading && (
        <div className="glass-card rounded-xl p-12 text-center">
          <Sparkles className="w-16 h-16 text-accent-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">AI内容生成器</h3>
          <p className="text-gray-400">输入产品名称，AI将自动生成：</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm">抖音脚本</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm">小红书文案</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm">直播话术</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm">广告标题</span>
          </div>
        </div>
      )}
    </div>
  );
}
