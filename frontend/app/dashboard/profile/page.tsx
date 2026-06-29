'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  PencilIcon,
  MapPinIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { profileService, ProfileData } from '../../../services/profileService';

export default function UserProfilePage() {
  const router = useRouter();
  const { state } = useAuth();
  const user = state.user;
  const authLoading = state.isLoading;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setOriginalProfile(JSON.parse(JSON.stringify(profileData)));
    } catch (err) {
      setError('Failed to load profile');
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setProfile, setOriginalProfile, setError]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !state.isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, state.isAuthenticated, router, loadProfile]);

  const handleInputChange = (field: string, value: any) => {
    if (!profile) return;

    const newProfile = { ...profile };

    // Handle nested fields like socialLinks
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newProfile[parent as keyof ProfileData] = {
        ...(newProfile[parent as keyof ProfileData] as any),
        [child]: value,
      };
    } else {
      newProfile[field as keyof ProfileData] = value as any;
    }

    setProfile(newProfile);
    setHasChanges(true);
    clearMessages();
  };

  const handlePreferenceChange = (preference: string, value: boolean) => {
    if (!profile) return;

    const newProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [preference]: value,
      },
    };

    setProfile(newProfile);
    setHasChanges(true);
    clearMessages();

    // Auto-save preferences
    savePreferences(newProfile.preferences);
  };

  const savePreferences = async (preferences: ProfileData['preferences']) => {
    if (!user) return;

    try {
      await profileService.updatePreferences(
        user.id || user.email,
        preferences
      );
      setSuccess('Preferences saved automatically');
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Save preferences error:', err);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !profile || !hasChanges) return;

    try {
      setSaving(true);
      const updatedProfile = await profileService.updateProfile(profile);
      setProfile(updatedProfile);
      setOriginalProfile(JSON.parse(JSON.stringify(updatedProfile)));
      setHasChanges(false);
      setIsEditing(false);
      setEditingSection(null);
      setSuccess('Profile updated successfully!');
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (originalProfile) {
      setProfile(JSON.parse(JSON.stringify(originalProfile)));
    }
    setHasChanges(false);
    setIsEditing(false);
    setEditingSection(null);
    clearMessages();
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setSaving(true);
      const avatarUrl = await profileService.uploadAvatar(
        user.id || user.email,
        file
      );
      setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));
      setSuccess('Avatar updated successfully!');
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError('Failed to upload avatar');
      console.error('Avatar upload error:', err);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (section: string) => {
    setIsEditing(true);
    setEditingSection(section);
    clearMessages();
  };

  const stopEditing = () => {
    setIsEditing(false);
    setEditingSection(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen neu-page-bg flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-slate-500">Unable to load profile</p>
          <Link href="/dashboard/overview" className="btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -left-20 top-1/4 w-72 h-[500px] rounded-[100px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
        <div className="absolute -right-16 -top-20 w-80 h-[600px] rounded-[100px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute left-1/3 -bottom-32 w-64 h-[400px] rounded-[80px] rotate-45 bg-gradient-to-tr from-purple-200/25 via-white/30 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute right-1/4 top-10 w-48 h-[350px] rounded-[60px] -rotate-6 bg-gradient-to-b from-white/35 via-slate-200/20 to-transparent backdrop-blur-sm border border-white/45" />
        <div className="absolute -left-10 -bottom-10 w-56 h-[300px] rounded-[70px] rotate-[30deg] bg-gradient-to-tl from-indigo-100/30 via-white/25 to-transparent backdrop-blur-sm border border-white/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-300/40 rounded-full px-4 py-1.5 mb-6">
              <span className="text-purple-700 text-xs font-bold uppercase tracking-wider">Profile</span>
            </div>
            <div className="inline-flex items-center justify-center p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg mb-6">
              <UserIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">User Profile</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Manage your personal information and preferences
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Status Messages Section */}
      <section className="py-6 px-4 bg-transparent border-b border-white/40">
        <div className="container-custom">

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-yellow-700">You have unsaved changes</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelChanges}
                    className="btn-ghost text-sm"
                    disabled={saving}
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="btn-primary text-sm"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="glass-card p-8 text-center">
                <div className="relative mb-6">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.name}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-white rounded-full p-2 shadow-lg border border-white/80 hover:bg-transparent transition-colors"
                    disabled={saving}
                    title="Upload new avatar"
                  >
                    <CameraIcon className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {profile.name}
                </h2>
                <p className="text-slate-500 mb-4">{profile.profession}</p>
                <p className="text-sm text-slate-400 mb-6">
                  {profile.company}
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-center text-slate-500">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    {profile.location}
                  </div>
                  <div className="flex items-center justify-center text-slate-500">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                  <div className="flex items-center justify-center text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Last active{' '}
                    {user.lastLoginAt
                      ? formatDateTime(user.lastLoginAt)
                      : 'Never'}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/80">
                  <h3 className="font-semibold text-slate-800 mb-3">
                    Connect
                  </h3>
                  <div className="flex justify-center space-x-3">
                    {profile.socialLinks?.linkedin && (
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="LinkedIn Profile"
                      >
                        <span className="text-sm font-medium">in</span>
                      </a>
                    )}
                    {profile.socialLinks?.twitter && (
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
                        title="Twitter Profile"
                      >
                        <span className="text-sm font-medium">tw</span>
                      </a>
                    )}
                    {profile.socialLinks?.github && (
                      <a
                        href={profile.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="GitHub Profile"
                      >
                        <span className="text-sm font-medium">gh</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">
                      Personal Information
                    </h3>
                    {editingSection === 'personal' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={stopEditing}
                          className="btn-ghost text-sm"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing('personal')}
                        className="btn-ghost text-sm"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'personal'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'personal'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          handleInputChange('email', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'personal'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'personal'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phoneNumber}
                        onChange={(e) =>
                          handleInputChange('phoneNumber', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'personal'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'personal'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) =>
                          handleInputChange('location', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'personal'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'personal'}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) =>
                          handleInputChange('bio', e.target.value)
                        }
                        rows={4}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                          editingSection === 'personal'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'personal'}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">
                      Professional Information
                    </h3>
                    {editingSection === 'professional' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={stopEditing}
                          className="btn-ghost text-sm"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing('professional')}
                        className="btn-ghost text-sm"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={profile.profession}
                        onChange={(e) =>
                          handleInputChange('profession', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'professional'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'professional'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) =>
                          handleInputChange('company', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'professional'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'professional'}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) =>
                          handleInputChange('website', e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editingSection === 'professional'
                            ? 'border-white/80 bg-white'
                            : 'border-white/80 bg-transparent'
                        }`}
                        readOnly={editingSection !== 'professional'}
                      />
                    </div>

                    {/* Social Links */}
                    <div className="md:col-span-2 mt-4">
                      <h4 className="text-lg font-medium text-slate-800 mb-4">
                        Social Links
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            LinkedIn URL
                          </label>
                          <input
                            type="url"
                            value={profile.socialLinks?.linkedin || ''}
                            onChange={(e) =>
                              handleInputChange(
                                'socialLinks.linkedin',
                                e.target.value
                              )
                            }
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              editingSection === 'professional'
                                ? 'border-white/80 bg-white'
                                : 'border-white/80 bg-transparent'
                            }`}
                            readOnly={editingSection !== 'professional'}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            Twitter URL
                          </label>
                          <input
                            type="url"
                            value={profile.socialLinks?.twitter || ''}
                            onChange={(e) =>
                              handleInputChange(
                                'socialLinks.twitter',
                                e.target.value
                              )
                            }
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              editingSection === 'professional'
                                ? 'border-white/80 bg-white'
                                : 'border-white/80 bg-transparent'
                            }`}
                            readOnly={editingSection !== 'professional'}
                            placeholder="https://twitter.com/username"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            GitHub URL
                          </label>
                          <input
                            type="url"
                            value={profile.socialLinks?.github || ''}
                            onChange={(e) =>
                              handleInputChange(
                                'socialLinks.github',
                                e.target.value
                              )
                            }
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              editingSection === 'professional'
                                ? 'border-white/80 bg-white'
                                : 'border-white/80 bg-transparent'
                            }`}
                            readOnly={editingSection !== 'professional'}
                            placeholder="https://github.com/username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="glass-card p-8">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Changes are saved automatically
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">
                          Email Notifications
                        </h4>
                        <p className="text-sm text-slate-500">
                          Receive important updates via email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.emailNotifications}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'emailNotifications',
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">
                          SMS Notifications
                        </h4>
                        <p className="text-sm text-slate-500">
                          Receive alerts via text message
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.smsNotifications}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'smsNotifications',
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">
                          Marketing Emails
                        </h4>
                        <p className="text-sm text-slate-500">
                          Receive promotional content and news
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.marketingEmails}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'marketingEmails',
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">
                          Product Updates
                        </h4>
                        <p className="text-sm text-slate-500">
                          Get notified about new features and updates
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.productUpdates}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'productUpdates',
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                {(hasChanges || isEditing) && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleCancelChanges}
                      className="btn-secondary"
                      disabled={saving}
                    >
                      Cancel Changes
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="btn-primary"
                      disabled={saving || !hasChanges}
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
