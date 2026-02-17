{/* if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.info = () => {};
   console.error //stays active so you can see if the system actually breaks
    } */}


import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { SideQuestProvider, useSideQuest } from './context/SideQuestContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import { Compass, CheckCircle, AlertCircle, Info } from 'lucide-react'; 
import { Analytics } from "@vercel/analytics/react";

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
import InstallBanner from './components/InstallBanner';
import Quiz from './pages/Quiz';

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
            <InstallBanner />
            <Toast />
            <AuthModal />
            <Outlet />
            
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
            <Route path="quiz" element={<Quiz />} />

          </Route>
        </Routes>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </SideQuestProvider>
  );
}