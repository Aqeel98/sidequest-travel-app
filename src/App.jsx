import React, { useEffect } from 'react'; // Added useEffect here
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { HelmetProvider } from 'react-helmet-async';
import { SideQuestProvider, useSideQuest } from './context/SideQuestContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import { Compass, CheckCircle, AlertCircle, Info } from 'lucide-react'; 
import { Analytics } from "@vercel/analytics/react";

let isBootAssetsPreloaded = false;
const STALE_SW_HEAL_FLAG = 'sq_sw_self_heal_attempted';

const recoverFromStaleServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (error) {
    // Silent fail: next reload still attempts network-first fetches.
  } finally {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('sq_force_refresh', Date.now().toString());
    window.location.replace(nextUrl.toString());
  }
};

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
import UpdatePrompt from './components/UpdatePrompt';
import Quiz from './pages/Quiz';
//import HuntDashboard from './pages/HuntDashboard';
//import HuntStop from './pages/HuntStop';
//import Leaderboard from './pages/Leaderboard';
//import TravelAgency from './pages/TravelAgency';
//import MyJourney from './pages/MyJourney';

// --- 1. CONSOLE SHIELD ENGINE ---
const originalConsole = { ...console };
//const ADMIN_EMAIL = 'sidequestsrilanka@gmail.com';

if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.info = () => {};
  // console.error stays active
}

// --- LOADING SCREEN ---
const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-50 text-brand-600">
      <div className="relative flex items-center justify-center mb-4">
          
          <div className="absolute w-12 h-12 border-4 border-current rounded-full"></div>

          <img 
              src="/nav-needle.webp" 
              alt="Loading" 
               className="w-6 h-6 animate-spin object-contain relative z-10"
          />
      </div>

   {/* --- LOADING SCREEN TEXT --- */}
<h2 className="text-xl font-bold animate-pulse text-brand-600">
  Loading SideQ
  <span style={{ color: '#006A4E' }}>u</span>
  <span style={{ color: '#800000' }}>e</span>
  <span style={{ color: '#F58220' }}>s</span>
  t...
</h2>
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
  const { isLoading, currentUser } = useSideQuest();

  useEffect(() => {
      if (import.meta.env.PROD) {
        const isAdmin = currentUser?.role === 'Admin';
        
        if (isAdmin) {
              console.log = originalConsole.log;
              console.debug = originalConsole.debug;
              console.warn = originalConsole.warn;
              console.info = originalConsole.info;
          } else {
              console.log = () => {};
              console.debug = () => {};
              console.warn = () => {};
              console.info = () => {};
          }
      }
  }, [currentUser]);

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.removeItem(STALE_SW_HEAL_FLAG);
      return;
    }

    const hasAttemptedRecovery = sessionStorage.getItem(STALE_SW_HEAL_FLAG) === '1';
    if (hasAttemptedRecovery) return;

    const timeoutId = window.setTimeout(() => {
      sessionStorage.setItem(STALE_SW_HEAL_FLAG, '1');
      recoverFromStaleServiceWorker();
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  if (isLoading) return <LoadingScreen />;

  return (
      <div className="min-h-screen bg-gray-50 pt-20 font-sans text-gray-900">
          <Navbar />
          <InstallBanner />
          <UpdatePrompt />
          <Toast />
          <AuthModal />
          <Outlet />
      </div>
  );
};

export default function App() {
  useEffect(() => {
    if (isBootAssetsPreloaded) return;
    isBootAssetsPreloaded = true;

    const needle = new Image();
    needle.decoding = 'async';
    needle.src = '/nav-needle.webp';
  }, []);

  return (
    <HelmetProvider>
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
            {/* <Route path="hunt" element={<HuntDashboard />} /> */}
{/* <Route path="hunt/:stopId" element={<HuntStop />} /> */}
{/* <Route path="leaderboard" element={<Leaderboard />} /> */}
{/* <Route path="plan-trip" element={<TravelAgency />} /> */}
{/* <Route path="my-journey" element={<MyJourney />} /> */}
            </Route>
          </Routes>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </SideQuestProvider>
    </HelmetProvider>
  );
}