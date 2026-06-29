'use client';

import React, { useEffect, useRef } from 'react';
import type { AnalyticsData } from '@/models/analytics';

interface AdvancedChartsProps {
  analyticsData: AnalyticsData | null;
}

export default function AdvancedCharts({ analyticsData }: AdvancedChartsProps) {
  const usageChartRef = useRef<HTMLDivElement>(null);
  const performanceChartRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load plotly on the client side
    if (typeof window === 'undefined' || !analyticsData) return;

    import('plotly.js-dist')
      .then((Plotly) => {
        const PlotlyLib = Plotly.default || Plotly;

        // Usage Trends Chart
        const usageData = analyticsData.dailyUsage.slice(-14); // Last 14 days
        const usageTrace = {
          x: usageData.map((day) => new Date(day.date).toLocaleDateString()),
          y: usageData.map(
            (day) => day.conversations + day.messages + day.apiCalls
          ),
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          name: 'Total Usage',
          line: { color: '#3b82f6', width: 3 },
          marker: { size: 6, color: '#3b82f6' },
          fill: 'tozeroy',
          fillcolor: 'rgba(59, 130, 246, 0.1)',
        };

        const conversationsTrace = {
          x: usageData.map((day) => new Date(day.date).toLocaleDateString()),
          y: usageData.map((day) => day.conversations),
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: 'Conversations',
          line: { color: '#10b981', width: 2 },
        };

        const messagesTrace = {
          x: usageData.map((day) => new Date(day.date).toLocaleDateString()),
          y: usageData.map((day) => day.messages),
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: 'Messages',
          line: { color: '#f59e0b', width: 2 },
        };

        const layout = {
          title: {
            text: 'Usage Trends (Last 14 Days)',
            font: { size: 16, color: '#ffffff' },
          },
          xaxis: {
            title: 'Date',
            tickangle: -45,
            tickfont: { size: 10, color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          yaxis: {
            title: 'Count',
            gridcolor: '#374151',
            tickfont: { color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          margin: { l: 50, r: 50, t: 50, b: 80 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          showlegend: true,
          legend: { x: 0, y: 1.1, orientation: 'h', font: { color: '#9ca3af' } },
        };

        PlotlyLib.newPlot(
          usageChartRef.current,
          [usageTrace, conversationsTrace, messagesTrace],
          layout,
          { responsive: true, displayModeBar: false }
        );

        return () => {
          if (usageChartRef.current) {
            PlotlyLib.purge(usageChartRef.current);
          }
        };
      })
      .catch(console.error);
  }, [analyticsData]);

  useEffect(() => {
    if (!analyticsData || !performanceChartRef.current) return;

    import('plotly.js-dist')
      .then((Plotly) => {
        const PlotlyLib = Plotly.default || Plotly;

        // Agent Performance Chart
        const performanceData = analyticsData.agentPerformance.slice(0, 10); // Top 10 agents

        const performanceTrace = {
          x: performanceData.map(
            (agent) => agent.name || `Agent ${agent.agentId}`
          ),
          y: performanceData.map((agent) => agent.successRate || 0),
          type: 'bar' as const,
          name: 'Success Rate (%)',
          marker: {
            color: performanceData.map((agent) => {
              const rate = agent.successRate || 0;
              if (rate >= 95) return '#10b981';
              if (rate >= 85) return '#f59e0b';
              return '#ef4444';
            }),
          },
          text: performanceData.map(
            (agent) => `${agent.successRate?.toFixed(1)}%`
          ),
          textposition: 'auto' as const,
        };

        const responseTimeTrace = {
          x: performanceData.map(
            (agent) => agent.name || `Agent ${agent.agentId}`
          ),
          y: performanceData.map((agent) => agent.avgResponseTime || 0),
          type: 'scatter' as const,
          mode: 'markers' as const,
          name: 'Avg Response Time (ms)',
          yaxis: 'y2' as const,
          marker: { color: '#8b5cf6', size: 8 },
        };

        const performanceLayout = {
          title: {
            text: 'Agent Performance Overview',
            font: { size: 16, color: '#ffffff' },
          },
          xaxis: {
            title: 'Agent',
            tickangle: -45,
            tickfont: { size: 10, color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          yaxis: {
            title: 'Success Rate (%)',
            gridcolor: '#374151',
            tickfont: { color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          yaxis2: {
            title: 'Response Time (ms)',
            overlaying: 'y' as const,
            side: 'right' as const,
            showgrid: false,
            tickfont: { color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          margin: { l: 60, r: 60, t: 50, b: 100 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          showlegend: true,
          legend: { x: 0, y: 1.1, orientation: 'h', font: { color: '#9ca3af' } },
        };

        PlotlyLib.newPlot(
          performanceChartRef.current,
          [performanceTrace, responseTimeTrace],
          performanceLayout,
          { responsive: true, displayModeBar: false }
        );

        return () => {
          if (performanceChartRef.current) {
            PlotlyLib.purge(performanceChartRef.current);
          }
        };
      })
      .catch(console.error);
  }, [analyticsData]);

  useEffect(() => {
    if (!analyticsData || !revenueChartRef.current) return;

    import('plotly.js-dist')
      .then((Plotly) => {
        const PlotlyLib = Plotly.default || Plotly;

        // Revenue Trends Chart (if billing data exists)
        const revenueData = analyticsData.dailyUsage.slice(-14);
        const revenueTrace = {
          x: revenueData.map((day) => new Date(day.date).toLocaleDateString()),
          y: revenueData.map((day) => (day.messages + day.apiCalls) * 0.001), // Mock revenue calculation
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          name: 'Revenue ($)',
          line: { color: '#059669', width: 3 },
          marker: { size: 6, color: '#059669' },
          fill: 'tozeroy',
          fillcolor: 'rgba(5, 150, 105, 0.1)',
        };

        const revenueLayout = {
          title: {
            text: 'Revenue Trends (Last 14 Days)',
            font: { size: 16, color: '#ffffff' },
          },
          xaxis: {
            title: 'Date',
            tickangle: -45,
            tickfont: { size: 10, color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          yaxis: {
            title: 'Revenue ($)',
            gridcolor: '#374151',
            tickformat: '$.2f',
            tickfont: { color: '#9ca3af' },
            titlefont: { color: '#9ca3af' },
          },
          margin: { l: 50, r: 50, t: 50, b: 80 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
        };

        PlotlyLib.newPlot(
          revenueChartRef.current,
          [revenueTrace],
          revenueLayout,
          { responsive: true, displayModeBar: false }
        );

        return () => {
          if (revenueChartRef.current) {
            PlotlyLib.purge(revenueChartRef.current);
          }
        };
      })
      .catch(console.error);
  }, [analyticsData]);

  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <div ref={usageChartRef} className="w-full h-80" />
      </div>

      <div className="glass-card p-6">
        <div ref={performanceChartRef} className="w-full h-80" />
      </div>

      <div className="glass-card p-6">
        <div ref={revenueChartRef} className="w-full h-80" />
      </div>
    </div>
  );
}
