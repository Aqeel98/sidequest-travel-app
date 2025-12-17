import React, { useState } from 'react';
import { X, Lock } from 'lucide-react'; 
import { useSideQuest } from '../context/SideQuestContext';

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, login, signup } = useSideQuest();
  const [mode, setMode] = useState('login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [name, setName] = useState('');
  const [role, setRole] = useState('Traveler');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'login') {
        await login(email, password);
    } else {
        await signup(email, password, name, role);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden">
        
        <div className="bg-brand-600 p-6 text-center relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                <X size={24} />
            </button>
            <h2 className="text-3xl font-extrabold text-white mb-1">
                {mode === 'login' ? 'Welcome Back' : 'Join SideQuest'}
            </h2>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {mode === 'signup' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input className="w-full border p-3 rounded-xl" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input type="email" className="w-full border p-3 rounded-xl" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="password" className="w-full border p-3 pl-10 rounded-xl" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                </div>

                {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {['Traveler', 'Partner'].map((r) => (
                             <button type="button" key={r} onClick={() => setRole(r)}
                                className={`p-2 rounded-lg border-2 text-sm font-bold ${role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'}`}>
                                {r}
                             </button>
                        ))}
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all mt-4">
                    {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
                </button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-600">
                {mode === 'login' ? "New here? " : "Already have an account? "}
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-brand-600 font-bold hover:underline">
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;