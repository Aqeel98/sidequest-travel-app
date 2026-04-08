import React, { useMemo } from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import { 
  MapPin, Phone, Calendar, ArrowLeft, MessageCircle, 
  Navigation, CheckCircle2, Globe, Shield, Loader2, Sparkles, Car
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const MyJourney = () => {
    const { myBookings, isLoading, currentUser } = useSideQuest();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Check if we just arrived from a successful Stripe payment
    const isVerifying = searchParams.get('session_id');

    // Logic: Find the most recent active/paid booking
    const activeBooking = useMemo(() => {
        if (!myBookings || myBookings.length === 0) return null;
        // Sort to get the latest one first
        return [...myBookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    }, [myBookings]);

    // UI Helper: Get the display title based on the booking type
    const getTripTitle = () => {
        if (activeBooking?.travel_packages?.title) return activeBooking.travel_packages.title;
        if (activeBooking?.tier_selected === 'solo_driver') return "Solo Driver Hire";
        if (activeBooking?.tier_selected === 'custom_loop') return "Custom Itinerary Loop";
        return "Your SideQuest Journey";
    };

    // UI Helper: Convert itinerary text into an array for the timeline
    const itinerarySteps = useMemo(() => {
        const rawText = activeBooking?.travel_packages?.itinerary_json?.text || activeBooking?.travel_packages?.itinerary_json || "";
        if (!rawText) return ["Your personalized schedule is being prepared by our team."];
        
        // Split by "Day" if it exists, otherwise split by new lines
        if (rawText.includes('Day')) {
            return rawText.split(/Day \d+:/).filter(step => step.trim().length > 0);
        }
        return rawText.split('\n').filter(step => step.trim().length > 0);
    }, [activeBooking]);

    if (isLoading || (isVerifying && !activeBooking)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#E6D5B8] gap-4">
                <Loader2 className="animate-spin text-[#107870]" size={48} />
                <h2 className="font-black text-[#107870] text-xl uppercase tracking-widest">Verifying Your Journey...</h2>
            </div>
        );
    }

    if (!activeBooking) {
        return (
            <div className="min-h-screen bg-[#E6D5B8] p-8 flex flex-col items-center justify-center text-center">
                <Globe size={64} className="text-[#107870]/20 mb-6" />
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">No Active Journey</h2>
                <p className="text-gray-500 mb-8 max-w-xs font-medium">You haven't booked a SideQuest package yet. Start your adventure today!</p>
                <button onClick={() => navigate('/plan-trip')} className="bg-[#107870] text-white px-10 py-4 rounded-full font-black shadow-xl active:scale-95 transition-all uppercase text-sm tracking-widest">Explore Trips</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E6D5B8] pb-24 animate-in fade-in duration-700">
            {/* --- PREMIUM STICKY HEADER --- */}
            <div className="bg-[#107870] text-white p-8 pt-16 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <button onClick={() => navigate('/profile')} className="absolute top-8 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <ArrowLeft size={20}/>
                </button>
                <div className="relative z-10">
                    <p className="text-teal-200 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Live Itinerary</p>
                    <h1 className="text-4xl font-black mb-4 tracking-tighter leading-none">{getTripTitle()}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-teal-100/80 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full"><Calendar size={14}/> Starts {new Date(activeBooking.start_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full">
                            {activeBooking.tier_selected === 'full' ? <Sparkles size={14}/> : <Car size={14}/>}
                            {activeBooking.tier_selected} Tier
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 -mt-8 relative z-20">
                {/* --- DRIVER / SUPPORT CARD --- */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl mb-10 border border-white group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden border-2 border-[#107870]/10">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" className="w-full h-full object-cover" alt="Driver" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 leading-tight">Driver Assigned</h3>
                                <p className="text-[10px] font-black text-[#107870] uppercase tracking-widest">Verified SideQuest Partner</p>
                            </div>
                        </div>
                        <a href="https://wa.me/9400000000" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white p-4 rounded-2xl shadow-lg shadow-[#25D366]/20 active:scale-95 hover:scale-105 transition-all">
                            <MessageCircle size={24} fill="currentColor" />
                        </a>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none">Booking Reference</span>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{activeBooking.id.slice(0,8)}</span>
                         </div>
                         <button className="text-[10px] font-black text-[#107870] underline uppercase tracking-widest">Contact HQ</button>
                    </div>
                </div>

                {/* --- DYNAMIC ITINERARY TIMELINE --- */}
                <h2 className="text-2xl font-black text-gray-900 mb-8 px-2 tracking-tighter flex items-center gap-3">
                    Your Sequential Timeline <Navigation size={20} className="text-[#107870]"/>
                </h2>

                <div className="space-y-6 relative">
                    {/* The Visual Line */}
                    <div className="absolute left-[31px] top-4 bottom-4 w-1 bg-[#107870]/10 rounded-full"></div>

                    {itinerarySteps.map((step, index) => (
                        <div key={index} className="relative flex gap-6 items-start animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                            {/* Day Circle */}
                            <div className={`w-16 h-16 shrink-0 rounded-2xl shadow-lg flex flex-col items-center justify-center z-10 border-2 transition-colors ${index === 0 ? 'bg-white border-[#107870] text-[#107870]' : 'bg-white/50 border-gray-200 text-gray-400'}`}>
                                <span className="text-[8px] font-black uppercase leading-none mb-1">Day</span>
                                <span className="text-2xl font-black leading-none">{index + 1}</span>
                            </div>

                            {/* Content Box */}
                            <div className={`flex-1 p-6 rounded-[2rem] shadow-sm border transition-all ${index === 0 ? 'bg-white border-[#107870]/20 shadow-xl' : 'bg-white/40 border-dashed border-gray-300'}`}>
                                <h4 className={`font-black text-lg mb-2 leading-tight ${index === 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {index === 0 ? "Initial Destination" : `Island Discovery`}
                                </h4>
                                <p className={`text-sm leading-relaxed ${index === 0 ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                                    {step.trim()}
                                </p>
                                {index === 0 && (
                                    <div className="mt-4 flex gap-2">
                                        <button className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#107870] bg-[#107870]/5 px-4 py-2 rounded-full border border-[#107870]/10">
                                            <MapPin size={12}/> Open Location
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyJourney;