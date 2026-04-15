
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Sparkles, Car, Map, ArrowRight, Check, 
  Zap, X, Shield, Clock, Loader2
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const TravelAgency = () => {
  const navigate = useNavigate();
  const { 
    travelPackages, 
    travelSettings, 
    showToast, 
    isLoading, 
    initiateTravelBooking, 
    initiateCustomBooking, 
    currentUser,
    setShowAuthModal 
  } = useSideQuest();

  const [driverDays, setDriverDays] = useState(1);
  const [activeTab, setActiveTab] = useState('packs'); 
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [tier, setTier] = useState('driver');


  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    
    if (params.get('cancel') === 'true') {
        const saved = localStorage.getItem('sq_pending_trip');
        if (saved) {
            const { trip, tier: savedTier } = JSON.parse(saved);
            setSelectedTrip(trip); // Re-opens the modal
            setTier(savedTier);    // Re-selects their chosen tier
            showToast("Booking paused. Your selection is saved!", "info");
            localStorage.removeItem('sq_pending_trip'); // Clear memory
        }
    }
  }, []);

  // --- LOGIC: AI MATCHER ---
  const handleAiMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
        const match = travelPackages.find(pkg => 
            pkg.vibe_tags.includes(selectedVibe.replace('#', ''))
        );
        if (match) {
            setSelectedTrip(match);
        } else {
            showToast("No exact match for this vibe yet. Try another!", "info");
        }
        setIsMatching(false);
    }, 1500);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#E6D5B8]"><Loader2 className="animate-spin text-[#107870]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#E6D5B8] pb-24 font-sans">
      <SEO title="Travel Agency | SideQuest Sri Lanka" />

      {/* --- HEADER --- */}
      <div className="bg-[#107870] text-white pt-24 pb-16 px-6 rounded-b-[3.5rem] shadow-xl text-center">
        <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tighter">Travel Agency</h1>
        <p className="text-teal-50/80 font-medium max-w-xl mx-auto italic">Curated Sri Lankan journeys. Verified drivers. Boutique stays.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        
        {/* --- NAVIGATION --- */}
        <div className="flex overflow-x-auto gap-3 mb-12 pb-2 scrollbar-hide justify-center">
          {[
            { id: 'packs', label: 'Best Sellers' },
            { id: 'ai', label: 'AI Planner' },
            { id: 'custom', label: 'Custom Loop' },
            { id: 'driver', label: 'Hire Driver' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
                activeTab === tab.id 
                ? 'bg-white text-[#107870] scale-105' 
                : 'bg-[#0a4d47] text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* TAB 1: QUICK PACKS */}
          {activeTab === 'packs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {travelPackages.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-[#107870]/20 text-[#107870] font-bold italic">
                      No packages live yet.
                  </div>
              ) : (
                travelPackages.map((pack) => (
                  <div key={pack.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white flex flex-col h-full">
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                      <img src={pack.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={pack.title} />
                      <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-white border border-white/20">
                        {pack.duration_days} Days
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{pack.title}</h3>
                      <p className="text-[#107870] text-[10px] font-black uppercase tracking-[0.2em] mb-6">Vibe: {pack.vibe_tags[0]}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="text-3xl font-black text-gray-900">${Math.round(pack.price_usd)}</p>
                        <button onClick={() => setSelectedTrip(pack)} className="bg-[#107870] text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 shadow-lg transition-all active:scale-95">
                          Details <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: AI PLANNER */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl text-center max-w-2xl mx-auto border border-white">
               <div className="w-20 h-20 bg-[#107870]/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[#107870]">
                  {isMatching ? <Loader2 className="animate-spin" size={40}/> : <Sparkles size={40} />}
               </div>
               <h2 className="text-3xl font-black text-gray-900 mb-2">AI Trip Matcher</h2>
               <p className="text-gray-400 font-medium mb-10 italic">We'll find the perfect pre-vetted route for your vibe.</p>
               <div className="grid grid-cols-2 gap-4 mb-10">
                  {['#Surf', '#Zen', '#Extreme', '#Culture'].map(v => (
                    <button key={v} onClick={() => setSelectedVibe(v)} className={`py-5 rounded-3xl font-black transition-all border-2 ${selectedVibe === v ? 'border-[#107870] bg-[#107870]/5 text-[#107870]' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>{v}</button>
                  ))}
               </div>
               <button onClick={handleAiMatch} disabled={!selectedVibe || isMatching} className="w-full bg-[#107870] text-white py-5 rounded-full font-black text-xl shadow-xl shadow-[#107870]/20 active:scale-95 transition-all disabled:opacity-30">
                  {isMatching ? 'Analyzing Routes...' : 'Match My Trip ⚡'}
               </button>
            </div>
          )}

          {/* TAB 3: CUSTOM LOOP */}
          {activeTab === 'custom' && (
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-3xl mx-auto border border-white">
               <h2 className="text-2xl font-black text-[#107870] uppercase tracking-widest mb-8 text-center">Custom Itinerary Builder</h2>
               
               {/* FIXED: Restored district selection logic */}
               <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {['Colombo', 'Galle', 'Ella', 'Kandy', 'Sigiriya', 'A-Bay', 'Jaffna', 'Mirissa'].map(d => (
                    <button 
                      key={d}
                      onClick={() => setSelectedDistricts(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])}
                      className={`px-8 py-3 rounded-full font-bold transition-all border-2 ${selectedDistricts.includes(d) ? 'bg-[#107870] border-[#107870] text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                    >
                      {d}
                    </button>
                  ))}
               </div>

               <div className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pricing Estimation</p>
                    <p className="text-2xl font-black text-gray-800">
                        {selectedDistricts.length * 2} Days Loop · 
                        <span className="text-[#107870] ml-2">${selectedDistricts.length * 2 * (travelSettings?.driver_day_rate_usd || 70)}</span>
                    </p>
                  </div>
                  
                  {/* FIXED: Booking logic moved to this main button */}
                  <button 
  disabled={selectedDistricts.length === 0} 
  onClick={async () => {
    // GUARD: Prevents guest checkout
    if (!currentUser) {
        showToast("Please login to book this route", "info");
        setShowAuthModal(true);
        return;
    }

    const price = selectedDistricts.length * 2 * (travelSettings?.driver_day_rate_usd || 70);
    const booking = await initiateCustomBooking('custom_loop', selectedDistricts.length * 2, price);
    
    if (booking) {
        showToast("Redirecting to Stripe...", "info");
        const { data } = await supabase.functions.invoke('create-checkout-session', {
            body: { 
                bookingId: booking.id,
                packageName: `Custom Loop (${selectedDistricts.length} Stops)`,
                price: price,
                customerEmail: currentUser.email
            }
        });
        if (data?.url) window.location.href = data.url;
    }
  }}
  className="bg-[#107870] text-white px-12 py-4 rounded-2xl font-black shadow-lg disabled:opacity-30 active:scale-95 transition-all"
>
  {currentUser ? 'Book This Route' : 'Login to Book'}
</button>
               </div>
            </div>
          )}

          {/* TAB 4: SOLO DRIVER */}
          {activeTab === 'driver' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-[#107870]/10 text-[#107870] px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-6"><Shield size={14} /> SideQuest Partner</div>
                  <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight">Solo Driver Booking</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed font-medium text-lg">Secure a professional SideQuest driver. Includes fuel, insurance, and local knowledge.</p>
                  
                  <div className="mb-10 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">How many days do you need?</p>
                      <div className="flex items-center gap-6">
                          <button onClick={() => setDriverDays(Math.max(1, driverDays - 1))} className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center font-black text-2xl">-</button>
                          <span className="text-3xl font-black text-gray-900">{driverDays} Days</span>
                          <button onClick={() => setDriverDays(driverDays + 1)} className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center font-black text-2xl">+</button>
                      </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-4xl font-black text-gray-900">${driverDays * (travelSettings?.driver_day_rate_usd || 70)}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase">Total for {driverDays} Days</p>
                    </div>
                    <button 
  onClick={async () => {
    // GUARD: Prevents guest checkout
    if (!currentUser) {
        showToast("Please login to hire a driver", "info");
        setShowAuthModal(true);
        return;
    }

    const price = driverDays * (travelSettings?.driver_day_rate_usd || 70);
    const booking = await initiateCustomBooking('solo_driver', driverDays, price);
    if (booking) {
        showToast("Connecting...", "info");
        const { data } = await supabase.functions.invoke('create-checkout-session', {
            body: { 
                bookingId: booking.id,
                packageName: `Solo Driver Hire (${driverDays} Days)`,
                price: price,
                customerEmail: currentUser.email
            }
        });
        if (data?.url) window.location.href = data.url;
    }
  }}
  className="flex-1 max-w-xs bg-[#107870] text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-[#107870]/20 active:scale-95 transition-all"
>
  {currentUser ? 'Hire Now' : 'Login to Hire'}
</button>
                  </div>
               </div>
               <div className="w-full md:w-96 h-96 bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d" className="w-full h-full object-cover grayscale" alt="Driver" />
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- PACKAGE OVERLAY --- */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 relative shadow-2xl border border-white/20">
              <button onClick={() => setSelectedTrip(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"><X size={32}/></button>
              <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">{selectedTrip.title}</h2>
              <p className="text-xs font-black uppercase text-[#107870] mb-8 tracking-widest">{selectedTrip.duration_days} Day Journey</p>
              
              <div className="space-y-4 mb-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
               {[
                 { id: 'driver', label: 'Driver Only', icon: Car, price: selectedTrip.price_usd },
                 { id: 'essential', label: 'Essential Pack', icon: Zap, price: selectedTrip.price_essential_usd },
                 { id: 'full', label: 'Full All-Inclusive', icon: Sparkles, price: selectedTrip.price_full_usd },
               ].map((item) => (
                 <button 
                   key={item.id} 
                   onClick={() => setTier(item.id)} 
                   className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all group flex justify-between items-center shadow-sm ${
                     tier === item.id 
                     ? 'border-[#107870] bg-[#107870]/5' 
                     : 'border-gray-100 bg-gray-50/50 hover:bg-white'
                   }`}
                 >
                    <div className="flex items-center gap-4">
                      <item.icon size={24} className={tier === item.id ? 'text-[#107870]' : 'text-gray-400'}/>
                      <span className={`font-bold text-lg ${tier === item.id ? 'text-[#107870]' : 'text-gray-800'}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                        <span className={`font-black text-xl block ${tier === item.id ? 'text-[#107870]' : 'text-gray-900'}`}>
                            ${Math.round(item.price)}
                        </span>
                    </div>
                 </button>
               ))}
            </div>

            <div className="mb-10 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-sm italic text-gray-600">
                {selectedTrip.itinerary_json?.text || "Itinerary available post-booking."}
            </div>

            <button 
                onClick={async () => {
              if (!currentUser) {
        showToast("Please login to secure your booking", "info");
        setShowAuthModal(true);
        return;
    }

    // 1. SAVE PROGRESS: Store the selection in local memory in case they click "Back" on Stripe
            localStorage.setItem('sq_pending_trip', JSON.stringify({ trip: selectedTrip, tier: tier }));

        const today = new Date().toISOString().split('T')[0];
        const booking = await initiateTravelBooking(selectedTrip, tier, today);
    
        if (booking) {
        showToast("Connecting to Stripe...", "info");
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { 
                bookingId: booking.id,
                packageName: selectedTrip.title,
                price: booking.total_price_usd,
                customerEmail: currentUser.email
            }
           });
          // 2. The user leaves the app here...
            if (data?.url) window.location.href = data.url; 
           }
         }}
         className="w-full bg-[#107870] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-[#107870]/20 active:scale-95 transition-all"
        >
       {currentUser ? 'Confirm & Pay' : 'Login to Book'}
      </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default TravelAgency;