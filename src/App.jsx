import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { SideQuestProvider, useSideQuest } from './context/SideQuestContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import { Compass, CheckCircle, AlertCircle, Info } from 'lucide-react'; 

// Pages
import Home from './pages/Home';
import QuestDetails from './pages/QuestDetails';
import MyQuests from './pages/MyQuests';
import Admin from './pages/Admin';
import MapPage from './pages/MapPage';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import PartnerDashboard from './pages/PartnerDashboard'; 
import Emergency from './pages/Emergency';
import HowItWorks from './pages/HowItWorks'; 


// --- ROLE SWITCHER (Debug Tool) ---
const RoleSwitcher = () => {
  const { currentUser, switchRole } = useSideQuest();
  const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return null;

  return (
    // FIX: z-[3000] ensures this is ALWAYS clickable, even over modals
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl z-[3000] border border-brand-100 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
        <span className="font-bold text-[10px] text-gray-500 uppercase tracking-widest">Debug Mode</span>
      </div>
      
      <div className="space-y-1">
        {['Traveler', 'Partner', 'Admin'].map((role) => (
          <button 
            key={role}
            onClick={() => switchRole(role)} 
            className={`block text-left px-3 py-1.5 rounded-lg w-full text-xs transition-all ${
              currentUser.role === role 
                ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-200' 
                : 'hover:bg-gray-100 text-gray-600 font-medium'
            }`}
          >
            Switch to {role}
          </button>
        ))}
      </div>
      
      <p className="text-[9px] text-gray-400 mt-2 text-center italic">Admin: {ADMIN_EMAIL}</p>
    </div>
  );
};

// --- LOADING SCREEN ---
const LoadingScreen = () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-50 text-brand-600">
        <Compass size={48} className="animate-spin mb-4" />
        <h2 className="text-xl font-bold animate-pulse">Loading SideQuest...</h2>
    </div>
);

// --- TOAST NOTIFICATION RENDERER ---
const Toast = () => {
  const { toast } = useSideQuest(); 
  
  if (!toast) return null; 

  const styles = {
      success: 'bg-emerald-900/90 border-emerald-500/50 text-white',
      error: 'bg-red-900/90 border-red-500/50 text-white',
      info: 'bg-slate-900/90 border-slate-500/50 text-white'
  };

  const icons = {
      success: <CheckCircle size={20} className="text-emerald-400" />,
      error: <AlertCircle size={20} className="text-red-400" />,
      info: <Info size={20} className="text-blue-400" />
  };

  return (
      // FIX: z-[2000] ensures notifications float above everything (including Login Modal)
      <div className="fixed top-24 right-4 z-[2000] animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border ${styles[toast.type] || styles.info}`}>
              {icons[toast.type]}
              <div className="font-bold text-sm tracking-wide shadow-sm">
                  {toast.message}
              </div>
          </div>
      </div>
  );
};

// --- MAIN LAYOUT WRAPPER ---
const MainLayout = () => {
    const { isLoading } = useSideQuest();

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 font-sans text-gray-900">
            <Navbar />
            <Toast />
            <AuthModal />
            <Outlet />
            <RoleSwitcher />
        </div>
    );
};

export default function App() {
  return (
    <SideQuestProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="map" element={<MapPage />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="quest/:id" element={<QuestDetails />} />
            <Route path="my-quests" element={<MyQuests />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="profile" element={<Profile />} />
            <Route path="partner" element={<PartnerDashboard />} />
            <Route path="admin" element={<Admin />} />
            <Route path="emergency" element={<Emergency />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </SideQuestProvider>
  );
}