/**
 * DATA SCIENCE TOOLS — Profiling, cleaning, visualization, feature engineering, model comparison
 * DB models: DataProfile, DataCleanJob, DataVisualization, MlModelRecord
 */

import prisma from '../lib/prisma.js';

export const DATA_SCIENCE_TOOL_DEFINITIONS = [
  {
    name: 'data_profile',
    description: 'Profile a dataset — column stats, distributions, missing values, correlations.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['profile', 'list', 'get', 'delete'], description: 'Operation' },
        profileId: { type: 'string', description: 'Profile ID' },
        name:      { type: 'string', description: 'Dataset name' },
        data:      { type: 'array', description: 'Array of row objects', items: { type: 'object' } },
        columns:   { type: 'array', description: 'Column names to profile (default: all)', items: { type: 'string' } },
      },
      required: ['operation'],
    },
  },
  {
    name: 'data_clean',
    description: 'Clean and transform datasets — handle nulls, outliers, duplicates, type coercion.',
    input_schema: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['clean', 'list', 'get', 'preview'], description: 'Operation' },
        jobId:      { type: 'string', description: 'Clean job ID' },
        name:       { type: 'string', description: 'Job name' },
        data:       { type: 'array', description: 'Raw data rows', items: { type: 'object' } },
        rules:      { type: 'array', description: 'Cleaning rules [{ type, column, config }]', items: { type: 'object' } },
      },
      required: ['operation'],
    },
  },
  {
    name: 'data_visualize',
    description: 'Generate data visualizations — charts, heatmaps, distributions, scatter plots.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'list', 'get', 'delete'], description: 'Operation' },
        vizId:     { type: 'string', description: 'Visualization ID' },
        name:      { type: 'string', description: 'Chart name' },
        type:      { type: 'string', enum: ['bar', 'line', 'scatter', 'pie', 'heatmap', 'histogram', 'box'], description: 'Chart type' },
        data:      { type: 'array', description: 'Data points', items: { type: 'object' } },
        xAxis:     { type: 'string', description: 'X-axis column' },
        yAxis:     { type: 'string', description: 'Y-axis column' },
        groupBy:   { type: 'string', description: 'Group/color by column' },
        options:   { type: 'object', description: '{ title, width, height, colors }' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'feature_engineer',
    description: 'Automated feature engineering — derive new features, encode categoricals, scale numerics.',
    input_schema: {
      type: 'object',
      properties: {
        data:        { type: 'array', description: 'Input data rows', items: { type: 'object' } },
        operations:  { type: 'array', description: 'Operations [{ type, columns, config }]', items: { type: 'object' } },
        target:      { type: 'string', description: 'Target column (for supervised feature selection)' },
      },
      required: ['data'],
    },
  },
  {
    name: 'model_compare',
    description: 'Compare ML model performances — accuracy, precision, recall, F1, confusion matrix.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['register', 'compare', 'list', 'get', 'delete'], description: 'Operation' },
        modelId:   { type: 'string', description: 'Model record ID' },
        name:      { type: 'string', description: 'Model name' },
        algorithm: { type: 'string', description: 'Algorithm name (e.g., random_forest, xgboost)' },
        metrics:   { type: 'object', description: '{ accuracy, precision, recall, f1, auc, mse, r2 }' },
        params:    { type: 'object', description: 'Hyperparameters used' },
        modelIds:  { type: 'array', description: 'Model IDs to compare', items: { type: 'string' } },
      },
      required: ['operation'],
    },
  },
];

