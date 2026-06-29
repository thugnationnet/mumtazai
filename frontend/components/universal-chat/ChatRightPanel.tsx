'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  MoonIcon,
  SunIcon,
  Cog6ToothIcon,
  BugAntIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhotoIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface ChatRightPanelProps {
  theme?: 'default' | 'neural';
  isDarkMode?: boolean;
  agentId?: string;
  agentName?: string;
  externalUrl?: string;
  onToggleTheme?: () => void;
  onToggleSettings?: () => void;
  isSettingsActive?: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export default function ChatRightPanel({
  theme = 'default',
  isDarkMode = false,
  agentId,
  agentName,
  externalUrl,
  onToggleTheme,
  onToggleSettings,
  isSettingsActive = false,
  userId,
  userEmail,
  userName,
}: ChatRightPanelProps) {
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugImages, setBugImages] = useState<File[]>([]);
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBugImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBugImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleBugSubmit = async () => {
    if (!bugDescription.trim()) return;
    setBugSubmitting(true);
    try {
      // Convert images to base64 for submission
      const imageData: string[] = [];
      for (const file of bugImages) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageData.push(base64);
      }

      const res = await fetch('/api/live-support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId || 'anonymous',
          userEmail: userEmail || 'unknown@user.com',
          userName: userName || 'Chat User',
          subject: bugTitle || 'Bug Report from Chat',
          description: bugDescription,
          category: 'bug-report',
          priority: 'high',
          relatedAgent: agentName || agentId || 'unknown',
          messages: [{
            role: 'user',
            content: `Bug Report:\n${bugDescription}\n\nAgent: ${agentName || agentId || 'N/A'}\nPage: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}\nBrowser: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}\nTimestamp: ${new Date().toISOString()}${imageData.length > 0 ? `\n\nAttachments: ${imageData.length} image(s)` : ''}`,
          }],
        }),
      });
      if (res.ok) {
        setBugSuccess(true);
        setTimeout(() => {
          setShowBugReport(false);
          setBugTitle('');
          setBugDescription('');
          setBugImages([]);
          setBugSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Bug report failed:', err);
    } finally {
      setBugSubmitting(false);
    }
  };
  return (
    <>
      {/* Right Sidebar Panel */}
      <div className="w-14 flex-shrink-0 flex flex-col border-l bg-gray-50 border-white/80 transition-all duration-300">
        {/* Icon buttons container */}
        <div className="flex-1 flex flex-col items-center pt-4 space-y-4">
          {/* External Link */}
          {externalUrl && (
            <div className="flex flex-col items-center">
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group hover:bg-blue-50 ring-1 ring-slate-200 hover:ring-blue-300"
                title="Open in new tab"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-blue-600" />
              </a>
              <span className="mt-1 text-[9px] text-slate-400">External</span>
            </div>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <div className="flex flex-col items-center">
              <button
                onClick={onToggleTheme}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-500 shadow-sm shadow-violet-500/20'
                    : 'hover:bg-blue-50 ring-1 ring-slate-200 hover:ring-blue-300'
                }`}
                title={
                  isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
                }
              >
                {isDarkMode ? (
                  <MoonIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-white" />
                ) : (
                  <SunIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-blue-600" />
                )}
              </button>
              <span className="mt-1 text-[9px] text-slate-400">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>
          )}

          {/* Settings */}
          {onToggleSettings && (
            <div className="flex flex-col items-center">
              <button
                onClick={onToggleSettings}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm'
                    : 'hover:bg-blue-50 ring-1 ring-slate-200 hover:ring-blue-300'
                }`}
                title="Agent Settings"
              >
                <Cog6ToothIcon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isSettingsActive
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-blue-600'
                  }`}
                />
              </button>
              <span className="mt-1 text-[9px] text-slate-400">Settings</span>
            </div>
          )}

          {/* Divider */}
          <div className="w-6 h-px bg-slate-200" />

          {/* Report Bug */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowBugReport(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group hover:bg-red-50 ring-1 ring-slate-200 hover:ring-red-300"
              title="Report a Bug"
            >
              <BugAntIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-red-500" />
            </button>
            <span className="mt-1 text-[9px] text-slate-400">Bug</span>
          </div>

          {/* Apps Download */}
          <div className="flex flex-col items-center">
            <a
              href="https://mumtaz.ai/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group hover:bg-green-50 ring-1 ring-slate-200 hover:ring-green-300"
              title="Download Apps"
            >
              <DevicePhoneMobileIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-green-600" />
            </a>
            <span className="mt-1 text-[9px] text-slate-400">Apps</span>
          </div>

          {/* Live Support */}
          <div className="flex flex-col items-center">
            <a
              href="https://mumtaz.ai/support/live-support"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group hover:bg-blue-50 ring-1 ring-slate-200 hover:ring-blue-300"
              title="Live Support"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-blue-600" />
            </a>
            <span className="mt-1 text-[9px] text-slate-400">Support</span>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="p-3 flex justify-center">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
        </div>
      </div>

      {/* Bug Report Modal */}
      {showBugReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-card w-[440px] max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/80 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center gap-2">
                <BugAntIcon className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-slate-700">Report a Bug</h3>
              </div>
              <button onClick={() => { setShowBugReport(false); setBugSuccess(false); }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors" title="Close">
                <XMarkIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {bugSuccess ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h4 className="text-lg font-semibold text-slate-700">Bug Report Sent!</h4>
                <p className="text-sm text-slate-400 mt-1">Our team will review it shortly.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full px-3 py-2 text-sm border border-white/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description *</label>
                  <textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="Describe what happened, steps to reproduce, what you expected..."
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-white/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Screenshots</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBugImageAdd}
                    className="hidden"
                    title="Upload screenshots"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-white/60 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors w-full"
                  >
                    <PhotoIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Click to upload images</span>
                  </button>
                  {bugImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bugImages.map((file, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Screenshot ${i + 1}`}
                            className="w-16 h-16 rounded-lg object-cover border border-white/80"
                          />
                          <button
                            onClick={() => setBugImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Info (auto-filled, read-only) */}
                <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Your Details (auto-filled)</p>
                  <p className="text-xs text-slate-500">Agent: {agentName || agentId || 'N/A'}</p>
                  {userEmail && <p className="text-xs text-slate-500">Email: {userEmail}</p>}
                  {userName && <p className="text-xs text-slate-500">Name: {userName}</p>}
                </div>

                {/* Submit */}
                <button
                  onClick={handleBugSubmit}
                  disabled={!bugDescription.trim() || bugSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {bugSubmitting ? 'Sending...' : 'Send Bug Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}
