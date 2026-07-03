import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const FinancialPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'budgets' | 'reports' | 'payments'>('invoices');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">💰 Financial</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['invoices', '🧾'], ['expenses', '💳'], ['budgets', '📊'], ['reports', '📈'], ['payments', '💵']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'invoices' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate and manage invoices.</p>
            <button onClick={() => runTool('invoice_generate', 'Create a new invoice (action: create)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">+ New Invoice</button>
            <button onClick={() => runTool('invoice_generate', 'List all invoices (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Invoices</button>
          </>
        )}
        {activeTab === 'expenses' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track and categorize expenses.</p>
            <button onClick={() => runTool('expense_track', 'Add a new expense (action: add)')} className="w-full py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium">+ Add Expense</button>
            <button onClick={() => runTool('expense_track', 'View expense summary (action: summary)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Summary</button>
          </>
        )}
        {activeTab === 'budgets' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Plan and track budgets.</p>
            <button onClick={() => runTool('budget_plan', 'Create a new budget (action: create)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">+ New Budget</button>
            <button onClick={() => runTool('budget_plan', 'List all budgets (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Budgets</button>
          </>
        )}
        {activeTab === 'reports' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate financial reports and tax calculations.</p>
            <button onClick={() => runTool('financial_report', 'Generate an income statement (action: generate, type: income_statement)')} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium">📄 Income Statement</button>
            <button onClick={() => runTool('tax_calculate', 'Calculate tax obligations (action: calculate)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🧮 Tax Calculator</button>
            <button onClick={() => runTool('currency_convert', 'Convert currency amounts (action: convert)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">💱 Currency Convert</button>
          </>
        )}
        {activeTab === 'payments' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Process and track payments.</p>
            <button onClick={() => runTool('payment_process', 'Process a new payment (action: process)')} className="w-full py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium">💳 Process Payment</button>
            <button onClick={() => runTool('payment_process', 'List payment history (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 Payment History</button>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialPanel;
