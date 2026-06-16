import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-cyan-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case '强烈推荐': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case '推荐': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case '观察': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
}
