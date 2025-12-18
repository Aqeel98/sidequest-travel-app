import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Compass, HeartPulse } from 'lucide-react'; 
import { useSideQuest } from '../context/SideQuestContext';

const Navbar = () => {
  const { currentUser, logout, setShowAuthModal } = useSideQuest();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => 
    location.pathname === path 
      ? "text-brand-600 font-bold bg-brand-50 rounded-full px-4 py-1.5" 
      : "text-gray-500 hover:text-brand-500 font-medium px-4 py-1.5 transition-all";

  return (
    // Glassmorphism effect
    <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
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
          <Link to="/my-quests" className={isActive('/my-quests')}>My Quests</Link>
          <Link to="/rewards" className={isActive('/rewards')}>Rewards</Link>
          
          {currentUser?.role === 'Partner' && (
            <Link to="/partner" className={isActive('/partner')}>Partner</Link>
          )}

          {currentUser?.role === 'Admin' && (
            <Link to="/admin" className={isActive('/admin')}>Admin</Link>
          )}

          {/* Emergency Link with Red Color Scheme */}
          <Link to="/emergency" title="Emergency Info" className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors">
            <HeartPulse size={20} />
          </Link>
          
          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          {currentUser ? (
            <div className="flex items-center space-x-4 pl-2">
            {/* Wrap the user info in a Link */}
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

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t p-4 flex flex-col space-y-2 shadow-xl animate-in slide-in-from-top-5">
            
            {/* New: USER INFO AT TOP OF MOBILE MENU */}
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
                // Mobile Login Button
                <button onClick={() => { setShowAuthModal(true); setIsOpen(false); }} className="w-full bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all mb-2">
                    Login
                </button>
            )}
            
            {/* Navigation Links */}
            <Link to="/" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Quests</Link>
            <Link to="/map" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Map</Link>
            <Link to="/my-quests" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>My Quests</Link>
            <Link to="/rewards" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Rewards</Link>
            
            {/* Mobile Emergency Link */}
            <Link to="/emergency" className="p-3 rounded-lg hover:bg-red-50 text-red-500 font-bold flex items-center" onClick={() => setIsOpen(false)}>
                <HeartPulse size={18} className="mr-2"/> Emergency & Safety Info
            </Link>

            {currentUser?.role === 'Partner' && (
                <Link to="/partner" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Partner Dashboard</Link>
            )}
            {currentUser?.role === 'Admin' && (
                <Link to="/admin" className="p-3 rounded-lg hover:bg-gray-50" onClick={() => setIsOpen(false)}>Admin Panel</Link>
            )}
            
            {/* Mobile Logout Button (at the bottom) */}
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