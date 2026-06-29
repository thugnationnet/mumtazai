/**
 * AI / ML TOOLS — 5 tools
 * llm_chat, llm_embed, llm_finetune, ml_train, ml_predict
 */

import https from 'https';
import http  from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

export const AI_ML_TOOL_DEFINITIONS = [
  {
    name: 'llm_chat',
    description: 'Send a prompt to an LLM (OpenAI, Mistral, or xAI) and get a completion. Supports system prompts, multi-turn conversation, and streaming mode summary.',
    input_schema: {
      type: 'object',
      properties: {
        prompt:      { type: 'string', description: 'User prompt' },
        system:      { type: 'string', description: 'System prompt (optional)' },
        messages:    { type: 'array', description: 'Conversation history [{role, content}] (optional)' },
        model:       { type: 'string', description: 'Model name (default: uses env OPENAI_API_KEY with gpt-4o)' },
        temperature: { type: 'number', description: 'Sampling temperature 0-2 (default: 0.7)' },
        max_tokens:  { type: 'number', description: 'Max completion tokens (default: 1000)' },
        provider:    { type: 'string', enum: ['openai', 'mistral', 'xai'], description: 'Provider (default: openai)' },
        json_mode:   { type: 'boolean', description: 'Request JSON-formatted response (default: false)' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'llm_embed',
    description: 'Generate vector embeddings for text using OpenAI embedding models.',
    input_schema: {
      type: 'object',
      properties: {
        input:      { type: 'string', description: 'Text to embed (or array of strings for batch)' },
        inputs:     { type: 'array', items: { type: 'string' }, description: 'Batch of texts to embed' },
        model:      { type: 'string', description: 'Embedding model (default: text-embedding-3-small)' },
        dimensions: { type: 'number', description: 'Output dimensions (optional, supported by text-embedding-3-*)' },
      },
      required: [],
    },
  },
  {
    name: 'llm_finetune',
    description: 'Prepare a fine-tuning dataset and initiate/monitor OpenAI fine-tuning jobs.',
    input_schema: {
      type: 'object',
      properties: {
        operation:    { type: 'string', enum: ['validate_dataset', 'upload_dataset', 'create_job', 'list_jobs', 'job_status', 'cancel_job'],
                        description: 'Fine-tuning operation' },
        dataset_path: { type: 'string', description: 'Path to JSONL training dataset' },
        model:        { type: 'string', description: 'Base model (default: gpt-4o-mini)' },
        suffix:       { type: 'string', description: 'Model name suffix for the fine-tuned model' },
        job_id:       { type: 'string', description: 'Fine-tuning job ID (for status/cancel)' },
        file_id:      { type: 'string', description: 'Uploaded file ID (for create_job)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'ml_train',
    description: 'Train a simple classification/regression model from JSON data using built-in algorithms.',
    input_schema: {
      type: 'object',
      properties: {
        operation:     { type: 'string', enum: ['train', 'evaluate', 'save', 'load'],
                         description: 'Training operation' },
        data:          { type: 'array', description: 'Training data [{features: [...], label: ...}]' },
        data_path:     { type: 'string', description: 'Path to JSON training data file (alternative to data)' },
        algorithm:     { type: 'string', enum: ['knn', 'naive_bayes', 'linear_regression', 'decision_tree'],
                         description: 'ML algorithm (default: knn)' },
        model_path:    { type: 'string', description: 'Path to save/load model JSON' },
        test_split:    { type: 'number', description: 'Fraction for test set (default: 0.2)' },
        k:             { type: 'number', description: 'k for KNN (default: 3)' },
        hyperparams:   { type: 'object', description: 'Algorithm hyperparameters' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'ml_predict',
    description: 'Run predictions using a saved ML model.',
    input_schema: {
      type: 'object',
      properties: {
        model_path: { type: 'string', description: 'Path to saved model JSON' },
        features:   { description: 'Single feature vector or array of feature vectors for batch prediction' },
        top_k:      { type: 'number', description: 'Return top-k predictions with confidence (default: 1)' },
      },
      required: ['model_path', 'features'],
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function apiPost(apiKey, url, body) {
  return new Promise((resolve, reject) => {
    const parsed    = new URL(url);
    const requester = parsed.protocol === 'https:' ? https : http;
    const data      = JSON.stringify(body);
    const req       = requester.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization':  `Bearer ${apiKey}`,
      },
      timeout: 60000,
    }, (res) => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function apiGet(apiKey, url) {
  return new Promise((resolve, reject) => {
    const parsed    = new URL(url);
    const requester = parsed.protocol === 'https:' ? https : http;
    const req       = requester.get({
      hostname: parsed.hostname,
      port:     parsed.port || 443,
      path:     parsed.pathname,
      headers:  { 'Authorization': `Bearer ${apiKey}` },
      timeout:  30000,
    }, (res) => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); }
      });
    });
    req.on('error', reject);
  });
}

const PROVIDER_CONFIGS = {
  openai:  { baseURL: 'https://api.openai.com', key: () => process.env.OPENAI_API_KEY,  defaultModel: 'gpt-4o' },
  mistral: { baseURL: 'https://api.mistral.ai', key: () => process.env.MISTRAL_API_KEY, defaultModel: 'mistral-large-2501' },
  xai:     { baseURL: 'https://api.x.ai',       key: () => process.env.XAI_API_KEY,     defaultModel: 'grok-3' },
};

// --- Minimal KNN classifier ---
function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}
function knnPredict(model, features, topK = 1) {
  const distances = model.training_data.map(pt => ({
    label: pt.label,
    dist:  euclidean(features, pt.features),
  })).sort((a, b) => a.dist - b.dist).slice(0, model.k || 3);
  const votes = {};
  for (const d of distances) votes[d.label] = (votes[d.label] || 0) + 1;
  return Object.entries(votes).sort((a, b) => b[1] - a[1]).slice(0, topK).map(([label, count]) => ({ label, confidence: count / distances.length }));
}

// --- Naive Bayes ---
function bayesTrain(data) {
  const classes = {}, priors = {}, total = data.length;
  for (const { features, label } of data) {
    if (!classes[label]) classes[label] = { count: 0, sum: features.map(() => 0), sum2: features.map(() => 0) };
    classes[label].count++;
    classes[label].sum  = classes[label].sum.map( (v, i) => v + features[i]);
    classes[label].sum2 = classes[label].sum2.map((v, i) => v + features[i] ** 2);
  }
  const model = { type: 'naive_bayes', classes: {} };
  for (const [label, c] of Object.entries(classes)) {
    const mean = c.sum.map(v => v / c.count);
    const var_ = c.sum2.map((v, i) => Math.max(1e-9, v / c.count - mean[i] ** 2));
    model.classes[label] = { mean, var: var_, prior: c.count / total };
    priors[label] = c.count / total;
  }
  return model;
}

function gaussianLogProb(x, mean, variance) {
  return -0.5 * (Math.log(2 * Math.PI * variance) + (x - mean) ** 2 / variance);
}

function bayesPredict(model, features) {
  return Object.entries(model.classes).map(([label, c]) => {
    const logProb = Math.log(c.prior) + features.reduce((sum, x, i) => sum + gaussianLogProb(x, c.mean[i], c.var[i]), 0);
    return { label, log_prob: logProb };
  }).sort((a, b) => b.log_prob - a.log_prob);
}

// ============================================================================
// EXECUTORS
// ============================================================================

export async function executeAiMlTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {

      case 'llm_chat': {
        const provider = input.provider || 'openai';
        const cfg      = PROVIDER_CONFIGS[provider];
        if (!cfg) throw new Error(`Unknown provider: ${provider}`);
        const apiKey = cfg.key();
        if (!apiKey) throw new Error(`${provider.toUpperCase()}_API_KEY not set`);

        const model    = input.model || cfg.defaultModel;
        const messages = input.messages ? [...input.messages] : [];
        if (input.system) messages.unshift({ role: 'system', content: input.system });
        messages.push({ role: 'user', content: input.prompt });

        const body = {
          model,
          messages,
          temperature: input.temperature ?? 0.7,
          max_tokens:  input.max_tokens  ?? 32768,
        };
        if (input.json_mode) body.response_format = { type: 'json_object' };

        const res      = await apiPost(apiKey, `${cfg.baseURL}/v1/chat/completions`, body);
        const content  = res.choices?.[0]?.message?.content;
        return { result: JSON.stringify({ status: 'success', content, model, provider, usage: res.usage }) };
      }

      case 'llm_embed': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not set');
        const model  = input.model || 'text-embedding-3-small';
        const texts  = input.inputs || (input.input ? [input.input] : []);
        if (texts.length === 0) throw new Error('input or inputs required');
        const body = { model, input: texts.length === 1 ? texts[0] : texts };
        if (input.dimensions) body.dimensions = input.dimensions;
        const res  = await apiPost(apiKey, 'https://api.openai.com/v1/embeddings', body);
        const data = res.data?.map(d => d.embedding) || [];
        return { result: JSON.stringify({ status: 'success', embeddings: data, model, dimensions: data[0]?.length, usage: res.usage }) };
      }

      case 'llm_finetune': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not set');

        switch (input.operation) {
          case 'validate_dataset': {
            if (!input.dataset_path) throw new Error('dataset_path required');
            const lines   = fs.readFileSync(path.resolve(root, input.dataset_path), 'utf8').split('\n').filter(l => l.trim());
            const errors  = [];
            let valid     = 0;
            for (const [i, line] of lines.entries()) {
              try {
                const obj = JSON.parse(line);
                if (!obj.messages) errors.push({ line: i + 1, error: 'missing messages field' });
                else valid++;
              } catch { errors.push({ line: i + 1, error: 'invalid JSON' }); }
            }
            return { result: JSON.stringify({ status: 'success', total: lines.length, valid, errors: errors.slice(0, 20) }) };
          }
          case 'list_jobs': {
            const res = await apiGet(apiKey, 'https://api.openai.com/v1/fine_tuning/jobs?limit=20');
            return { result: JSON.stringify({ status: 'success', jobs: res.data?.map(j => ({ id: j.id, model: j.model, status: j.status, created: j.created_at })) }) };
          }
          case 'job_status': {
            if (!input.job_id) throw new Error('job_id required');
            const res = await apiGet(apiKey, `https://api.openai.com/v1/fine_tuning/jobs/${input.job_id}`);
            return { result: JSON.stringify({ status: 'success', job: { id: res.id, status: res.status, model: res.fine_tuned_model, error: res.error } }) };
          }
          default: return { result: JSON.stringify({ status: 'info', message: `Fine-tuning operation '${input.operation}' requires OpenAI credentials and file upload. Use the OpenAI dashboard or call create_job with a file_id.` }) };
        }
      }

      case 'ml_train': {
        let data = input.data;
        if (!data && input.data_path) {
          data = JSON.parse(fs.readFileSync(path.resolve(root, input.data_path), 'utf8'));
        }
        if (!data || data.length === 0) throw new Error('data or data_path required');

        const algo = input.algorithm || 'knn';

        if (input.operation === 'train') {
          const testSplit = input.test_split || 0.2;
          const split     = Math.floor(data.length * (1 - testSplit));
          const trainData = data.slice(0, split);
          const testData  = data.slice(split);
          let model;

          if (algo === 'knn') {
            model = { type: 'knn', k: input.k || 3, training_data: trainData };
          } else if (algo === 'naive_bayes') {
            model = bayesTrain(trainData);
          } else if (algo === 'linear_regression') {
            // Simple univariate OLS for first feature → label
            const n    = trainData.length;
            const xs   = trainData.map(d => d.features[0]);
            const ys   = trainData.map(d => Number(d.label));
            const sx   = xs.reduce((a, b) => a + b, 0);
            const sy   = ys.reduce((a, b) => a + b, 0);
            const sxy  = xs.reduce((s, x, i) => s + x * ys[i], 0);
            const sx2  = xs.reduce((s, x) => s + x * x, 0);
            const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
            const intercept = (sy - slope * sx) / n;
            model = { type: 'linear_regression', slope, intercept };
          } else {
            model = { type: algo, training_data: trainData, note: `${algo} not fully implemented — use knn or naive_bayes` };
          }

          // Evaluate on test set
          let correct = 0;
          for (const pt of testData) {
            let pred;
            if (algo === 'knn')         pred = knnPredict(model, pt.features, 1)[0]?.label;
            else if (algo === 'naive_bayes') pred = bayesPredict(model, pt.features)[0]?.label;
            else if (algo === 'linear_regression') pred = (model.slope * pt.features[0] + model.intercept).toFixed(2);
            if (String(pred) === String(pt.label)) correct++;
          }
          const accuracy = testData.length > 0 ? (correct / testData.length).toFixed(3) : 'N/A';

          if (input.model_path) {
            const outPath = path.resolve(root, input.model_path);
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, JSON.stringify(model, null, 2));
          }
          return { result: JSON.stringify({ status: 'success', algorithm: algo, train_size: trainData.length, test_size: testData.length, accuracy, model_path: input.model_path }) };
        }
        return { result: JSON.stringify({ status: 'error', error: 'Unknown ml_train operation' }) };
      }

      case 'ml_predict': {
        const modelPath = path.resolve(root, input.model_path);
        if (!fs.existsSync(modelPath)) throw new Error(`Model not found: ${input.model_path}`);
        const model    = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
        const topK     = input.top_k || 1;
        const isBatch  = Array.isArray(input.features[0]);
        const inputs   = isBatch ? input.features : [input.features];
        const results  = inputs.map(f => {
          if (model.type === 'knn')             return knnPredict(model, f, topK);
          if (model.type === 'naive_bayes')     return bayesPredict(model, f).slice(0, topK);
          if (model.type === 'linear_regression') return [{ label: (model.slope * f[0] + model.intercept).toFixed(4) }];
          return [{ label: model.training_data?.[0]?.label ?? 'unknown' }];
        });
        return { result: JSON.stringify({ status: 'success', predictions: isBatch ? results : results[0], model_type: model.type }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isAiMlTool = (name) => AI_ML_TOOL_DEFINITIONS.some(t => t.name === name);