export async function executeDataScienceTool(toolName, input, ctx = {}) {
  const userId = ctx.userId || 'anonymous';
  try {
    switch (toolName) {

      case 'data_profile': {
        switch (input.operation) {
          case 'profile': {
            const data = input.data || [];
            if (data.length === 0) return { result: JSON.stringify({ status: 'error', error: 'No data provided' }) };

            const columns = input.columns || Object.keys(data[0]);
            const stats = {};
            columns.forEach(col => {
              const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined);
              const nums = values.filter(v => typeof v === 'number' || !isNaN(Number(v))).map(Number);
              stats[col] = {
                count: values.length,
                missing: data.length - values.length,
                missingPct: Math.round(((data.length - values.length) / data.length) * 100),
                unique: new Set(values).size,
                type: nums.length === values.length && values.length > 0 ? 'numeric' : 'categorical',
              };
              if (nums.length > 0) {
                nums.sort((a, b) => a - b);
                stats[col].min = nums[0];
                stats[col].max = nums[nums.length - 1];
                stats[col].mean = Math.round(nums.reduce((s, n) => s + n, 0) / nums.length * 100) / 100;
                stats[col].median = nums[Math.floor(nums.length / 2)];
                const variance = nums.reduce((s, n) => s + Math.pow(n - stats[col].mean, 2), 0) / nums.length;
                stats[col].stddev = Math.round(Math.sqrt(variance) * 100) / 100;
              } else {
                const freq = {};
                values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
                const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                stats[col].topValues = sorted.slice(0, 5).map(([val, count]) => ({ value: val, count }));
              }
            });

            const profile = await prisma.dataProfile.create({
              data: { userId, name: input.name || 'Dataset', rowCount: data.length, columnCount: columns.length, columns: stats },
            });
            return { result: JSON.stringify({ status: 'success', profileId: profile.id, rows: data.length, columns: stats }) };
          }
          case 'list': {
            const profiles = await prisma.dataProfile.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: profiles.length, profiles: profiles.map(p => ({ id: p.id, name: p.name, rows: p.rowCount, cols: p.columnCount })) }) };
          }
          case 'get': {
            const profile = await prisma.dataProfile.findFirst({ where: { id: input.profileId, userId } });
            if (!profile) return { result: JSON.stringify({ status: 'error', error: 'Profile not found' }) };
            return { result: JSON.stringify({ status: 'success', profile }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'data_clean': {
        switch (input.operation) {
          case 'clean': {
            const data = input.data || [];
            const rules = input.rules || [{ type: 'remove_nulls' }];
            let cleaned = [...data];
            const applied = [];

            rules.forEach(rule => {
              switch (rule.type) {
                case 'remove_nulls': {
                  const before = cleaned.length;
                  cleaned = cleaned.filter(row => !Object.values(row).some(v => v === null || v === undefined || v === ''));
                  applied.push({ rule: 'remove_nulls', removed: before - cleaned.length });
                  break;
                }
                case 'remove_duplicates': {
                  const before = cleaned.length;
                  const seen = new Set();
                  cleaned = cleaned.filter(row => {
                    const key = JSON.stringify(row);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  applied.push({ rule: 'remove_duplicates', removed: before - cleaned.length });
                  break;
                }
                case 'fill_mean': {
                  const col = rule.column;
                  if (col) {
                    const nums = cleaned.map(r => Number(r[col])).filter(n => !isNaN(n));
                    const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
                    let filled = 0;
                    cleaned.forEach(row => { if (row[col] === null || row[col] === undefined) { row[col] = Math.round(mean * 100) / 100; filled++; } });
                    applied.push({ rule: 'fill_mean', column: col, mean, filled });
                  }
                  break;
                }
                case 'trim_strings': {
                  cleaned.forEach(row => {
                    Object.keys(row).forEach(k => { if (typeof row[k] === 'string') row[k] = row[k].trim(); });
                  });
                  applied.push({ rule: 'trim_strings' });
                  break;
                }
              }
            });

            const job = await prisma.dataCleanJob.create({
              data: { userId, name: input.name || 'Clean Job', originalRows: data.length, cleanedRows: cleaned.length, rules, appliedSteps: applied },
            });
            return { result: JSON.stringify({ status: 'success', jobId: job.id, originalRows: data.length, cleanedRows: cleaned.length, appliedSteps: applied, sampleOutput: cleaned.slice(0, 5) }) };
          }
          case 'list': {
            const jobs = await prisma.dataCleanJob.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: jobs.length, jobs: jobs.map(j => ({ id: j.id, name: j.name, original: j.originalRows, cleaned: j.cleanedRows })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'data_visualize': {
        switch (input.operation) {
          case 'create': {
            const viz = await prisma.dataVisualization.create({
              data: { userId, name: input.name || 'Chart', type: input.type || 'bar', config: { xAxis: input.xAxis, yAxis: input.yAxis, groupBy: input.groupBy, options: input.options || {} }, data: input.data || [] },
            });
            return { result: JSON.stringify({ status: 'success', vizId: viz.id, name: viz.name, type: viz.type }) };
          }
          case 'list': {
            const vizs = await prisma.dataVisualization.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: vizs.length, visualizations: vizs.map(v => ({ id: v.id, name: v.name, type: v.type })) }) };
          }
          case 'get': {
            const viz = await prisma.dataVisualization.findFirst({ where: { id: input.vizId, userId } });
            if (!viz) return { result: JSON.stringify({ status: 'error', error: 'Visualization not found' }) };
            return { result: JSON.stringify({ status: 'success', visualization: viz }) };
          }
          case 'delete': {
            await prisma.dataVisualization.deleteMany({ where: { id: input.vizId, userId } });
            return { result: JSON.stringify({ status: 'success', deleted: input.vizId }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'feature_engineer': {
        const data = input.data || [];
        if (data.length === 0) return { result: JSON.stringify({ status: 'error', error: 'No data provided' }) };

        const operations = input.operations || [{ type: 'auto' }];
        const newFeatures = [];
        const engineered = data.map(row => ({ ...row }));

        operations.forEach(op => {
          switch (op.type) {
            case 'interaction': {
              const [col1, col2] = op.columns || [];
              if (col1 && col2) {
                const fname = `${col1}_x_${col2}`;
                engineered.forEach(row => { row[fname] = (Number(row[col1]) || 0) * (Number(row[col2]) || 0); });
                newFeatures.push(fname);
              }
              break;
            }
            case 'polynomial': {
              const col = (op.columns || [])[0];
              if (col) {
                const fname = `${col}_sq`;
                engineered.forEach(row => { row[fname] = Math.pow(Number(row[col]) || 0, 2); });
                newFeatures.push(fname);
              }
              break;
            }
            case 'log': {
              const col = (op.columns || [])[0];
              if (col) {
                const fname = `${col}_log`;
                engineered.forEach(row => { const v = Number(row[col]); row[fname] = v > 0 ? Math.round(Math.log(v) * 1000) / 1000 : 0; });
                newFeatures.push(fname);
              }
              break;
            }
            case 'bin': {
              const col = (op.columns || [])[0];
              const bins = op.config?.bins || 5;
              if (col) {
                const vals = data.map(r => Number(r[col]) || 0);
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                const binSize = (max - min) / bins;
                const fname = `${col}_bin`;
                engineered.forEach(row => { row[fname] = Math.min(bins - 1, Math.floor((Number(row[col]) - min) / binSize)); });
                newFeatures.push(fname);
              }
              break;
            }
            case 'auto': {
              // Auto-detect numeric columns and create basic features
              const numCols = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number');
              numCols.forEach(col => {
                const fname = `${col}_normalized`;
                const vals = data.map(r => Number(r[col]) || 0);
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                const range = max - min || 1;
                engineered.forEach(row => { row[fname] = Math.round(((Number(row[col]) || 0) - min) / range * 1000) / 1000; });
                newFeatures.push(fname);
              });
              break;
            }
          }
        });

        return { result: JSON.stringify({ status: 'success', originalColumns: Object.keys(data[0]).length, newFeatures, totalColumns: Object.keys(engineered[0]).length, sampleOutput: engineered.slice(0, 3) }) };
      }

      case 'model_compare': {
        switch (input.operation) {
          case 'register': {
            const model = await prisma.mlModelRecord.create({
              data: { userId, name: input.name || 'Model', algorithm: input.algorithm || 'unknown', metrics: input.metrics || {}, params: input.params || {} },
            });
            return { result: JSON.stringify({ status: 'success', modelId: model.id, name: model.name, algorithm: model.algorithm }) };
          }
          case 'compare': {
            const modelIds = input.modelIds || [];
            const models = await prisma.mlModelRecord.findMany({ where: { id: { in: modelIds }, userId } });
            if (models.length < 2) return { result: JSON.stringify({ status: 'error', error: 'Need at least 2 models to compare' }) };

            const comparison = models.map(m => ({
              id: m.id, name: m.name, algorithm: m.algorithm,
              metrics: m.metrics,
            }));

            // Determine best by key metrics
            const primary = ['accuracy', 'f1', 'auc', 'r2'];
            const winner = {};
            primary.forEach(metric => {
              const best = models.reduce((best, m) => {
                const val = (m.metrics || {})[metric];
                return val !== undefined && (best === null || val > (best.metrics || {})[metric]) ? m : best;
              }, null);
              if (best) winner[metric] = { model: best.name, value: (best.metrics || {})[metric] };
            });

            return { result: JSON.stringify({ status: 'success', modelCount: models.length, comparison, bestBy: winner }) };
          }
          case 'list': {
            const models = await prisma.mlModelRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
            return { result: JSON.stringify({ status: 'success', count: models.length, models: models.map(m => ({ id: m.id, name: m.name, algorithm: m.algorithm, metrics: m.metrics })) }) };
          }
          default:
            return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isDataScienceTool = (name) => DATA_SCIENCE_TOOL_DEFINITIONS.some(t => t.name === name);
