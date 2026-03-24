'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, X, Upload, User } from 'lucide-react';
import { useAuth } from '@/components/authProvider';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';

const TABS = ['Profile', 'Appearance', 'Security', 'Notifications', 'Social', 'Privacy'];

export default function SettingsModal({ open, onClose }) {
  const { avatar, setAvatar } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Avatar upload
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Change password
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password_confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(API_ENDPOINTS.auth.settings)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setSettings(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleFieldChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.auth.settings, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: settings.display_name,
          bio: settings.bio,
          email_notifications: settings.email_notifications,
          twitter_url: settings.twitter_url,
          github_url: settings.github_url,
          website_url: settings.website_url,
          profile_public: settings.profile_public,
        }),
      });
      if (!res.ok) {
        setSaveError('Failed to save settings.');
      } else {
        setSaveSuccess('Settings saved.');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch {
      setSaveError('An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchWithAuth(API_ENDPOINTS.auth.avatar, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setAvatarError(data.detail || 'Upload failed.');
        setAvatarPreview(null);
      } else {
        const data = await res.json();
        setAvatar(data.avatar_url);
      }
    } catch {
      setAvatarError('Upload failed.');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.auth.changePassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPwSuccess('Password changed successfully.');
        setPwForm({ current_password: '', new_password: '', new_password_confirm: '' });
        setTimeout(() => setPwSuccess(''), 4000);
      } else {
        setPwError(data.message || 'Failed to change password.');
      }
    } catch {
      setPwError('An error occurred.');
    } finally {
      setPwSaving(false);
    }
  };

  const currentAvatar = avatarPreview || avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <div className="w-40 border-r border-border flex-shrink-0 py-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <>
                {/* ── PROFILE ── */}
                {activeTab === 'Profile' && (
                  <div className="space-y-5">
                    {/* Avatar */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Profile Picture</label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                          {currentAvatar ? (
                            <img src={currentAvatar} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
                          >
                            <Upload className="h-4 w-4" />
                            {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                          </button>
                          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP · Max 10 MB · Resized to 400×400</p>
                          {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                      <input
                        type="text"
                        value={settings?.display_name || ''}
                        onChange={(e) => handleFieldChange('display_name', e.target.value)}
                        maxLength={100}
                        placeholder="How your name appears publicly"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
                      <textarea
                        value={settings?.bio || ''}
                        onChange={(e) => handleFieldChange('bio', e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="A short description about yourself"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{(settings?.bio || '').length}/500</p>
                    </div>

                    <SaveRow saving={saving} error={saveError} success={saveSuccess} onSave={handleSaveSettings} />
                  </div>
                )}

                {/* ── APPEARANCE ── */}
                {activeTab === 'Appearance' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
                      <div className="flex gap-3">
                        {[
                          { value: 'light', label: 'Light', Icon: Sun },
                          { value: 'dark', label: 'Dark', Icon: Moon },
                          { value: 'system', label: 'System', Icon: Monitor },
                        ].map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            onClick={() => setTheme(value)}
                            className={`flex flex-col items-center gap-2 px-5 py-3 rounded-lg border transition-colors ${
                              theme === value
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-input text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'Security' && (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Change Password</h3>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Current Password</label>
                      <input
                        type="password"
                        value={pwForm.current_password}
                        onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">New Password</label>
                      <input
                        type="password"
                        value={pwForm.new_password}
                        onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={pwForm.new_password_confirm}
                        onChange={(e) => setPwForm((p) => ({ ...p, new_password_confirm: e.target.value }))}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {pwError && <p className="text-sm text-red-500">{pwError}</p>}
                    {pwSuccess && <p className="text-sm text-green-500">{pwSuccess}</p>}
                    <button
                      type="submit"
                      disabled={pwSaving}
                      className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {pwSaving ? 'Saving…' : 'Change Password'}
                    </button>
                  </form>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'Notifications' && (
                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">Email Notifications</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Receive email alerts for new comments on your posts</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings?.email_notifications}
                        onClick={() => handleFieldChange('email_notifications', !settings?.email_notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings?.email_notifications ? 'bg-primary' : 'bg-input'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            settings?.email_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                    <SaveRow saving={saving} error={saveError} success={saveSuccess} onSave={handleSaveSettings} />
                  </div>
                )}

                {/* ── SOCIAL ── */}
                {activeTab === 'Social' && (
                  <div className="space-y-4">
                    {[
                      { field: 'twitter_url', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
                      { field: 'github_url', label: 'GitHub', placeholder: 'https://github.com/yourhandle' },
                      { field: 'website_url', label: 'Website', placeholder: 'https://yoursite.com' },
                    ].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                        <input
                          type="url"
                          value={settings?.[field] || ''}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          placeholder={placeholder}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    ))}
                    <SaveRow saving={saving} error={saveError} success={saveSuccess} onSave={handleSaveSettings} />
                  </div>
                )}

                {/* ── PRIVACY ── */}
                {activeTab === 'Privacy' && (
                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">Public Profile</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Allow others to view your profile page</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings?.profile_public}
                        onClick={() => handleFieldChange('profile_public', !settings?.profile_public)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings?.profile_public ? 'bg-primary' : 'bg-input'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            settings?.profile_public ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                    <SaveRow saving={saving} error={saveError} success={saveSuccess} onSave={handleSaveSettings} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveRow({ saving, error, success, onSave }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}
    </div>
  );
}
