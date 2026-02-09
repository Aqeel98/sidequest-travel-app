import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom'; 
import { Award, ShoppingBag, Coffee, Waves, BedSingle, Search, MapPin, ChevronRight } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const Rewards = () => {
  const navigate = useNavigate();
  const { currentUser, rewards, redemptions, redeemReward, setShowAuthModal, showToast  } = useSideQuest();



  const handlePartnerJoin = () => {
    if (!currentUser) {
        setShowAuthModal(true);
    } else {
        navigate('/partner?tab=create');
    }
  };

  // --- IMMORTAL REDEMPTION RESUME ---
  React.useEffect(() => {
    const pending = localStorage.getItem('sq_pending_redemption');

    if (pending && currentUser) {
      localStorage.removeItem('sq_pending_redemption'); // Clear immediately
      const rewardData = JSON.parse(pending);

      const executeRedemption = async () => {
        const code = await redeemReward(rewardData);
        if (code) {
  
          showToast(`Redeemed! Code: ${code}. Saved below.`, 'success');
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 500);
        } 
      };
      executeRedemption();
    }
  }, [currentUser]);


  // --- HELPER: CONVERT MARKDOWN LINKS [text](url) TO CLICKABLE LINKS ---
const LinkifyText = ({ text }) => {
  if (!text) return null;

  // Regex for [Text](URL)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the clickable link
    parts.push(
      <a 
        key={match.index}
        href={match[2]} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-600 underline font-bold hover:text-blue-800"
      >
        {match[1]}
      </a>
    );
    
    lastIndex = markdownLinkRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className="whitespace-pre-line">{parts.length > 0 ? parts : text}</span>;
};


  const myRedemptions = currentUser 
    ? [...redemptions]
        .filter(r => r.traveler_id === currentUser.id)
        .sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'verified' ? 1 : -1;
            }
            return b.id - a.id; 
        })
    : [];

  // --- FIX: Only show Active Rewards to the public ---
  const activeRewards = rewards.filter(r => r.status === 'active');

  const handleRedeem = (reward) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    
    // 1. Stage the reward in hardware memory
    localStorage.setItem('sq_pending_redemption', JSON.stringify(reward));
    
    // 2. Force hard refresh to establish a fresh connection
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#E6D5B8] pb-20">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 flex items-center">
          <ShoppingBag className="mr-3 text-green-600" /> Rewards Marketplace
        </h1>
        {currentUser ? (
          <p className="text-gray-600">
            You have <span className="font-bold text-green-600">{currentUser.xp} XP</span> available to spend.
          </p>
        ) : (
          <p className="text-gray-600 italic">Login to see your XP and redeem rewards.</p>
        )}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {activeRewards.length === 0 ? (
            /* --- SCOUTING MODE UI --- */
            <div className="col-span-full py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="max-w-2xl mx-auto">
                    <div className="inline-flex p-4 bg-brand-50 rounded-full mb-6 text-brand-600">
                        <Search size={32} className="animate-pulse" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                        Our Marketplace is Growing...
                    </h2>
                    
                    <p className="text-gray-600 leading-relaxed mb-12 text-lg font-medium">
                    We’re scouting Sri Lanka for impact-driven partners. Your XP shows the mark you’ve made. 
                    Save it to unlock exclusive rewards at cafés, stays, and workshops soon.
                    </p>

                    {/* --- COMING SOON GRAPHIC --- */}
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 hidden md:block"></div>
                        
                        <div className="grid grid-cols-3 gap-4 md:gap-12">
                            <div className="flex flex-col items-center group">
                                <div className="p-5 bg-white border-2 border-gray-50 rounded-2xl shadow-sm text-gray-300 group-hover:text-orange-500 transition-colors">
                                    <Coffee size={32} />
                                </div>
                                <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Partner Cafes</span>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="p-5 bg-white border-2 border-gray-50 rounded-2xl shadow-sm text-gray-300 group-hover:text-blue-500 transition-colors">
                                    <Waves size={32} />
                                </div>
                                <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Surf Lessons</span>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="p-5 bg-white border-2 border-gray-50 rounded-2xl shadow-sm text-gray-300 group-hover:text-emerald-500 transition-colors">
                                    <BedSingle size={32} />
                                </div>
                                <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Impact Stays</span>
                            </div>
                        </div>
                    </div>


                    <div className="mt-16 p-8 bg-brand-600 rounded-3xl text-white text-left relative overflow-hidden shadow-xl shadow-brand-100">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-2">Own a local spot?</h3>
                            <p className="text-brand-100 text-sm mb-6 leading-relaxed max-w-md">
                                Join as a Partner to add your own rewards to the map and connect with travelers who care about impact.
                            </p>
                            <button 
                                onClick={handlePartnerJoin}
                                className="bg-white text-brand-600 px-6 py-3 rounded-xl font-black text-sm flex items-center hover:bg-brand-50 transition-all transform active:scale-95"
                            >
                                {currentUser ? 'Go to Partner Dashboard' : 'Join as a Partner'}
                                <ChevronRight size={18} className="ml-1" />
                            </button>
                        </div>
                        
                        {/* Decorative background icon */}
                        <ShoppingBag size={120} className="absolute -right-8 -bottom-8 text-white/10 -rotate-12" />
                    </div>

                    {/* Keep the "Scouting in Progress" badge at the very bottom */}
                    <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></div>
                        SideQuest Scouting in Progress
                    </div>
                </div>
            </div>
        ) : (

            activeRewards.map(reward => {
            const canAfford = currentUser && currentUser.xp >= reward.xp_cost;
            return (
                <div key={reward.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <img 
                    src={reward.image || "https://via.placeholder.com/400x200?text=Reward"} 
                    alt={reward.title} 
                    className="w-full h-40 object-cover" 
                />
                <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">{reward.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">
                       <LinkifyText text={reward.description} />
                    </p>

                    {reward.map_link && (
                        <a 
                            href={reward.map_link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors mb-4 border border-blue-100 uppercase tracking-tighter"
                        >
                            <MapPin size={12} className="mr-1"/> Navigate to Business
                        </a>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto">
                    <span className="text-green-600 font-bold flex items-center">
                        ⭐ {reward.xp_cost} XP
                    </span>
                    <button 
                        onClick={() => handleRedeem(reward)}
                        disabled={currentUser && !canAfford}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                        !currentUser || canAfford 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {canAfford || !currentUser ? 'Redeem' : 'Insufficient XP'}
                    </button>
                    </div>
                </div>
                </div>
                
            );
            })
        )}
      </div>

      {/* User's Redemptions Section */}
      {myRedemptions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Your Redemptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRedemptions.map(redemption => {
              const reward = rewards.find(r => r.id == redemption.reward_id);
              
              const dateString = redemption.redeemed_at 
                ? new Date(redemption.redeemed_at).toLocaleDateString() 
                : 'Date Unknown';

              return (
                <div key={redemption.id} className={`rounded-2xl p-5 border flex items-center justify-between transition-all ${
                  redemption.status === 'verified' ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-green-50 border-green-200'
              }`}>
                  <div>
                      <h3 className={`font-bold ${redemption.status === 'verified' ? 'text-gray-400' : 'text-gray-800'}`}>
                          {reward?.title || 'Unknown Reward'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Code: <span className="font-mono font-bold text-green-700">{redemption.redemption_code}</span></p>
                      <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${redemption.status === 'verified' ? 'text-gray-400' : 'text-brand-600'}`}>
                          {redemption.status === 'verified' ? '✓ Voucher Used' : '○ Ready to Use'}
                      </p>
                  </div>
                  <Award className={redemption.status === 'verified' ? 'text-gray-300' : 'text-green-500'} size={36} />
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Rewards;