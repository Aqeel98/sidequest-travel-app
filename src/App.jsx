import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { SideQuestProvider, useSideQuest } from './context/SideQuestContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import QuestDetails from './pages/QuestDetails';
import MyQuests from './pages/MyQuests';
import Admin from './pages/Admin';
import MapPage from './pages/MapPage';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import PartnerDashboard from './pages/PartnerDashboard'; 
import Emergency from './pages/Emergency';

// --- DEMO BUTTON (Kept for testing) ---
const RoleSwitcher = () => {
  const { currentUser, switchRole } = useSideQuest();
  if (!currentUser) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow-xl text-xs z-50 border opacity-80 hover:opacity-100">
      <div className="font-bold mb-1">Demo Role: {currentUser.role}</div>
      <button onClick={() => switchRole('Traveler')} className={`block text-left px-3 py-1 rounded w-full transition ${currentUser.role === 'Traveler' ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}>Traveler</button>
      <button onClick={() => switchRole('Admin')} className={`block text-left px-3 py-1 rounded w-full transition ${currentUser.role === 'Admin' ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}>Admin</button>
      <button onClick={() => switchRole('Partner')} className={`block text-left px-3 py-1 rounded w-full transition ${currentUser.role === 'Partner' ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}>Partner</button>
    </div>
  );
};

const Layout = () => (
  <div className="min-h-screen bg-gray-50 pt-20 font-sans text-gray-900">
    <Navbar />
    <AuthModal />
    <Outlet />
    <RoleSwitcher /> {/* Button is active */}
  </div>
);

export default function App() {
  return (
    <SideQuestProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="map" element={<MapPage />} />
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