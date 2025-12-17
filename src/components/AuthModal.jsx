import React, { useState } from 'react';
import { X, User, Briefcase } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, login } = useSideQuest();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Traveler'); // Default role

  if (!showAuthModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return alert('Please enter an email');
    // If logging in, role doesn't matter (it's loaded from DB). 
    // If signing up, we pass the selected role.
    login(email, name, role);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-600 p-6 text-center relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                <X size={24} />
            </button>
            <h2 className="text-3xl font-extrabold text-white mb-1">
                {mode === 'login' ? 'Welcome Back' : 'Join SideQuest'}
            </h2>
            <p className="text-brand-100 text-sm">
                {mode === 'login' ? 'Continue your journey of impact.' : 'Start traveling with purpose today.'}
            </p>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name Input (Signup Only) */}
                {mode === 'signup' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                            placeholder="e.g. John Doe" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                    </div>
                )}

                {/* Email Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                        type="email"
                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                        placeholder="you@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                </div>

                {/* Role Selection (Signup Only) */}
                {mode === 'signup' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">I want to join as a:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('Traveler')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                    role === 'Traveler' 
                                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                                }`}
                            >
                                <User size={24} className="mb-1" />
                                <span className="font-bold text-sm">Traveler</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('Partner')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                    role === 'Partner' 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                                }`}
                            >
                                <Briefcase size={24} className="mb-1" />
                                <span className="font-bold text-sm">Partner / NGO</span>
                            </button>
                        </div>
                    </div>
                )}

                <button type="submit" className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-200 transform hover:-translate-y-0.5">
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                </button>
            </form>
            
            <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                        className="text-brand-600 font-bold hover:underline"
                    >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;