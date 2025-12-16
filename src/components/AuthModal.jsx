import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, login } = useSideQuest();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-4 text-center">{mode === 'login' ? 'Welcome Back' : 'Join SideQuest'}</h2>
        
        <div className="space-y-4">
          {mode === 'signup' && <input className="w-full border p-3 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />}
          <input className="w-full border p-3 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={() => login(email, name)} className="w-full bg-green-500 text-white py-3 rounded font-bold">{mode === 'login' ? 'Log In' : 'Sign Up'}</button>
        </div>
        
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-center mt-4 text-green-600 text-sm hover:underline">
           {mode === 'login' ? 'Create Account' : 'Have an account? Login'}
        </button>
      </div>
    </div>
  );
};
export default AuthModal;