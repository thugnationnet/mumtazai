import React, { useState } from 'react';
import { analyzeErrors, generateTests, analyzeForRefactoring } from '@shared/api';
import { PreviewContent } from './PanelPreview';

interface AIPanelProps {
  onClose?: () => void;
  onPreviewContent?: (content: PreviewContent) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ onClose, onPreviewContent }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [testFramework, setTestFramework] = useState('jest');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'analyze-errors' | 'generate-tests' | 'analyze-refactoring'>('analyze-errors');

  const handleAnalyzeErrors = async () => {
    if (!code || !error) {
      alert('Please enter code and error');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeErrors(code, error);
      setResult(res);
      if (onPreviewContent) {
        const json = JSON.stringify(res, null, 2);
        onPreviewContent({ type: 'html', title: 'AI_CODE_ANALYSIS', icon: '🤖',
          html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:24px}h2{font-size:12px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}pre{background:#0d0d0d;border:1px solid #1f2937;border-radius:8px;padding:16px;font-size:11px;font-family:"SF Mono",monospace;color:#86efac;white-space:pre-wrap;overflow-wrap:break-word;line-height:1.6}</style></head><body><h2>🐛 Error Analysis</h2><pre>' + json.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre></body></html>',
        });
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleGenerateTests = async () => {
    if (!code) {
      alert('Please enter code');
      return;
    }
    setLoading(true);
    try {
      const res = await generateTests(code, language);
      setResult(res);
      if (onPreviewContent) {
        const json = JSON.stringify(res, null, 2);
        onPreviewContent({ type: 'html', title: 'AI_CODE_ANALYSIS', icon: '🤖',
          html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:24px}h2{font-size:12px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}pre{background:#0d0d0d;border:1px solid #1f2937;border-radius:8px;padding:16px;font-size:11px;font-family:"SF Mono",monospace;color:#c4b5fd;white-space:pre-wrap;overflow-wrap:break-word;line-height:1.6}</style></head><body><h2>✓ Generated Tests</h2><pre>' + json.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre></body></html>',
        });
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleRefactoring = async () => {
    if (!code) {
      alert('Please enter code');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeForRefactoring(code);
      setResult(res);
      if (onPreviewContent) {
        const json = JSON.stringify(res, null, 2);
        onPreviewContent({ type: 'html', title: 'AI_CODE_ANALYSIS', icon: '🤖',
          html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui;padding:24px}h2{font-size:12px;font-weight:700;color:#22d3ee;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}pre{background:#0d0d0d;border:1px solid #1f2937;border-radius:8px;padding:16px;font-size:11px;font-family:"SF Mono",monospace;color:#fde68a;white-space:pre-wrap;overflow-wrap:break-word;line-height:1.6}</style></head><body><h2>↻ Refactoring Suggestions</h2><pre>' + json.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre></body></html>',
        });
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-indigo-500/30 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">🤖 AI Code Analysis</h2>
        {onClose && <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>}
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setMode('analyze-errors')}
          className={`py-2 px-3 rounded font-mono text-sm transition ${
            mode === 'analyze-errors' ? 'bg-cyan-600' : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700'
          }`}
        >
          🐛 Fix Errors
        </button>
        <button
          onClick={() => setMode('generate-tests')}
          className={`py-2 px-3 rounded font-mono text-sm transition ${
            mode === 'generate-tests' ? 'bg-cyan-600' : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700'
          }`}
        >
          ✓ Generate Tests
        </button>
        <button
          onClick={() => setMode('analyze-refactoring')}
          className={`py-2 px-3 rounded font-mono text-sm transition ${
            mode === 'analyze-refactoring' ? 'bg-cyan-600' : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700'
          }`}
        >
          ↻ Refactor
        </button>
      </div>

      {/* Code Input */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here..."
        className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-sm text-slate-900 dark:text-white resize-none h-32"
      />

      {/* Mode-specific inputs */}
      {mode === 'analyze-errors' && (
        <textarea
          value={error}
          onChange={(e) => setError(e.target.value)}
          placeholder="Paste the error message here..."
          className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-sm text-slate-900 dark:text-white resize-none h-24"
        />
      )}

      {mode === 'generate-tests' && (
        <select
          value={testFramework}
          onChange={(e) => setTestFramework(e.target.value)}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white text-sm"
        >
          <option>jest</option>
          <option>vitest</option>
          <option>mocha</option>
          <option>jasmine</option>
        </select>
      )}

      {/* Action Button */}
      <button
        onClick={
          mode === 'analyze-errors'
            ? handleAnalyzeErrors
            : mode === 'generate-tests'
            ? handleGenerateTests
            : handleRefactoring
        }
        disabled={loading}
        className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded font-semibold transition"
      >
        {loading ? '⏳ Processing...' : 'Analyze with AI'}
      </button>

      {/* Results */}
      {result && (
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded overflow-auto max-h-64">
          <pre className="text-xs text-violet-600 dark:text-violet-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AIPanel;
