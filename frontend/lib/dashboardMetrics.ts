// Mock analytics data for the dashboard
// This will be replaced with real API data later

export interface ApiMetrics {
  date: string;
  requests: number;
  latency: number;
  successRate: number;
  failureRate: number;
  tokenUsage: number;
  responseSize: number;
}

export interface ModelUsage {
  model: string;
  usage: number;
  percentage: number;
  color: string;
}

export interface ErrorType {
  type: string;
  count: number;
  percentage: number;
}

export interface GeographicData {
  region: string;
  requests: number;
  percentage: number;
}

export interface PeakTraffic {
  hour: number;
  requests: number;
}

export interface CostData {
  model: string;
  cost: number;
  percentage: number;
}

// Generate mock data for the last 7 days
export const generateApiMetrics = (): ApiMetrics[] => {
  const data: ApiMetrics[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      requests: Math.floor(Math.random() * 2000) + 1500,
      latency: Math.floor(Math.random() * 800) + 150,
      successRate: Math.floor(Math.random() * 10) + 90,
      failureRate: Math.floor(Math.random() * 10),
      tokenUsage: Math.floor(Math.random() * 50000) + 20000,
      responseSize: Math.floor(Math.random() * 500) + 100
    });
  }
  
  return data;
};

// Model usage distribution
export const generateModelUsage = (): ModelUsage[] => {
  return [
    { model: 'GPT-4', usage: 35, percentage: 35, color: '#6366f1' },
    { model: 'Claude-3', usage: 28, percentage: 28, color: '#ec4899' },
    { model: 'Gemini 2.0', usage: 22, percentage: 22, color: '#14b8a6' },
    { model: 'Llama 2', usage: 15, percentage: 15, color: '#f59e0b' }
  ];
};

// Success vs Failure rates
export const generateSuccessFailureData = (): Array<{ day: string; successful: number; failed: number }> => {
  const data: ApiMetrics[] = generateApiMetrics();
  return data.map((metric, idx) => ({
    day: `Day ${idx + 1}`,
    successful: Math.floor(metric.requests * (metric.successRate / 100)),
    failed: Math.floor(metric.requests * (metric.failureRate / 100))
  }));
};

// Peak traffic hours
export const generatePeakTraffic = (): PeakTraffic[] => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    requests: Math.floor(Math.random() * 1000) + (i >= 8 && i <= 18 ? 500 : 100)
  }));
};

// Error breakdown
export const generateErrorTypes = (): ErrorType[] => {
  const errors = [
    { type: '4xx Errors', count: 145 },
    { type: '5xx Errors', count: 38 },
    { type: 'Timeouts', count: 22 }
  ];
  
  const total = errors.reduce((sum, e) => sum + e.count, 0);
  
  return errors.map(error => ({
    ...error,
    percentage: Math.round((error.count / total) * 100)
  }));
};

// Geographic distribution
export const generateGeographicData = (): GeographicData[] => {
  const regions = [
    { region: 'North America', requests: 3500 },
    { region: 'Europe', requests: 2100 },
    { region: 'Asia Pacific', requests: 1800 },
    { region: 'South America', requests: 800 },
    { region: 'Africa', requests: 400 }
  ];
  
  const total = regions.reduce((sum, r) => sum + r.requests, 0);
  
  return regions.map(region => ({
    ...region,
    percentage: Math.round((region.requests / total) * 100)
  }));
};

// Cost estimation by model
export const generateCostData = (): CostData[] => {
  const costs = [
    { model: 'GPT-4', cost: 245.50 },
    { model: 'Claude-3', cost: 156.30 },
    { model: 'Gemini 2.0', cost: 98.75 },
    { model: 'Llama 2', cost: 45.20 }
  ];
  
  const total = costs.reduce((sum, c) => sum + c.cost, 0);
  
  return costs.map(cost => ({
    ...cost,
    percentage: Math.round((cost.cost / total) * 100)
  }));
};

// Token usage trend
export const generateTokenUsageTrend = (): Array<{ date: string; tokens: number }> => {
  return generateApiMetrics().map(metric => ({
    date: metric.date,
    tokens: metric.tokenUsage
  }));
};

// Summary statistics
export const generateDashboardStats = () => {
  const metrics = generateApiMetrics();
  const lastMetric = metrics[metrics.length - 1];
  const prevMetric = metrics[metrics.length - 2];
  
  const totalRequests = metrics.reduce((sum, m) => sum + m.requests, 0);
  const avgLatency = Math.round(metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length);
  const avgSuccessRate = Math.round(metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length);
  
  return {
    totalRequests,
    requestChange: Math.round(((lastMetric.requests - prevMetric.requests) / prevMetric.requests) * 100),
    avgLatency,
    latencyChange: Math.round(((lastMetric.latency - prevMetric.latency) / prevMetric.latency) * 100),
    avgSuccessRate,
    successChange: Math.round(((lastMetric.successRate - prevMetric.successRate) / prevMetric.successRate) * 100),
    totalCost: generateCostData().reduce((sum, c) => sum + c.cost, 0)
  };
};
