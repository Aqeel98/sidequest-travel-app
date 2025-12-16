import React from 'react';
import { Award, ShoppingBag } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const Rewards = () => {
  const { currentUser, rewards, redemptions, redeemReward, setShowAuthModal } = useSideQuest();

  const myRedemptions = currentUser 
    ? redemptions.filter(r => r.traveler_id === currentUser.id) 
    : [];

  const handleRedeem = (reward) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const code = redeemReward(reward);
    if (code) {
      alert(`Success! Your redemption code is: ${code}`);
    }
  };

  return (
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
        {rewards.map(reward => {
          const canAfford = currentUser && currentUser.xp >= reward.xp_cost;
          return (
            <div key={reward.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <img src={reward.image} alt={reward.title} className="w-full h-40 object-cover" />
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2 text-gray-800">{reward.title}</h3>
                <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">{reward.description}</p>
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
        })}
      </div>

      {/* User's Redemptions Section */}
      {myRedemptions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Your Redemptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRedemptions.map(redemption => {
              const reward = rewards.find(r => r.id === redemption.reward_id);
              return (
                <div key={redemption.id} className="bg-green-50 rounded-lg p-5 border border-green-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">{reward?.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Code: <span className="font-mono font-bold text-green-700 bg-white px-2 py-0.5 rounded border border-green-200">{redemption.redemption_code}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Redeemed on {new Date(redemption.redeemed_date).toLocaleDateString()}</p>
                  </div>
                  <Award className="text-green-500" size={36} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;