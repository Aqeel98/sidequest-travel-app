import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, HeartPulse, ChevronDown, PlusCircle, LayoutDashboard, CheckCircle, Gift, Trophy, Globe, Lightbulb } from 'lucide-react'; 
import { useSideQuest } from '../context/SideQuestContext';
import { useAppPreferences } from '../context/AppPreferencesContext';

const Navbar = () => {
  const { currentUser, logout, setShowAuthModal, isHuntActive, activeEvent, myBookings } = useSideQuest();
  const { t, theme, setThemeMode, language, setLanguage, languageOptions } = useAppPreferences();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isPartnerMenuOpen, setIsPartnerMenuOpen] = useState(false);


  const isActive = (path) => 
    location.pathname === path 
      ? `text-brand-600 font-bold bg-brand-50 rounded-full px-4 py-1.5 ${isDark ? 'bg-cyan-900/50 text-cyan-100' : ''}` 
      : `text-gray-500 hover:text-brand-500 font-medium px-4 py-1.5 transition-all ${isDark ? 'text-cyan-100/90 hover:text-cyan-50' : ''}`;

  const mobileNavClass = (path) =>
    `p-3 rounded-lg transition-colors ${
      location.pathname === path
        ? (isDark ? 'bg-[#0f5c5c] text-cyan-50 font-bold' : 'bg-brand-50 text-brand-700 font-bold')
        : (isDark ? 'text-cyan-50 hover:bg-[#0d4b4b]' : 'text-gray-700 hover:bg-gray-50')
    }`;

  const mobilePartnerClass = (isActive) =>
    `p-3 rounded-lg flex items-center transition-colors ${
      isDark
        ? (isActive ? 'bg-[#0f5c5c] text-cyan-50 font-bold' : 'text-cyan-50 hover:bg-[#0f5c5c]')
        : (isActive ? 'bg-white text-gray-800 font-bold' : 'hover:bg-white text-gray-800')
    }`;

  return (
    // FIX: z-[1100] ensures Navbar is above Map Button (800) but below AuthModal (1200)
    <header className={`fixed top-0 w-full z-[1100] transition-all duration-300 backdrop-blur-md border-b shadow-sm ${isDark ? 'bg-[#0b3b3b]/95 border-cyan-900/60' : 'bg-white/80 border-white/20'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">


{/* --- BRAND LOGO AREA --- */}
<Link to="/" className="flex items-center group">
  <div className="relative flex items-center justify-center w-12 h-12 mr-3">
    <div 
      className="absolute inset-0 border-[4px] rounded-full transition-all duration-500"  
      style={{ borderColor: '#0D9488' }}
    ></div>
    <img 
      src="/nav-needle.webp" 
      alt="SideQuest" 
      className="w-6 h-6 object-contain transition-transform duration-700 ease-in-out rotate-0 group-hover:rotate-[45deg]"
      />
  </div>

  {/* Brand Text: Original Slate color with colored "ues" */}
  <div className={`text-xl tracking-tight ${isDark ? 'font-normal text-cyan-50' : 'font-extrabold text-gray-800'}`}>
    SideQ
    <span style={isDark ? { color: '#006A4E', filter: 'brightness(1.3) saturate(1.12)' } : { color: '#006A4E' }}>u</span>
    <span style={isDark ? { color: '#800000', filter: 'brightness(1.35) saturate(1.1)' } : { color: '#800000' }}>e</span>
    <span style={isDark ? { color: '#F58220', filter: 'brightness(1.2) saturate(1.1)' } : { color: '#F58220' }}>s</span>
    t
  </div>
</Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link to="/" className={isActive('/')}>{t('quests')}</Link>
          <Link to="/map" className={isActive('/map')}>{t('map')}</Link>

          <Link to="/quiz" className={isActive('/quiz')}>{t('quiz')}</Link> 
          <Link to="/how-it-works" className={isActive('/how-it-works')}>{t('guide')}</Link>
          {currentUser && (
              <Link to="/my-quests" className={isActive('/my-quests')}>{t('myQuests')}</Link>
                )}
          <Link to="/rewards" className={isActive('/rewards')}>{t('rewards')}</Link>
          {currentUser && myBookings?.length > 0 && (
     <Link to="/my-journey" className={isActive('/my-journey')}>
     <span className="flex items-center gap-1 text-[#107870] font-bold">
       My Journey
     </span>
   </Link>
        )}
          {isHuntActive && currentUser?.hunt_access?.includes(activeEvent?.id) && (
           <Link to="/hunt" className={isActive('/hunt')}>
           <span className="flex items-center gap-1 text-teal-400">
             Colombo Hunt
           </span>
         </Link>
          )}
          
          {/* PARTNER DROPDOWN */}
            {(currentUser?.role === 'Partner' || currentUser?.role === 'Admin') && (
             <div className="relative" onMouseEnter={() => setIsPartnerMenuOpen(true)} onMouseLeave={() => setIsPartnerMenuOpen(false)}>
                <button className={`flex items-center gap-1 ${isActive('/partner')}`}>
               Partner <ChevronDown size={14} className={`transition-transform ${isPartnerMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPartnerMenuOpen && (
    <div className={`absolute top-full left-0 w-64 rounded-2xl shadow-xl border py-2 mt-1 animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-gray-100'}`}>
        {/* 1. Add New Quest */}
        <Link to="/partner?tab=create&mode=quest" className={`flex items-center px-4 py-3 text-sm font-bold transition-colors ${isDark ? 'text-cyan-50 hover:bg-[#0f5c5c] hover:text-cyan-50' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
            <PlusCircle size={18} className="mr-3 text-emerald-500" /> Add New Quest
        </Link>

        {/* 2. Add New Reward */}
        <Link to="/partner?tab=create&mode=reward" className={`flex items-center px-4 py-3 text-sm font-bold transition-colors ${isDark ? 'text-cyan-50 hover:bg-[#0f5c5c] hover:text-cyan-50' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}`}>
            <Gift size={18} className="mr-3 text-orange-500" /> Add New Reward
        </Link>

        <div className={`border-t my-1 ${isDark ? 'border-cyan-900/60' : 'border-gray-50'}`}></div>

        {/* 3. My Content */}
        <Link to="/partner?tab=manage" className={`flex items-center px-4 py-3 text-sm font-bold transition-colors ${isDark ? 'text-cyan-50 hover:bg-[#0f5c5c] hover:text-cyan-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <LayoutDashboard size={18} className="mr-3 text-blue-500" /> My Content (Quests/Rewards)
        </Link>

        {/* 4. Verify Code */}
        <Link to="/partner?tab=verify" className={`flex items-center px-4 py-3 text-sm font-bold transition-colors ${isDark ? 'text-cyan-50 hover:bg-[#0f5c5c] hover:text-cyan-50' : 'text-gray-700 hover:bg-brand-50 hover:text-brand-600'}`}>
            <CheckCircle size={18} className="mr-3 text-brand-500" /> Verify Traveler Code
        </Link>
        </div>
          )}
             </div>
                )}

          {currentUser?.role === 'Admin' && (
            <Link to="/admin" className={isActive('/admin')}>Admin</Link>
          )}

          {/* Emergency Link */}
          <Link to="/emergency" title="Emergency Info" className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors">
            <HeartPulse size={20} />
          </Link>

          <button
            onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            className="p-2 rounded-full text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-cyan-950/60 transition-colors"
          >
            <Lightbulb size={18} />
          </button>

          <div className="relative">
            <Globe size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-cyan-200/80' : 'text-gray-400'}`} />
            <select
              aria-label={t('language')}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`pl-7 pr-2 py-1.5 text-xs rounded-lg border ${isDark ? 'border-cyan-900/60 text-cyan-50 bg-[#0d4b4b]' : 'border-gray-200 text-gray-600 bg-white'}`}
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          {currentUser ? (
            <div className="flex items-center space-x-4 pl-2">
            <Link to="/profile" className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-xs text-gray-400 font-medium">{currentUser.role}</span>
              <span className={`text-sm font-bold ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>{currentUser.full_name || currentUser.email.split('@')[0]}</span>
            </Link>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-bold text-xs shadow-md">
              ⭐ {currentUser.xp} XP
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
              <LogOut size={20} />
            </button>
          </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Login
            </button>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className={`md:hidden p-2 ${isDark ? 'text-cyan-50' : 'text-gray-700'}`}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile  */}
      {isOpen && (
  <div className={`md:hidden border-t shadow-xl animate-in slide-in-from-top-5 max-h-[85vh] overflow-y-auto ${isDark ? 'bg-[#0b3b3b] border-cyan-900/60' : 'bg-white'}`}>
    <div className="p-4 flex flex-col space-y-2"> 
        
        {currentUser ? (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between p-3 rounded-lg border-b mb-2 ${
                isDark ? 'bg-[#0f5c5c] border-cyan-900/50' : 'bg-gray-50'
              }`}
            >
                <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-cyan-200/80' : 'text-gray-400'}`}>{currentUser.role}</span>
                    <p className={`text-sm font-bold ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>{currentUser.full_name || currentUser.email.split('@')[0]}</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-bold text-xs shadow-md">
                    ⭐ {currentUser.xp} XP
                </div>
            </Link>
        ) : (
            <button onClick={() => { setShowAuthModal(true); setIsOpen(false); }} className="w-full bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all mb-2">
                Login
            </button>
        )}
            
            <Link to="/" className={mobileNavClass('/')} onClick={() => setIsOpen(false)}>{t('quests')}</Link>
            <Link to="/map" className={mobileNavClass('/map')} onClick={() => setIsOpen(false)}>{t('map')}</Link>
            <Link to="/quiz" className={mobileNavClass('/quiz')} onClick={() => setIsOpen(false)}>
               {t('quiz')}
            </Link>
            <Link to="/how-it-works" className={mobileNavClass('/how-it-works')} onClick={() => setIsOpen(false)}>{t('guide')}</Link>
            {currentUser && (
              <Link to="/my-quests" className={mobileNavClass('/my-quests')} onClick={() => setIsOpen(false)}>{t('myQuests')}</Link>
                )}
            <Link to="/rewards" className={mobileNavClass('/rewards')} onClick={() => setIsOpen(false)}>{t('rewards')}</Link>
            {currentUser && myBookings?.length > 0 && (
      <Link 
    to="/my-journey" 
    className="p-3 rounded-lg bg-[#107870]/5 text-[#107870] font-black flex items-center border border-[#107870]/10" 
    onClick={() => setIsOpen(false)}
      >
    <Globe size={18} className="mr-2" /> My Active Journey
      </Link>
          )}
            {isHuntActive && currentUser?.hunt_access?.includes(activeEvent?.id) && (
    <Link to="/hunt" className="p-3 rounded-lg hover:bg-teal-50 text-teal-600 font-bold flex items-center" onClick={() => setIsOpen(false)}>
      <Trophy size={18} className="mr-2" /> Colombo Hunt
    </Link>
  )}
            <Link to="/emergency" className="p-3 rounded-lg hover:bg-red-50 text-red-500 font-bold flex items-center" onClick={() => setIsOpen(false)}>
                <HeartPulse size={18} className="mr-2"/> Emergency & Safety Info
            </Link>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
                className={`p-3 rounded-lg border border-gray-200 text-sm ${isDark ? 'border-cyan-900/60 text-cyan-50' : ''}`}
              >
                {theme === 'dark' ? t('lightMode') : t('darkMode')}
              </button>
              <select
                aria-label={t('language')}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`p-3 rounded-lg border border-gray-200 text-sm ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60 text-cyan-50' : ''}`}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* MOBILE PARTNER SECTION */}
{(currentUser?.role === 'Partner' || currentUser?.role === 'Admin') && (
    <div className={`rounded-xl p-1 border mt-2 ${isDark ? 'bg-[#0f5c5c] border-cyan-800/70 shadow-inner shadow-black/20' : 'bg-brand-50/50 border-brand-100'}`}>
        <p className={`text-[10px] font-black uppercase tracking-widest px-3 pt-2 mb-1 ${isDark ? 'text-cyan-100' : 'text-brand-400'}`}>Partner Toolkit</p>
        
        <Link
          to="/partner?tab=create&mode=quest"
          className={mobilePartnerClass(location.pathname === '/partner' && location.search.includes('tab=create') && location.search.includes('mode=quest'))}
          onClick={() => setIsOpen(false)}
        >
            <PlusCircle size={18} className="mr-3 text-emerald-500"/> Add New Quest
        </Link>
        
        <Link
          to="/partner?tab=create&mode=reward"
          className={mobilePartnerClass(location.pathname === '/partner' && location.search.includes('tab=create') && location.search.includes('mode=reward'))}
          onClick={() => setIsOpen(false)}
        >
            <Gift size={18} className="mr-3 text-orange-500"/> Add New Reward
        </Link>
        
        <Link
          to="/partner?tab=manage"
          className={mobilePartnerClass(location.pathname === '/partner' && location.search.includes('tab=manage'))}
          onClick={() => setIsOpen(false)}
        >
            <LayoutDashboard size={18} className="mr-3 text-blue-500"/> My Content
        </Link>

        <Link
          to="/partner?tab=verify"
          className={mobilePartnerClass(location.pathname === '/partner' && location.search.includes('tab=verify'))}
          onClick={() => setIsOpen(false)}
        >
            <CheckCircle size={18} className="mr-3 text-brand-500"/> Verify Traveler Code
        </Link>
    </div>
)}

      {currentUser?.role === 'Admin' && (
       <Link
         to="/admin"
         className={`p-3 rounded-lg transition-colors ${isDark ? 'text-cyan-100 hover:bg-[#0f5c5c] font-semibold' : 'hover:bg-gray-50 text-gray-800'}`}
         onClick={() => setIsOpen(false)}
       >
         Admin Panel
       </Link>
        )}
            
            {currentUser && (
                <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-red-500 font-bold p-3 rounded-lg hover:bg-red-50 transition-colors mt-2 border-t pt-3">
                    Logout
                </button>
            )}
        </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;