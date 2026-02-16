import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Compass, HeartPulse, ChevronDown, PlusCircle, LayoutDashboard, CheckCircle, Zap, Gift  } from 'lucide-react'; 
import { useSideQuest } from '../context/SideQuestContext';

const Navbar = () => {
  const { currentUser, logout, setShowAuthModal } = useSideQuest();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isPartnerMenuOpen, setIsPartnerMenuOpen] = useState(false);


  const isActive = (path) => 
    location.pathname === path 
      ? "text-brand-600 font-bold bg-brand-50 rounded-full px-4 py-1.5" 
      : "text-gray-500 hover:text-brand-500 font-medium px-4 py-1.5 transition-all";

  return (
    // FIX: z-[1100] ensures Navbar is above Map Button (800) but below AuthModal (1200)
    <header className="fixed top-0 w-full z-[1100] transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
        
        {/* Logo Area */}
        <Link to="/" className="flex items-center group">
          <div className="bg-gradient-to-tr from-brand-400 to-brand-600 p-2 rounded-xl text-white mr-3 shadow-lg group-hover:shadow-brand-200 transition-all">
            <Compass size={24} className="group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-gray-800 tracking-tight">SideQuest</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link to="/" className={isActive('/')}>Quests</Link>
          <Link to="/map" className={isActive('/map')}>Map</Link>
          <Link to="/quiz" className={isActive('/quiz')}>Quiz</Link> 
          <Link to="/how-it-works" className={isActive('/how-it-works')}>Guide</Link>
          {currentUser && (
              <Link to="/my-quests" className={isActive('/my-quests')}>My Quests</Link>
                )}
          <Link to="/rewards" className={isActive('/rewards')}>Rewards</Link>
          
          {/* PARTNER DROPDOWN */}
            {(currentUser?.role === 'Partner' || currentUser?.role === 'Admin') && (
             <div className="relative" onMouseEnter={() => setIsPartnerMenuOpen(true)} onMouseLeave={() => setIsPartnerMenuOpen(false)}>
                <button className={`flex items-center gap-1 ${isActive('/partner')}`}>
               Partner <ChevronDown size={14} className={`transition-transform ${isPartnerMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPartnerMenuOpen && (
    <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 mt-1 animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Add New Quest */}
        <Link to="/partner?tab=create&mode=quest" className="flex items-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
            <PlusCircle size={18} className="mr-3 text-emerald-500" /> Add New Quest
        </Link>

        {/* 2. Add New Reward */}
        <Link to="/partner?tab=create&mode=reward" className="flex items-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            <Gift size={18} className="mr-3 text-orange-500" /> Add New Reward
        </Link>

        <div className="border-t border-gray-50 my-1"></div>

        {/* 3. My Content */}
        <Link to="/partner?tab=manage" className="flex items-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <LayoutDashboard size={18} className="mr-3 text-blue-500" /> My Content (Quests/Rewards)
        </Link>

        {/* 4. Verify Code */}
        <Link to="/partner?tab=verify" className="flex items-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors">
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
          
          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          {currentUser ? (
            <div className="flex items-center space-x-4 pl-2">
            <Link to="/profile" className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-xs text-gray-400 font-medium">{currentUser.role}</span>
              <span className="text-sm font-bold text-gray-800">{currentUser.full_name || currentUser.email.split('@')[0]}</span>
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
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-700 p-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile  */}
      {isOpen && (
        <div className="md:hidden bg-white border-t p-4 flex flex-col space-y-2 shadow-xl animate-in slide-in-from-top-5">
            {currentUser ? (
                <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-b mb-2">
                    <div>
                        <span className="text-xs text-gray-400 font-medium">{currentUser.role}</span>
                        <p className="text-sm font-bold text-gray-800">{currentUser.full_name || currentUser.email.split('@')[0]}</p>
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
            
            <Link to="/" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Quests</Link>
            <Link to="/map" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Map</Link>
            <Link to="/quiz" className="p-3 rounded-lg hover:bg-brand-50 text-brand-600 font-bold flex items-center" onClick={() => setIsOpen(false)}>
               <Zap size={18} className="mr-2" fill="currentColor"/> Quiz Game
            </Link>
            <Link to="/how-it-works" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>How it Works</Link>
            {currentUser && (
              <Link to="/my-quests" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>My Quests</Link>
                )}
            <Link to="/rewards" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Rewards</Link>
            
            <Link to="/emergency" className="p-3 rounded-lg hover:bg-red-50 text-red-500 font-bold flex items-center" onClick={() => setIsOpen(false)}>
                <HeartPulse size={18} className="mr-2"/> Emergency & Safety Info
            </Link>

            {/* MOBILE PARTNER SECTION */}
{(currentUser?.role === 'Partner' || currentUser?.role === 'Admin') && (
    <div className="bg-brand-50/50 rounded-xl p-1 border border-brand-100 mt-2">
        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest px-3 pt-2 mb-1">Partner Toolkit</p>
        
        <Link to="/partner?tab=create&mode=quest" className="p-3 rounded-lg hover:bg-white flex items-center" onClick={() => setIsOpen(false)}>
            <PlusCircle size={18} className="mr-3 text-emerald-500"/> Add New Quest
        </Link>
        
        <Link to="/partner?tab=create&mode=reward" className="p-3 rounded-lg hover:bg-white flex items-center" onClick={() => setIsOpen(false)}>
            <Gift size={18} className="mr-3 text-orange-500"/> Add New Reward
        </Link>
        
        <Link to="/partner?tab=manage" className="p-3 rounded-lg hover:bg-white flex items-center" onClick={() => setIsOpen(false)}>
            <LayoutDashboard size={18} className="mr-3 text-blue-500"/> My Content
        </Link>

        <Link to="/partner?tab=verify" className="p-3 rounded-lg hover:bg-white flex items-center font-bold text-brand-600" onClick={() => setIsOpen(false)}>
            <CheckCircle size={18} className="mr-3"/> Verify Traveler Code
        </Link>
    </div>
)}

      {currentUser?.role === 'Admin' && (
       <Link to="/admin" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Admin Panel</Link>
        )}
            
            {currentUser && (
                <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-red-500 font-bold p-3 rounded-lg hover:bg-red-50 transition-colors mt-2 border-t pt-3">
                    Logout
                </button>
            )}
        </div>
      )}
    </header>
  );
};
export default Navbar;