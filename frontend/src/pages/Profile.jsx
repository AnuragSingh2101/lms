import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Mail, Camera, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useNotifications();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `http://localhost:5000${user.avatar}` : ''
  );
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    const result = await updateProfile(formData);
    if (result.success) {
      addToast('Success', 'Profile updated successfully!', 'success');
    } else {
      addToast('Error', result.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto animate-slide-in space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Customize your name, email, and avatar picture details
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Avatar upload wrapper */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24">
              <img
                src={avatarPreview || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
                alt="Profile Preview"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20"
              />
              <label
                htmlFor="avatar-file-input"
                className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg cursor-pointer shadow-md transition-colors"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <span className="text-[10px] text-slate-400">Supported types: JPG, PNG. Max 5MB</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full pl-9 pr-4 py-2 border dark:border-slate-800 bg-transparent rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="yourname@domain.com"
                  className="w-full pl-9 pr-4 py-2 border dark:border-slate-800 bg-transparent rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>

        </form>
      </div>

    </div>
  );
};

export default Profile;
