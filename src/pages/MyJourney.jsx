import React from 'react';
import { useSideQuest } from '../context/SideQuestContext';
import { MapPin, Phone, Calendar, ArrowLeft, MessageCircle, Navigation, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyJourney = () => {
    const { myBookings, isLoading, currentUser } = useSideQuest();
    const navigate = useNavigate();

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#E6D5B8] font-black text-[#107870]">Loading Journey...</div>;

    // Get the most recent paid booking
    const activeBooking = myBookings[0];

    if (!activeBooking) {
        return (
            <div className="min-h-screen bg-[#E6D5B8] p-8 flex flex-col items-center justify-center text-center">
                <Globe size={64} className="text-[#107870]/20 mb-6" />
                <h2 className="text-3xl font-black text-gray-900 mb-2">No Active Journey</h2>
                <p className="text-gray-500 mb-8 max-w-xs">You haven't booked a SideQuest package yet. Start your adventure today!</p>
                <button onClick={() => navigate('/travel')} className="bg-[#107870] text-white px-8 py-4 rounded-full font-black shadow-xl">Explore Trips</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E6D5B8] pb-24">
            {/* STICKY HEADER */}
            <div className="bg-[#107870] text-white p-8 pt-16 rounded-b-[3.5rem] shadow-2xl relative">
                <button onClick={() => navigate('/profile')} className="absolute top-8 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft size={20}/></button>
                <h1 className="text-3xl font-black mb-2">{activeBooking.travel_packages?.title}</h1>
                <div className="flex items-center gap-4 text-teal-100/80 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(activeBooking.start_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={14}/> {activeBooking.tier_selected} Tier</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 -mt-8">
                {/* DRIVER CARD (Simplified Luxury) */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl mb-10 border border-white">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" alt="Driver" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900">Your Private Driver</h3>
                                <p className="text-xs font-bold text-[#107870] uppercase">Verified SideQuest Partner</p>
                            </div>
                        </div>
                        <a href="https://wa.me/9400000000" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white p-4 rounded-2xl shadow-lg shadow-[#25D366]/20 active:scale-95 transition-all">
                            <MessageCircle size={24} />
                        </a>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Support ID: {activeBooking.id.slice(0,8)}</span>
                         <span className="text-xs font-black text-[#107870] underline cursor-pointer">Safety Guidelines</span>
                    </div>
                </div>

                {/* THE ITINERARY TIMELINE */}
                <h2 className="text-xl font-black text-gray-800 mb-6 px-2">Your Sequential Timeline</h2>
                <div className="space-y-12 relative">
                    {/* The Timeline Line */}
                    <div className="absolute left-8 top-4 bottom-4 w-1 bg-[#107870]/10 rounded-full"></div>

                    {/* Example Day 1 Logic */}
                    <div className="relative flex gap-6 group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#107870] font-black text-xl z-10 border-2 border-[#107870]">1</div>
                        <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-lg">
                            <h4 className="font-black text-gray-900 mb-2">Arrival & Transfer</h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">Meet your driver at BIA and head to your first boutique stay. Relax and soak in the island breeze.</p>
                            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-[#107870] bg-[#107870]/5 px-4 py-2 rounded-full">
                                <Navigation size={12}/> View Route
                            </button>
                        </div>
                    </div>

                    {/* Example Day 2 Logic */}
                    <div className="relative flex gap-6 group opacity-50">
                        <div className="w-16 h-16 bg-white/50 rounded-2xl shadow-lg flex items-center justify-center text-gray-400 font-black text-xl z-10">2</div>
                        <div className="flex-1 bg-white/50 p-6 rounded-[2rem] shadow-sm border border-dashed border-gray-300">
                            <h4 className="font-black text-gray-400 mb-2">Morning Discovery</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">Unlocked on Day 2</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyJourney;