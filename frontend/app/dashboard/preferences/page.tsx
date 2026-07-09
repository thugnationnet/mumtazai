'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  BellIcon,
  GlobeAltIcon,
  EyeIcon,
  SpeakerWaveIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  DevicePhoneMobileIcon,
  LanguageIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const defaultPreferences = {
  theme: 'system',
  // Store language as structured preferences for advanced settings
  language: {
    primary: 'en',
    secondary: '',
    autoDetect: false,
  },
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  notifications: {
    email: {
      enabled: true,
      frequency: 'immediate',
      types: ['security', 'billing', 'updates'],
    },
    push: {
      enabled: true,
      types: ['messages', 'reminders'],
      // Ensure quiet hours object always exists to avoid runtime errors
      quiet: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    },
    sms: {
      enabled: false,
      types: [],
    },
  },
  dashboard: {
    defaultView: 'overview',
    widgets: ['profile', 'security', 'rewards', 'analytics'],
    layout: 'grid',
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false,
    keyboardNavigation: false,
  },
  privacy: {
    showOnlineStatus: true,
    allowDataCollection: true,
    shareUsageStats: false,
  },
  integrations: {},
} as const;

function normalizePreferences(raw: any) {
  const merged: any = {
    ...defaultPreferences,
    ...(raw || {}),
  };

  // Deep-merge notifications with safe defaults
  merged.notifications = {
    ...defaultPreferences.notifications,
    ...(raw?.notifications || {}),
    email: {
      ...defaultPreferences.notifications.email,
      ...(raw?.notifications?.email || {}),
    },
    push: {
      ...defaultPreferences.notifications.push,
      ...(raw?.notifications?.push || {}),
      quiet: {
        ...defaultPreferences.notifications.push.quiet,
        ...(raw?.notifications?.push?.quiet || {}),
      },
    },
    sms: {
      ...defaultPreferences.notifications.sms,
      ...(raw?.notifications?.sms || {}),
    },
  };

  // Merge nested objects that are read as flags
  merged.accessibility = {
    ...defaultPreferences.accessibility,
    ...(raw?.accessibility || {}),
  };

  merged.privacy = {
    ...defaultPreferences.privacy,
    ...(raw?.privacy || {}),
  };

  // Normalize language: accept legacy string or structured object
  const lang = raw?.language ?? defaultPreferences.language;
  if (typeof lang === 'string') {
    merged.language = {
      primary: lang || 'en',
      secondary: '',
      autoDetect: false,
    };
  } else {
    merged.language = {
      primary: lang?.primary || 'en',
      secondary: lang?.secondary || '',
      autoDetect: !!lang?.autoDetect,
    };
  }

  return merged;
}

export default function PreferencesPage() {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preferences, setPreferences] = useState(() =>
    normalizePreferences(defaultPreferences)
  );

  const fetchPreferences = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/preferences/${state.user.id}`, {
        credentials: 'include',
        signal,
      });

      if (response.ok) {
        const result = await response.json();
        setPreferences(normalizePreferences(result.data));
      } else {
        setMessage({ type: 'error', text: 'Failed to load preferences' });
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Error loading preferences' });
    } finally {
      setLoading(false);
    }
  }, [state.user?.id, setLoading, setPreferences, setMessage]);

  // Fetch preferences on mount
  useEffect(() => {
    if (state.user?.id) {
      const controller = new AbortController();
      fetchPreferences(controller.signal);
      return () => controller.abort();
    }
  }, [state.user, fetchPreferences]);

  const savePreferences = async (updatedPrefs) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/user/preferences/${state.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedPrefs),
      });

      if (response.ok) {
        const result = await response.json();
        setPreferences(normalizePreferences(result.data));
        setMessage({
          type: 'success',
          text: 'Preferences saved successfully!',
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Error saving preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (path, value) => {
    const newPrefs = { ...preferences };
    const keys = path.split('.');
    let current = newPrefs;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setPreferences(newPrefs);

    // Auto-save preferences after a short delay
    clearTimeout(updatePreference.timeoutId);
    updatePreference.timeoutId = setTimeout(() => {
      savePreferences(newPrefs);
    }, 500);
  };

  const themes = [
    {
      id: 'light',
      name: 'Light',
      icon: SunIcon,
      description: 'Clean and bright interface',
    },
    { id: 'dark', name: 'Dark', description: 'Easy on the eyes in low light' },
    {
      id: 'system',
      name: 'System',
      description: 'Matches your device settings',
    },
  ];

  const colors = [
    { id: 'brand', name: 'Brand Blue', color: 'bg-brand-500' },
    { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
    { id: 'green', name: 'Forest Green', color: 'bg-green-500' },
    { id: 'purple', name: 'Royal Purple', color: 'bg-purple-500' },
    { id: 'orange', name: 'Sunset Orange', color: 'bg-orange-500' },
  ];

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'zh', name: 'Chinese', native: '中文' },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neural-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-neural-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-brand-600 to-accent-600 text-white overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="preferences-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#preferences-grid)"/>
          </svg>
        </div>
        <div className="container-custom text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Cog6ToothIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Preferences</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Customize your experience and interface settings
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-white text-brand-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Status Section */}
      <section className="py-6 px-4 bg-white border-b border-gray-200">
        <div className="container-custom">
          <div className="flex items-center justify-end space-x-4">
            {saving && (
              <div className="flex items-center text-brand-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500 mr-2"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
          </div>

          {/* Status Message */}
          {message.text && (
            <div
              className={`p-4 rounded-lg mb-4 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </section>

      {/* Preferences Content */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <div className="space-y-8">
            {/* Appearance Settings */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <div className="flex items-center mb-6">
                <PaintBrushIcon className="w-6 h-6 text-brand-500 mr-3" />
                <h3 className="text-xl font-semibold text-neural-900">
                  Appearance
                </h3>
              </div>

              <div className="space-y-6">
                {/* Theme Mode */}
                <div>
                  <h4 className="font-medium text-neural-900 mb-3">
                    Theme Mode
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => updatePreference('theme', theme.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          preferences.theme === theme.id
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-neural-200 hover:border-neural-300'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {theme.icon && (
                            <theme.icon className="w-5 h-5 mr-2" />
                          )}
                          <h5 className="font-medium text-neural-900">
                            {theme.name}
                          </h5>
                        </div>
                        <p className="text-sm text-neural-600">
                          {theme.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <h4 className="font-medium text-neural-900 mb-3">Language</h4>
                  <select
                    value={(preferences.language as any)?.primary || 'en'}
                    onChange={(e) =>
                      updatePreference('language.primary', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.native} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <h4 className="font-medium text-neural-900 mb-3">Timezone</h4>
                  <select
                    value={preferences.timezone || 'UTC'}
                    onChange={(e) =>
                      updatePreference('timezone', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <div className="flex items-center mb-6">
                <BellIcon className="w-6 h-6 text-brand-500 mr-3" />
                <h3 className="text-xl font-semibold text-neural-900">
                  Notifications
                </h3>
              </div>

              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="border border-neural-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-neural-900">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-neural-600">
                        Receive updates and alerts via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.email.enabled}
                        onChange={(e) =>
                          updatePreference(
                            'notifications.email.enabled',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  {preferences.notifications.email.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neural-700 mb-2">
                          Frequency
                        </label>
                        <select
                          value={preferences.notifications.email.frequency}
                          onChange={(e) =>
                            updatePreference(
                              'notifications.email.frequency',
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Summary</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neural-700 mb-3">
                          Notification Types
                        </label>
                        <div className="space-y-3">
                          {Object.entries(
                            preferences.notifications.email.types
                          ).map(([type, enabled]) => (
                            <div
                              key={type}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm text-neural-700 capitalize">
                                {type === 'system' && 'System Updates'}
                                {type === 'security' && 'Security Alerts'}
                                {type === 'updates' && 'Product Updates'}
                                {type === 'marketing' &&
                                  'Marketing & Promotions'}
                                {type === 'community' && 'Community Activity'}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  onChange={(e) =>
                                    updatePreference(
                                      `notifications.email.types.${type}`,
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Push Notifications */}
                <div className="border border-neural-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-neural-900">
                        Push Notifications
                      </h4>
                      <p className="text-sm text-neural-600">
                        Receive instant notifications on your device
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.push.enabled}
                        onChange={(e) =>
                          updatePreference(
                            'notifications.push.enabled',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  {preferences.notifications.push.enabled && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-neural-900">
                            Quiet Hours
                          </h5>
                          <p className="text-sm text-neural-600">
                            Disable notifications during specified hours
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              preferences.notifications.push.quiet.enabled
                            }
                            onChange={(e) =>
                              updatePreference(
                                'notifications.push.quiet.enabled',
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                      </div>

                      {preferences.notifications.push.quiet.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neural-700 mb-2">
                              From
                            </label>
                            <input
                              type="time"
                              value={preferences.notifications.push.quiet.start}
                              onChange={(e) =>
                                updatePreference(
                                  'notifications.push.quiet.start',
                                  e.target.value
                                )
                              }
                              className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neural-700 mb-2">
                              To
                            </label>
                            <input
                              type="time"
                              value={preferences.notifications.push.quiet.end}
                              onChange={(e) =>
                                updatePreference(
                                  'notifications.push.quiet.end',
                                  e.target.value
                                )
                              }
                              className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Language & Region */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <div className="flex items-center mb-6">
                <GlobeAltIcon className="w-6 h-6 text-brand-500 mr-3" />
                <h3 className="text-xl font-semibold text-neural-900">
                  Language & Region
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neural-700 mb-2">
                    Primary Language
                  </label>
                  <select
                    value={preferences.language.primary}
                    onChange={(e) =>
                      updatePreference('language.primary', e.target.value)
                    }
                    className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neural-700 mb-2">
                    Secondary Language
                  </label>
                  <select
                    value={preferences.language.secondary}
                    onChange={(e) =>
                      updatePreference('language.secondary', e.target.value)
                    }
                    className="w-full p-3 border border-neural-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-neural-900">
                      Auto-detect Language
                    </h4>
                    <p className="text-sm text-neural-600">
                      Automatically detect content language
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.language.autoDetect}
                      onChange={(e) =>
                        updatePreference(
                          'language.autoDetect',
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Accessibility */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
              <div className="flex items-center mb-6">
                <EyeIcon className="w-6 h-6 text-brand-500 mr-3" />
                <h3 className="text-xl font-semibold text-neural-900">
                  Accessibility
                </h3>
              </div>

              <div className="space-y-6">
                {Object.entries({
                  highContrast: {
                    title: 'High Contrast',
                    description:
                      'Increase color contrast for better visibility',
                  },
                  reduceMotion: {
                    title: 'Reduce Motion',
                    description: 'Minimize animations and transitions',
                  },
                  screenReader: {
                    title: 'Screen Reader Support',
                    description: 'Enhanced compatibility with screen readers',
                  },
                  keyboardNavigation: {
                    title: 'Keyboard Navigation',
                    description: 'Enable keyboard shortcuts and navigation',
                  },
                }).map(([key, { title, description }]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-neural-900">{title}</h4>
                      <p className="text-sm text-neural-600">{description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.accessibility[key]}
                        onChange={(e) =>
                          updatePreference(
                            `accessibility.${key}`,
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neural-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neural-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <button className="btn-secondary">Reset to Default</button>
              <button className="btn-primary">Save Preferences</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
