'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import QRCode from 'qrcode';

type Recommendation = {
  id: string | number;
  type?: string;
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
};

type TrustedDevice = {
  id: string;
  name: string;
  type: string;
  lastSeen: string;
  location: string;
  browser: string;
  current: boolean;
  ipAddress?: string;
};

type ActiveSession = {
  id: string;
  createdAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isCurrent: boolean;
  browser?: string;
  device?: string;
  location?: string;
};

type LoginHistoryEntry = {
  id: string;
  date: string;
  device: string;
  location: string;
  status: string;
  ip: string;
};

type SecurityOverview = {
  securityScore: number;
  recommendations: Recommendation[];
  lastPasswordChange: string;
  twoFactorSecret?: string;
};

export default function SecuritySettingsPage() {
  const { state } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fetchState, setFetchState] = useState({ loading: true, error: '' });

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA data
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [setting2FA, setSetting2FA] = useState(false);

  // Device, session, and history data
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [securityOverview, setSecurityOverview] =
    useState<SecurityOverview | null>(null);
  const [showLoginHistory, setShowLoginHistory] = useState(false);

  const defaultRecommendations: Recommendation[] = [
    {
      id: 'enable-2fa',
      type: 'warning',
      title: 'Enable Two-Factor Authentication',
      description: 'Secure your account with 2FA for better protection',
      priority: 'high',
    },
  ];

  const normalizeDevices = useCallback((rawDevices: unknown = []): TrustedDevice[] => {
    const devices = Array.isArray(rawDevices) ? rawDevices : [];
    return devices.map((device, index) => ({
      id: String(device.id ?? device._id ?? index),
      name:
        device.name || device.deviceName || device.model || 'Unknown Device',
      type: device.type || device.deviceType || 'desktop',
      lastSeen: device.lastSeen || device.updatedAt || new Date().toISOString(),
      location: device.location || device.geoLocation || 'Unknown location',
      browser: device.browser || device.userAgent || 'Unknown browser',
      current: Boolean(device.current ?? device.isCurrent ?? false),
      ipAddress: device.ipAddress || device.ip || '',
    }));
  }, []);

  const normalizeSessions = useCallback((rawSessions: unknown = []): ActiveSession[] => {
    const sessions = Array.isArray(rawSessions) ? rawSessions : [];
    return sessions.map((session, index) => ({
      id: String(session.id ?? session._id ?? index),
      createdAt: session.createdAt || new Date().toISOString(),
      lastActivity:
        session.lastActivity || session.updatedAt || new Date().toISOString(),
      ipAddress: session.ipAddress || session.ip || 'Unknown',
      userAgent: session.userAgent || 'Unknown',
      isCurrent: Boolean(session.isCurrent ?? false),
      browser: detectBrowser(session.userAgent || ''),
      device: detectDevice(session.userAgent || ''),
      location: session.location || 'Current Session',
    }));
  }, []);

  const normalizeLoginHistory = useCallback((rawHistory: unknown = []): LoginHistoryEntry[] => {
    const history = Array.isArray(rawHistory) ? rawHistory : [];
    return history.map((entry, index) => ({
      id: String(entry.id ?? entry._id ?? index),
      date: entry.date || entry.timestamp || new Date().toISOString(),
      device: entry.device || entry.deviceName || 'Unknown Device',
      location: entry.location || 'Unknown location',
      status: entry.status || (entry.success === false ? 'blocked' : 'success'),
      ip: entry.ip || entry.ipAddress || '—',
    }));
  }, []);

  function detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
      return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  }

  function detectDevice(userAgent: string): string {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Linux')) return 'Linux Computer';
    return 'Computer';
  }

  const fetchSecurityData = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      if (!state.user?.id) return;

      if (!options?.silent) {
        setFetchState({ loading: true, error: '' });
      }

      try {
        const res = await fetch(`/api/user/security/${state.user.id}`, {
          credentials: 'include',
          signal: options?.signal,
        });

        if (!res.ok) {
          throw new Error('Unable to load security settings at the moment');
        }

        const payload = await res.json();
        const data = payload.data || payload.security || payload;

        setSecurityOverview({
          securityScore: data?.securityScore ?? 0,
          recommendations: Array.isArray(data?.recommendations) ? data.recommendations : [],
          lastPasswordChange:
            data?.passwordLastChanged ||
            data?.lastPasswordChange ||
            new Date().toISOString(),
          twoFactorSecret: data?.twoFactorSecret || '',
        });

        setTwoFactorEnabled(Boolean(data?.twoFactorEnabled));
        setBackupCodes(Array.isArray(data?.backupCodes) ? data.backupCodes : []);
        setTrustedDevices(normalizeDevices(data?.trustedDevices));
        setActiveSessions(normalizeSessions(data?.activeSessions));
        setLoginHistory(normalizeLoginHistory(data?.loginHistory));
        setFetchState({ loading: false, error: '' });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error('Error fetching security data:', error);
        setFetchState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load security settings',
        });
      }
    },
    [state.user?.id, normalizeDevices, normalizeSessions, normalizeLoginHistory]
  );

  useEffect(() => {
    if (!state.user?.id) return;
    const controller = new AbortController();
    fetchSecurityData({ signal: controller.signal });
    return () => controller.abort();
  }, [state.user?.id, fetchSecurityData]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: state.user?.id, currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSecurityData({ silent: true });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to change password',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password' });
    }
    setLoading(false);
  };

  const handleSetup2FA = async () => {
    setSetting2FA(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: state.user?.id }),
      });

      const data = await res.json();

      if (data.success) {
        // Backend returns otpauth:// URL — generate QR code image client-side
        const otpauthUrl = data.qrCodeUrl || data.qrCode || '';
        if (otpauthUrl) {
          try {
            const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });
            setQrCodeUrl(qrDataUrl);
          } catch {
            // Fallback: use Google Charts API
            setQrCodeUrl(`https://chart.googleapis.com/chart?cht=qr&chs=256x256&chl=${encodeURIComponent(otpauthUrl)}`);
          }
        }
        setManualSecret(data.secret || data.manualEntryKey || data.manualSecret || '');
        setBackupCodes(data.backupCodes || []);
        setShowQRCode(true);
        setVerifying2FA(true);
        setMessage({
          type: 'info',
          text: 'Scan the QR code with your authenticator app, then enter the 6-digit code below',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to setup 2FA',
        });
        setSetting2FA(false);
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setMessage({ type: 'error', text: 'Error setting up 2FA' });
      setSetting2FA(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      handleSetup2FA();
    } else {
      const password = prompt('Please enter your password to disable 2FA:');
      if (!password) {
        setMessage({ type: 'error', text: 'Password required to disable 2FA' });
        return;
      }

      try {
        const res = await fetch('/api/user/security/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: state.user?.id, password }),
        });

        const data = await res.json();

        if (data.success) {
          setTwoFactorEnabled(false);
          setShowQRCode(false);
          setShowBackupCodes(false);
          setQrCodeUrl('');
          setManualSecret('');
          setBackupCodes([]);
          setVerifying2FA(false);
          setSetting2FA(false);
          setVerificationCode('');
          setMessage({ type: 'success', text: '2FA has been disabled' });
          fetchSecurityData({ silent: true });
        } else {
          setMessage({
            type: 'error',
            text: data.message || 'Failed to disable 2FA',
          });
        }
      } catch (error) {
        console.error('Error disabling 2FA:', error);
        setMessage({ type: 'error', text: 'Error disabling 2FA' });
      }
    }
  };

  const handleVerify2FACode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/user/security/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: state.user?.id, code: verificationCode }),
      });

      const data = await res.json();

      if (data.success) {
        setTwoFactorEnabled(true);
        setVerifying2FA(false);
        setSetting2FA(false);
        setShowBackupCodes(true);
        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
        }
        setMessage({
          type: 'success',
          text: '2FA has been enabled successfully!',
        });
        setVerificationCode('');
        fetchSecurityData({ silent: true });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Invalid verification code',
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      setMessage({ type: 'error', text: 'Error verifying code' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel2FASetup = () => {
    setVerifying2FA(false);
    setSetting2FA(false);
    setShowQRCode(false);
    setQrCodeUrl('');
    setManualSecret('');
    setVerificationCode('');
    setBackupCodes([]);
    setMessage({ type: '', text: '' });
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const content = `One Last AI - Two-Factor Authentication Backup Codes
================================================
Generated: ${new Date().toLocaleString()}
Account: ${state.user?.email || 'Unknown'}

IMPORTANT: Store these codes in a safe place.
Each code can only be used once.

Your Backup Codes:
------------------
${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

------------------
If you lose access to your authenticator app,
use one of these codes to sign in.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mumtazai-backup-codes-${
      new Date().toISOString().split('T')[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Backup codes downloaded!' });
  };

  const handleCopyBackupCodes = async () => {
    if (backupCodes.length === 0) return;

    const codesText = backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      setMessage({
        type: 'success',
        text: 'Backup codes copied to clipboard!',
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy codes' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (
      sessionId === 'current' ||
      activeSessions.find((s) => s.id === sessionId)?.isCurrent
    ) {
      setMessage({ type: 'error', text: 'Cannot revoke current session' });
      return;
    }

    if (!confirm('Are you sure you want to end this session?')) return;

    try {
      const res = await fetch(`/api/user/security/${state.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activeSessions: activeSessions.filter((s) => s.id !== sessionId),
        }),
      });

      if (res.ok) {
        setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setMessage({ type: 'success', text: 'Session ended successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to end session' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error ending session' });
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out from all other devices. Continue?'))
      return;

    try {
      const currentSession = activeSessions.find((s) => s.isCurrent);
      const res = await fetch(`/api/user/security/${state.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activeSessions: currentSession ? [currentSession] : [],
        }),
      });

      if (res.ok) {
        setActiveSessions(currentSession ? [currentSession] : []);
        setMessage({
          type: 'success',
          text: 'All other sessions have been ended',
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to end sessions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error ending sessions' });
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!state.user?.id) return;
    if (!confirm('Are you sure you want to remove this device?')) return;

    try {
      const updatedDevices = trustedDevices.filter((d) => d.id !== deviceId);
      const res = await fetch(`/api/user/security/${state.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trustedDevices: updatedDevices }),
      });

      if (res.ok) {
        setTrustedDevices(updatedDevices);
        setMessage({ type: 'success', text: 'Device removed successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove device' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error removing device' });
    }
  };

  const handleRemoveAllDevices = async () => {
    if (!state.user?.id) return;
    if (
      !confirm(
        'Remove all trusted devices? This will require re-trusting each device.'
      )
    )
      return;

    try {
      const res = await fetch(`/api/user/security/${state.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trustedDevices: [] }),
      });

      if (res.ok) {
        setTrustedDevices([]);
        setMessage({ type: 'success', text: 'All trusted devices removed' });
      } else {
        setMessage({ type: 'error', text: 'Unable to remove devices' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error removing devices' });
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
      case 'tablet':
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'blocked':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const securityScore = securityOverview?.securityScore ?? 0;
  const recommendations = securityOverview?.recommendations?.length
    ? securityOverview.recommendations
    : defaultRecommendations;
  const lastPasswordChange = securityOverview?.lastPasswordChange;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="security-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#security-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <ShieldCheckIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Security Settings</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Manage your account security and privacy settings
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-white text-brand-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Security Content */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container-custom max-w-6xl">
          {fetchState.error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <div className="flex items-center justify-between">
                <p>{fetchState.error}</p>
                <button
                  className="text-sm font-medium underline"
                  onClick={() => fetchSecurityData()}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {fetchState.loading && !fetchState.error && (
            <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-brand-800">
              Syncing your latest security activity...
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Security Score */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-100 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-neural-200"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - securityScore / 100)
                      }`}
                      className="text-brand-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-neural-900">
                      {securityScore}%
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-neural-900 mb-2">
                  Security Score
                </h3>
                <p className="text-sm text-neural-600 mb-4">
                  Your account security rating
                </p>

                <div className="space-y-2 text-left">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-lg ${
                        rec.priority === 'high' ? 'bg-red-50' : 'bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <ExclamationTriangleIcon
                          className={`w-4 h-4 mr-2 flex-shrink-0 ${
                            rec.priority === 'high'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                          }`}
                        />
                        <div>
                          <p className="text-xs font-medium text-neural-900">
                            {rec.title}
                          </p>
                          <p className="text-xs text-neural-600">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Password & Authentication */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
                  <div className="flex items-center mb-6">
                    <KeyIcon className="w-6 h-6 text-brand-500 mr-3" />
                    <h3 className="text-xl font-semibold text-neural-900">
                      Password & Authentication
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Change Password */}
                    <div className="border border-neural-100 rounded-lg p-6">
                      {message.text && (
                        <div
                          className={`mb-4 p-3 rounded-lg ${
                            message.type === 'success'
                              ? 'bg-green-50 text-green-800'
                              : message.type === 'info'
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {message.text}
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-neural-900">
                            Password
                          </h4>
                          <p className="text-sm text-neural-600">
                            Last changed on {formatDate(lastPasswordChange)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-neural-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter current password"
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              className="w-full p-3 pr-12 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="w-5 h-5 text-neural-400" />
                              ) : (
                                <EyeIcon className="w-5 h-5 text-neural-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neural-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neural-700 mb-2">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border border-neural-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-neural-900">
                            Two-Factor Authentication
                          </h4>
                          <p className="text-sm text-neural-600">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={twoFactorEnabled}
                            onChange={(e) => handleToggle2FA(e.target.checked)}
                            disabled={verifying2FA || setting2FA}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 peer-disabled:opacity-50"></div>
                        </label>
                      </div>

                      {/* Show QR code when setting up */}
                      {verifying2FA && showQRCode && qrCodeUrl && (
                        <div className="space-y-4 mt-4">
                          <div className="p-6 bg-white border-2 border-brand-200 rounded-lg">
                            <div className="text-center">
                              <div className="bg-white p-4 rounded-lg inline-block mb-4 border border-neural-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={qrCodeUrl}
                                  alt="2FA QR Code"
                                  width={256}
                                  height={256}
                                  className="w-64 h-64"
                                />
                              </div>
                              <p className="text-sm text-neural-600 mb-2">
                                Scan this QR code with your authenticator app
                              </p>
                              <p className="text-xs text-neural-500 mb-4">
                                (Google Authenticator, Authy, Microsoft
                                Authenticator, etc.)
                              </p>
                              
                              {/* Manual Entry Code */}
                              {manualSecret && (
                                <div className="mt-4 p-4 bg-neural-50 rounded-lg border border-neural-200">
                                  <p className="text-sm font-medium text-neural-700 mb-2">
                                    Can&apos;t scan? Enter this code manually:
                                  </p>
                                  <div className="flex items-center justify-center gap-2">
                                    <code className="px-4 py-2 bg-white border border-neural-300 rounded-lg font-mono text-lg tracking-wider select-all">
                                      {manualSecret}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(manualSecret);
                                        setMessage({ type: 'success', text: 'Secret key copied to clipboard!' });
                                      }}
                                      className="p-2 hover:bg-neural-100 rounded-lg transition-colors"
                                      title="Copy to clipboard"
                                    >
                                      <DocumentDuplicateIcon className="w-5 h-5 text-neural-600" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Backup Codes - Show immediately during setup */}
                          {backupCodes.length > 0 && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700 rounded-lg">
                              <div className="flex items-start mb-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-amber-900 dark:text-amber-200">Save Your Backup Codes</p>
                                  <p className="text-sm text-amber-700 dark:text-amber-300">Store these codes in a safe place. Each code can only be used once.</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {backupCodes.map((code, index) => (
                                  <div key={index} className="px-3 py-2 bg-white dark:bg-neural-800 border border-amber-200 dark:border-amber-700 rounded font-mono text-sm text-center text-neural-900 dark:text-neural-100">
                                    {code}
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  const codesText = backupCodes.join('\n');
                                  navigator.clipboard.writeText(codesText);
                                  setMessage({ type: 'success', text: 'Backup codes copied to clipboard!' });
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors text-sm font-medium"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                                Copy All Backup Codes
                              </button>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-neural-700 mb-2">
                                Enter 6-Digit Verification Code
                              </label>
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) =>
                                  setVerificationCode(
                                    e.target.value
                                      .replace(/\D/g, '')
                                      .slice(0, 6)
                                  )
                                }
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white border-2 border-neural-200 rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                              />
                            </div>
                            <button
                              onClick={handleVerify2FACode}
                              disabled={
                                loading || verificationCode.length !== 6
                              }
                              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                            </button>
                            <button
                              onClick={handleCancel2FASetup}
                              className="btn-ghost w-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Show status when 2FA is enabled */}
                      {twoFactorEnabled && !verifying2FA && (
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                              <div>
                                <p className="font-medium text-green-900">
                                  Authenticator App Active
                                </p>
                                <p className="text-sm text-green-700">
                                  {backupCodes.length} backup codes available
                                </p>
                              </div>
                            </div>
                          </div>

                          {backupCodes.length > 0 && (
                            <button
                              onClick={() =>
                                setShowBackupCodes(!showBackupCodes)
                              }
                              className="btn-secondary w-full"
                            >
                              {showBackupCodes ? 'Hide' : 'View'} Backup Codes
                            </button>
                          )}

                          {showBackupCodes && backupCodes.length > 0 && (
                            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-start mb-4">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-yellow-900 dark:text-yellow-200">
                                    Save these backup codes
                                  </p>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Store them in a safe place. Each code can
                                    only be used once.
                                  </p>
                                </div>
                              </div>

                              {/* Backup codes grid with clear visibility */}
                              <div className="grid grid-cols-2 gap-3 bg-white dark:bg-neural-800 p-4 rounded-lg border border-neural-200 dark:border-neural-600 mb-4">
                                {backupCodes.map((code, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-neural-50 dark:bg-neural-700 rounded-lg border border-neural-100 dark:border-neural-600"
                                  >
                                    <span className="text-xs text-neural-500 dark:text-neural-400 mr-2">
                                      {index + 1}.
                                    </span>
                                    <code className="text-sm font-mono font-bold text-neural-900 dark:text-neural-100 tracking-wider select-all">
                                      {code}
                                    </code>
                                  </div>
                                ))}
                              </div>

                              {/* Download and Copy buttons */}
                              <div className="flex gap-3">
                                <button
                                  onClick={handleDownloadBackupCodes}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                                >
                                  <ArrowDownTrayIcon className="w-5 h-5" />
                                  Download Codes
                                </button>
                                <button
                                  onClick={handleCopyBackupCodes}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neural-100 dark:bg-neural-700 text-neural-700 dark:text-neural-200 rounded-lg hover:bg-neural-200 dark:hover:bg-neural-600 transition-colors font-medium"
                                >
                                  <DocumentDuplicateIcon className="w-5 h-5" />
                                  Copy All
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trusted Devices */}
                <div className="bg-white dark:bg-neural-800 rounded-2xl p-8 shadow-sm border border-neural-100 dark:border-neural-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-6 h-6 text-brand-500 mr-3" />
                      <h3 className="text-xl font-semibold text-neural-900 dark:text-neural-100">
                        Trusted Devices
                      </h3>
                    </div>
                    {trustedDevices.length > 0 && (
                      <button
                        className="btn-ghost text-red-600"
                        onClick={handleRemoveAllDevices}
                      >
                        Remove All
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {trustedDevices.length === 0 ? (
                      <div className="text-center py-12">
                        <ShieldCheckIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500">
                          No trusted devices found
                        </p>
                        <p className="text-sm text-neutral-400 mt-1">
                          Devices will appear here after you log in
                        </p>
                      </div>
                    ) : (
                      trustedDevices.map((device) => (
                        <div
                          key={device.id}
                          className={`p-4 border rounded-lg ${
                            device.current
                              ? 'border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30'
                              : 'border-neural-100 dark:border-neural-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="p-2 bg-neural-100 dark:bg-neural-700 rounded-lg mr-4">
                                {getDeviceIcon(device.type)}
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-medium text-neural-900 dark:text-neural-100">
                                    {device.name}
                                  </h4>
                                  {device.current && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-neural-600 dark:text-neural-400">
                                  {device.browser} • {device.location}
                                </p>
                                <p className="text-xs text-neural-500 dark:text-neural-500">
                                  Last seen {formatDateTime(device.lastSeen)}
                                </p>
                              </div>
                            </div>
                            {!device.current && (
                              <button
                                onClick={() => handleRemoveDevice(device.id)}
                                className="btn-ghost text-red-600 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <ComputerDesktopIcon className="w-6 h-6 text-brand-500 mr-3" />
                      <h3 className="text-xl font-semibold text-neural-900">
                        Active Sessions
                      </h3>
                    </div>
                    {activeSessions.filter((s) => !s.isCurrent).length > 0 && (
                      <button
                        className="btn-ghost text-red-600"
                        onClick={handleRevokeAllSessions}
                      >
                        End All Others
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {activeSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <ComputerDesktopIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500">No active sessions</p>
                      </div>
                    ) : (
                      activeSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-4 border rounded-lg ${
                            session.isCurrent
                              ? 'border-brand-200 bg-brand-50'
                              : 'border-neural-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="p-2 bg-neural-100 rounded-lg mr-4">
                                <ComputerDesktopIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-medium text-neural-900">
                                    {session.browser} • {session.device}
                                  </h4>
                                  {session.isCurrent && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-brand-100 text-brand-700 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-neural-600">
                                  IP: {session.ipAddress}
                                </p>
                                <p className="text-xs text-neural-500">
                                  Last active:{' '}
                                  {formatDateTime(session.lastActivity)}
                                </p>
                              </div>
                            </div>
                            {!session.isCurrent && (
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                className="btn-ghost text-red-600 text-sm"
                              >
                                End Session
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Login History */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <ClockIcon className="w-6 h-6 text-brand-500 mr-3" />
                      <h3 className="text-xl font-semibold text-neural-900">
                        Login History
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowLoginHistory(!showLoginHistory)}
                      className="btn-ghost"
                    >
                      {showLoginHistory ? 'Hide' : 'View All'}
                    </button>
                  </div>

                  {showLoginHistory && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neural-100">
                            <th className="text-left py-3 text-sm font-medium text-neural-700">
                              Date & Time
                            </th>
                            <th className="text-left py-3 text-sm font-medium text-neural-700">
                              Device
                            </th>
                            <th className="text-left py-3 text-sm font-medium text-neural-700">
                              Location
                            </th>
                            <th className="text-left py-3 text-sm font-medium text-neural-700">
                              Status
                            </th>
                            <th className="text-left py-3 text-sm font-medium text-neural-700">
                              IP Address
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center">
                                <ClockIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                <p className="text-neutral-500">
                                  No login history found
                                </p>
                              </td>
                            </tr>
                          ) : (
                            loginHistory.map((login) => (
                              <tr
                                key={login.id}
                                className="border-b border-neural-50"
                              >
                                <td className="py-4 text-sm text-neural-900">
                                  {formatDateTime(login.date)}
                                </td>
                                <td className="py-4 text-sm text-neural-600">
                                  {login.device}
                                </td>
                                <td className="py-4 text-sm text-neural-600">
                                  {login.location}
                                </td>
                                <td className="py-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                      login.status
                                    )}`}
                                  >
                                    {login.status === 'success' && (
                                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                                    )}
                                    {login.status === 'blocked' && (
                                      <XCircleIcon className="w-3 h-3 mr-1" />
                                    )}
                                    {login.status.charAt(0).toUpperCase() +
                                      login.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-4 text-sm text-neural-600 font-mono">
                                  {login.ip}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!showLoginHistory && loginHistory.length > 0 && (
                    <p className="text-sm text-neural-500">
                      {loginHistory.length} login records • Click &quot;View
                      All&quot; to see history
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
