import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { supabase } from '../supabaseClient';
import { validatePassword } from '../utils/security';
import { useNavigate } from 'react-router-dom';


const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, logout, login, signup, showToast  } = useSideQuest();
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';

  // --- INTERNAL STATE ---
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Traveler');
  const [inviteCode, setInviteCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
const [mfaFactorId, setMfaFactorId] = useState('');


  // UI States
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  if (!showAuthModal) return null;

  const handleExit = async () => {

    if (mode === 'mfa_challenge') {
      await logout();
      setMode('login');
    }
    setShowAuthModal(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
        if (mode === 'login') {
            // 1. Log in
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // 2. DIRECT CHECK: Get factors directly from the user data we just received
            const factors = data.user?.factors || [];
            const verifiedFactor = factors.find(f => f.status === 'verified');

            if (verifiedFactor) {
                setMfaFactorId(verifiedFactor.id);
                setMode('mfa_challenge');
                setLoading(false);
                return;
            }

            setShowAuthModal(false);
        }
        else if (mode === 'mfa_challenge') {
            const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
            if (challenge.error) throw challenge.error;

            const verify = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: challenge.data.id,
                code: mfaCode
            });

            if (verify.error) throw verify.error;
            setShowAuthModal(false);
        }
        else if (mode === 'signup') {
            const { isValid, message } = validatePassword(password);
            if (!isValid) {
                showToast(message, 'error');
                setLoading(false);
                return;
            }
            const success = await signup(email, password, name, role, inviteCode);
            if (success) setShowAuthModal(false);
        }
        else if (mode === 'reset') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            showToast("Check your email for the recovery link!", 'info');
            setMode('login');
        }
    } catch (err) {
        console.error("Auth Error:", err);
        showToast(err.message || "Authentication failed.", 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    // FIX: z-[1200] ensures this sits on top of Navbar (1100) and Map (800)
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${isDark ? 'bg-[#0d4b4b] border border-cyan-900/60' : 'bg-white'}`}>

        {/* Header */}
        <div className={`p-6 text-center relative ${isDark ? 'bg-[#0f5c5c]' : 'bg-brand-600'}`}>
        <button
          onClick={async () => {
        if (mode === 'mfa_challenge') {
            await supabase.auth.signOut();
            setMode('login');
        }
        setShowAuthModal(false);
           }}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
         disabled={loading}
        >
             <X size={24} />
            </button>
            <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                 {mode === 'login' ? 'Welcome Back' :
                  mode === 'signup' ? 'Join the Quest' :
                    mode === 'mfa_challenge' ? 'Security Check' : 'Reset Password'}
                </h2>
                <p className="text-brand-100 text-sm font-medium">
                  {mode === 'login' ? 'Ready for your next adventure?' :
                   mode === 'signup' ? 'Start your journey of impact.' :
                     mode === 'mfa_challenge' ? 'Confirm your identity to continue.' : 'We will email you a recovery link.'}
                </p>
        </div>

        <div className={`p-8 ${isDark ? 'text-cyan-50' : ''}`}>
            <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'mfa_challenge' && (
        <div className="space-y-4 animate-in fade-in zoom-in">
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-[#0a3a3a] border border-cyan-900/50' : 'bg-brand-50'}`}>
                <p className={`text-sm font-bold ${isDark ? 'text-cyan-100' : 'text-brand-700'}`}>Authenticator Code Required</p>
            </div>
            <input
                type="text"
                maxLength="6"
                className={`w-full border-2 p-4 rounded-xl text-center text-3xl font-black tracking-[0.5em] outline-none ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50 text-cyan-50 focus:border-cyan-500' : 'border-gray-200 focus:border-brand-500'}`}
                placeholder="000000"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                autoFocus
            />
        </div>
    )}

                {mode === 'signup' && (
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Adventurer Name</label>
                        <input
                            className={`w-full border-2 p-3 rounded-xl focus:ring-0 outline-none transition-all font-medium ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50 text-cyan-50 placeholder:text-cyan-200/60 focus:border-cyan-500' : 'border-gray-200 focus:border-brand-500'}`}
                            placeholder="Your Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required={mode === 'signup'}
                        />
                    </div>
                )}
                {mode !== 'mfa_challenge' && (
                <div>
                    <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Email</label>
                    <input
                        type="email"
                        className={`w-full border-2 p-3 rounded-xl focus:ring-0 outline-none transition-all ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50 text-cyan-50 placeholder:text-cyan-200/60 focus:border-cyan-500' : 'border-gray-200 focus:border-brand-500'}`}
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                )}

                {/* 1. HIDE PASSWORD IF RESETTING */}
                {mode !== 'reset' && mode !== 'mfa_challenge' && (
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Password</label>
                        <div className="relative">
                            <Lock className={`absolute left-3 top-3.5 ${isDark ? 'text-cyan-300/70' : 'text-gray-400'}`} size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full border-2 p-3 pl-10 pr-10 rounded-xl focus:ring-0 outline-none transition-all ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50 text-cyan-50 placeholder:text-cyan-200/60 focus:border-cyan-500' : 'border-gray-200 focus:border-brand-500'}`}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required={mode !== 'reset'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-3.5 focus:outline-none ${isDark ? 'text-cyan-300/70 hover:text-cyan-100' : 'text-gray-400 hover:text-brand-600'}`}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. ADD FORGOT PASSWORD LINK */}
                {mode === 'login' && (
                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            onClick={() => setMode('reset')}
                            className={`text-xs font-bold ${isDark ? 'text-cyan-200 hover:text-cyan-50' : 'text-brand-600 hover:text-brand-700'}`}
                        >
                            Forgot Password?
                        </button>
                    </div>
                )}

                {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {['Traveler', 'Partner'].map((r) => (
                             <button
                                type="button"
                                key={r}
                                onClick={() => { setRole(r); setInviteCode(''); }}
                                className={`p-2 rounded-xl border-2 text-sm font-bold transition-all ${role === r ? (isDark ? 'border-cyan-600 bg-[#0f5c5c] text-cyan-50' : 'border-brand-500 bg-brand-50 text-brand-700') : (isDark ? 'border-cyan-900/50 bg-[#0a3a3a] text-cyan-200/70 hover:border-cyan-700' : 'border-gray-100 hover:border-gray-200 text-gray-400')}`}
                             >
                                {r}
                             </button>
                        ))}
                    </div>
                )}
                
                {mode === 'signup' && role === 'Partner' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Invite Code</label>
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="SQ1111"
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            className={`w-full border-2 p-3 rounded-xl outline-none font-mono font-bold tracking-widest text-center uppercase ${isDark ? 'bg-[#0a3a3a] border-cyan-900/50 text-cyan-50 focus:border-cyan-500' : 'border-gray-200 focus:border-brand-500'}`}
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-cyan-200/70' : 'text-gray-400'}`}>6-character code provided by the Game Masters.</p>
                        <button
                            type="button"
                            onClick={() => { setShowAuthModal(false); navigate('/how-it-works?tab=partner'); }}
                            className="text-xs font-bold mt-2 underline"
                            style={{ color: '#107870' }}
                        >
                            Don't have a code? Request an invite →
                        </button>
                    </div>
                )}


                    <button
                    type="submit"
                    disabled={loading || (mode === 'signup' && role === 'Partner' && inviteCode.length !== 6)}
                    className={`w-full text-white py-3.5 rounded-xl font-bold text-lg transition-all mt-4 flex items-center justify-center ${
                        loading ? 'bg-brand-400 cursor-not-allowed' : `${isDark ? 'bg-brand-600 hover:bg-brand-700 active:scale-95' : 'bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-lg shadow-brand-200'}`
                    }`}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                ) : (
                   mode === 'login' ? 'Log In' :
                   mode === 'signup' ? 'Start Adventure' :
                   mode === 'mfa_challenge' ? 'Verify Identity' :
                       'Send Reset Link'
                    )}
                            </button>
                             </form>

            {/* 3. UPDATE FOOTER FOR RESET MODE */}
            <div className={`mt-6 text-center text-sm font-medium ${isDark ? 'text-cyan-200/80' : 'text-gray-600'}`}>
            {(mode === 'reset' || mode === 'mfa_challenge') ? (
             <button
             type="button"
             onClick={async () => {
                 if (mode === 'mfa_challenge') {
                     await supabase.auth.signOut();
                 }
                 setMode('login');
             }}
             className={`flex items-center justify-center w-full ${isDark ? 'text-cyan-200/80 hover:text-cyan-50' : 'text-gray-500 hover:text-brand-600'}`}
         >
             <ArrowLeft size={16} className="mr-1" /> Back to Login
         </button>
                ) : (
                    <>
                        {mode === 'login' ? "New to SideQuest? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className={`font-bold hover:underline ${isDark ? 'text-cyan-200 hover:text-cyan-50' : 'text-brand-600'}`}
                            disabled={loading}
                        >
                            {mode === 'login' ? 'Create Account' : 'Log in'}
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;