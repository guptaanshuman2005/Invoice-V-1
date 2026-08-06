
import React, { useState } from 'react';
import type { User } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import { validateRequired, validateEmail, validatePasswordStrength } from '../utils/validation';

interface UserProfileProps {
    user: User;
    onUpdateProfile: (updatedUser: User) => void;
    onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateProfile, onClose }) => {
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        setSuccess(null);

        // Validation
        const nameError = validateRequired(name);
        if (nameError) { setError("Name is required."); return; }
        
        const emailError = validateEmail(email);
        if (emailError) { setError(emailError); return; }

        let passwordHash = user.passwordHash;
        if (newPassword) {
            const passError = validatePasswordStrength(newPassword);
            if (passError) { setError(passError); return; }
            if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
            
            // Simple hash for demo - reuse logic from App
            let h = 0;
            for(let i = 0; i < newPassword.length; i++) h = Math.imul(31, h) + newPassword.charCodeAt(i) | 0;
            passwordHash = h.toString();
        }

        onUpdateProfile({ ...user, name, email, passwordHash });
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
            setSuccess(null);
            onClose();
        }, 1500);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-bold">
                    {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account information</p>
                </div>
            </div>

            <div className="space-y-4">
                <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                <Input label="Email Address" value={email} onChange={e => setEmail(e.target.value)} disabled />
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Change Password</h3>
                    <div className="space-y-4">
                        <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
                        {newPassword && (
                            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        )}
                    </div>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}
            {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg">{success}</div>}

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </div>
    );
};

export default UserProfile;
