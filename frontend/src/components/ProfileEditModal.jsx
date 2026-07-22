import React, { useState, useRef } from 'react';
import { X, User, Save, KeyRound, Check, AlertCircle, UploadCloud } from 'lucide-react';
import { updateProfile, changePassword } from '../services/api';

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Product', 'Operations', 'HR', 'Finance', 'Support'];

export default function ProfileEditModal({ user, isAdmin = false, onClose, onUpdated, onUpdateAvatar }) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [department, setDepartment] = useState(user.department || 'Engineering');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // First, upload avatar if a new one was selected
      if (avatarFile) {
        await onUpdateAvatar(avatarFile);
      }
      // Then, update the rest of the profile info
      const res = await updateProfile({ name, department, phone });
      setSuccess('Profile updated.');
      onUpdated?.(res.user);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setPwError('');
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess('Password changed.');
      setCurrentPassword(''); setNewPassword('');
      setTimeout(() => setPwSuccess(''), 2500);
    } catch (err) {
      setPwError(err?.message || 'Could not change password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2"><User className="w-5 h-5 text-slate-400" /> Edit Profile</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-3.5">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">{name.substring(0, 2).toUpperCase()}</div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center justify-center gap-2 transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your contact number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>

          {!isAdmin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
          {success && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />{success}</div>}

          <button type="submit" disabled={saving} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        <div className="border-t border-slate-100 p-5 space-y-3.5">
          <h4 className="text-xs font-bold text-slate-600 flex items-center gap-2"><KeyRound className="w-4 h-4 text-slate-400" /> Change Password</h4>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
            {pwError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700">{pwError}</div>}
            {pwSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700">{pwSuccess}</div>}
            <button type="submit" disabled={pwSaving} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold">
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
