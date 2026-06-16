/**
 * 资源监控模块
 * 监控模型资源占用、性能指标和限制控制
 */

import { modelLogger } from './logger.js';

export interface ResourceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    pending: number;
    active: number;
    completed: number;
    failed: number;
  };
  models: {
    loaded: number;
    total: number;
    avgResponseTime: number;
  };
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxConcurrentRequests: number;
  maxQueueSize: number;
  requestTimeoutMs: number;
}

export interface PerformanceStats {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
}

const DEFAULT_LIMITS: ResourceLimits = {
  maxMemoryMB: 8192,
  maxCpuPercent: 80,
  maxConcurrentRequests: 10,
  maxQueueSize: 100,
  requestTimeoutMs: 60000
};

/**
 * 资源监控器
 */
export class ResourceMonitor {
  private limits: ResourceLimits;
  private metricsHistory: ResourceMetrics[] = [];
  private responseTimes: number[] = [];
  private requestStats = {
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0
  };
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly historySize = 1000;
  private readonly monitorIntervalMs = 5000;

  constructor(limits: Partial<ResourceLimits> = {}) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  /**
   * 启动监控
   */
  start(): void {
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, this.monitorIntervalMs);

    modelLogger.info('资源监控已启动', this.limits);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    modelLogger.info('资源监控已停止');
  }

  /**
   * 收集指标
   */
  private collectMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics: ResourceMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为毫秒
        cores: require('os').cpus().length
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      requests: { ...this.requestStats },
      models: {
        loaded: 0,
        total: 0,
        avgResponseTime: this.calculateAvgResponseTime()
      }
    };

    this.metricsHistory.push(metrics);
    
    // 限制历史记录大小
    if (this.metricsHistory.length > this.historySize) {
      this.metricsHistory.shift();
    }

    // 检查资源限制
    this.checkLimits(metrics);
  }

  /**
   * 检查资源限制
   */
  private checkLimits(metrics: ResourceMetrics): void {
    // 检查内存限制
    if (metrics.memory.used > this.limits.maxMemoryMB) {
      modelLogger.warn(`内存使用超过限制: ${metrics.memory.used}MB > ${this.limits.maxMemoryMB}MB`);
    }

    // 检查请求队列
    if (this.requestStats.pending > this.limits.maxQueueSize) {
      modelLogger.warn(`请求队列超过限制: ${this.requestStats.pending} > ${this.limits.maxQueueSize}`);
    }
  }

  /**
   * 记录请求开始
   */
  recordRequestStart(): void {
    this.requestStats.pending++;
  }

  /**
   * 记录请求激活
   */
  recordRequestActive(): void {
    this.requestStats.pending--;
    this.requestStats.active++;
  }

  /**
   * 记录请求完成
   */
  recordRequestComplete(responseTime: number, success: boolean): void {
    this.requestStats.active--;
    if (success) {
      this.requestStats.completed++;
    } else {
      this.requestStats.failed++;
    }

    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.historySize) {
      this.responseTimes.shift();
    }
  }

  /**
   * 计算平均响应时间
   */
  private calculateAvgResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): ResourceMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * 获取历史指标
   */
  getMetricsHistory(count: number = 100): ResourceMetrics[] {
    return this.metricsHistory.slice(-count);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): PerformanceStats {
    const times = this.responseTimes;
    const sorted = [...times].sort((a, b) => a - b);

    return {
      totalRequests: this.requestStats.completed + this.requestStats.failed,
      successRequests: this.requestStats.completed,
      failedRequests: this.requestStats.failed,
      avgResponseTime: this.calculateAvgResponseTime(),
      minResponseTime: sorted[0] || 0,
      maxResponseTime: sorted[sorted.length - 1] || 0,
      p50ResponseTime: this.percentile(sorted, 50),
      p95ResponseTime: this.percentile(sorted, 95),
      p99ResponseTime: this.percentile(sorted, 99),
      throughput: this.calculateThroughput()
    };
  }

  /**
   * 计算百分位数
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * 计算吞吐量
   */
  private calculateThroughput(): number {
    if (this.metricsHistory.length < 2) return 0;

    const recent = this.metricsHistory.slice(-10);
    const timeDiff = (recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime()) / 1000;
    const requestDiff = recent.reduce((sum, m) => sum + m.requests.completed, 0);

    return timeDiff > 0 ? Math.round(requestDiff / timeDiff * 100) / 100 : 0;
  }

  /**
   * 检查是否可以接受新请求
   */
  canAcceptRequest(): { allowed: boolean; reason?: string } {
    if (this.requestStats.pending >= this.limits.maxQueueSize) {
      return { allowed: false, reason: '请求队列已满' };
    }

    if (this.requestStats.active >= this.limits.maxConcurrentRequests) {
      return { allowed: false, reason: '并发请求已达上限' };
    }

    const metrics = this.getCurrentMetrics();
    if (metrics && metrics.memory.percentage > 90) {
      return { allowed: false, reason: '内存使用率过高' };
    }

    return { allowed: true };
  }

  /**
   * 获取资源限制
   */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  /**
   * 更新资源限制
   */
  updateLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
    modelLogger.info('资源限制已更新', this.limits);
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.requestStats = {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0
    };
    this.responseTimes = [];
    modelLogger.info('统计数据已重置');
  }

  /**
   * 导出报告
   */
  exportReport(): string {
    const metrics = this.getCurrentMetrics();
    const stats = this.getPerformanceStats();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      currentMetrics: metrics,
      performanceStats: stats,
      limits: this.limits,
      requestStats: this.requestStats
    }, null, 2);
  }
}

// 单例实例
export const resourceMonitor = new ResourceMonitor();
