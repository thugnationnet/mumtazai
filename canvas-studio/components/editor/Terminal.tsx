/**
 * Terminal — Embedded xterm.js terminal with gorgeous styling
 * Connects to sandbox WebSocket for real command execution
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { TerminalIcon, X, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { useTerminalStore } from '../../stores/terminalStore';

interface TerminalProps {
  sessionId: string;
  className?: string;
}

const Terminal: React.FC<TerminalProps> = ({ sessionId, className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const outputs = useTerminalStore((s) => s.outputs);
  const addOutput = useTerminalStore((s) => s.addOutput);
  const [inputBuffer, setInputBuffer] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initTerminal = async () => {
      if (!terminalRef.current || xtermRef.current) return;

      try {
        const { Terminal: XTerminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');

        if (!mounted) return;

        const fitAddon = new FitAddon();
        const term = new XTerminal({
          theme: {
            background: '#0a0a0a',
            foreground: '#e5e7eb',
            cursor: '#a78bfa',
            cursorAccent: '#0a0a0a',
            selectionBackground: '#7c3aed30',
            selectionForeground: '#e5e7eb',
            black: '#111113',
            brightBlack: '#4b5563',
            red: '#ef4444',
            brightRed: '#f87171',
            green: '#34d399',
            brightGreen: '#6ee7b7',
            yellow: '#fbbf24',
            brightYellow: '#fde68a',
            blue: '#60a5fa',
            brightBlue: '#93c5fd',
            magenta: '#c084fc',
            brightMagenta: '#d8b4fe',
            cyan: '#22d3ee',
            brightCyan: '#67e8f9',
            white: '#e5e7eb',
            brightWhite: '#f9fafb',
          },
          fontSize: 12,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          cursorBlink: true,
          cursorStyle: 'bar',
          scrollback: 5000,
          allowTransparency: true,
          drawBoldTextInBrightColors: true,
        });

        term.loadAddon(fitAddon);
        term.open(terminalRef.current!);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Welcome message
        term.writeln('\x1b[38;2;124;58;237m╭──────────────────────────────────╮\x1b[0m');
        term.writeln('\x1b[38;2;124;58;237m│\x1b[0m  \x1b[1;38;2;167;139;250m⚡ Canvas Studio Terminal\x1b[0m         \x1b[38;2;124;58;237m│\x1b[0m');
        term.writeln('\x1b[38;2;124;58;237m╰──────────────────────────────────╯\x1b[0m');
        term.writeln('');
        term.write('\x1b[38;2;34;211;238m❯\x1b[0m ');

        // Handle input with real backend execution
        let currentLine = '';
        term.onData(async (data: string) => {
          if (data === '\r') {
            // Enter pressed
            term.writeln('');
            if (currentLine.trim()) {
              addOutput(sessionId, { terminalId: sessionId, type: 'stdout', text: `$ ${currentLine}` });
              const cmd = currentLine.trim();
              currentLine = '';

              if (cmd === 'clear') {
                term.clear();
                term.write('\x1b[38;2;34;211;238m❯\x1b[0m ');
                return;
              }

              // Execute via backend shell endpoint
              try {
                const res = await fetch('/api/canvas/shell/exec', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: cmd, sessionId }),
                });

                if (!res.ok) {
                  const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
                  term.writeln(`\x1b[38;2;239;68;68m  ✗ ${err.message || 'Command failed'}\x1b[0m`);
                } else if (res.headers.get('content-type')?.includes('text/event-stream')) {
                  // SSE stream
                  const reader = res.body?.getReader();
                  const decoder = new TextDecoder();
                  if (reader) {
                    let buf = '';
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      buf += decoder.decode(value, { stream: true });
                      const lines = buf.split('\n');
                      buf = lines.pop() || '';
                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          try {
                            const ev = JSON.parse(line.slice(6));
                            if (ev.stdout) term.write(ev.stdout.replace(/\n/g, '\r\n'));
                            if (ev.stderr) term.write(`\x1b[38;2;239;68;68m${ev.stderr.replace(/\n/g, '\r\n')}\x1b[0m`);
                            if (ev.exit !== undefined && ev.exit !== 0) {
                              term.writeln(`\x1b[38;2;239;68;68m\r\n  [exit ${ev.exit}]\x1b[0m`);
                            }
                          } catch {}
                        }
                      }
                    }
                  }
                } else {
                  // JSON response
                  const data2 = await res.json();
                  if (data2.stdout) term.write(data2.stdout.replace(/\n/g, '\r\n'));
                  if (data2.stderr) term.write(`\x1b[38;2;239;68;68m${data2.stderr.replace(/\n/g, '\r\n')}\x1b[0m`);
                  if (data2.exitCode !== undefined && data2.exitCode !== 0) {
                    term.writeln(`\r\n\x1b[38;2;239;68;68m  [exit ${data2.exitCode}]\x1b[0m`);
                  }
                }
              } catch (err: any) {
                // Fallback: simulate basic commands
                if (cmd === 'help') {
                  term.writeln('\x1b[38;2;167;139;250m  Available commands:\x1b[0m');
                  term.writeln('    npm install, npm run build, npm run dev, npm test');
                  term.writeln('    ls, pwd, cat, echo, clear, help');
                } else {
                  term.writeln(`\x1b[38;2;107;114;128m  → ${cmd}\x1b[0m`);
                }
              }
            } else {
              currentLine = '';
            }
            term.write('\x1b[38;2;34;211;238m❯\x1b[0m ');
          } else if (data === '\x7f') {
            // Backspace
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              term.write('\b \b');
            }
          } else if (data.charCodeAt(0) >= 32) {
            currentLine += data;
            term.write(data);
          }
        });

        setIsInitialized(true);

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          try { fitAddon.fit(); } catch {}
        });
        resizeObserver.observe(terminalRef.current!);

        return () => {
          resizeObserver.disconnect();
          term.dispose();
        };
      } catch (e) {
        console.error('Failed to initialize terminal:', e);
      }
    };

    initTerminal();

    return () => { mounted = false; };
  }, [sessionId, addOutput]);

  // Load xterm CSS
  useEffect(() => {
    const linkId = 'xterm-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.min.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className={`h-full w-full bg-white dark:bg-[#0a0a0a] relative ${className}`}>
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent z-10" />

      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#0a0a0a] z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs text-slate-600">Initializing terminal...</p>
          </div>
        </div>
      )}

      <div ref={terminalRef} className="h-full w-full p-2" />
    </div>
  );
};

export default Terminal;
