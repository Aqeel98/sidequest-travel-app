import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Map, Camera, Award, Gift, CheckCircle, Shield, 
  Users, HeartHandshake, ArrowRight, Lock, EyeOff, Zap 
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const HowItWorks = () => {
  const navigate = useNavigate();
  const { setShowAuthModal, currentUser } = useSideQuest(); 
  const [activeTab, setActiveTab] = useState('traveler');

  // --- CONTENT DATA ---
  const travelerSteps = [
    {
      title: "Discover Impact Quests",
      // UPDATED: Generalized description
      desc: "Browse the map to find curated activities that matter. Whether it's Conservation, Cultural Exchange, or Animal Welfare, find a quest that matches your vibe nearby.",
      icon: <Map className="text-brand-600" size={32} />,
      color: "bg-brand-50 border-brand-200"
    },
    {
      title: "Journey with Purpose", 
      desc: "Travel to the location and immerse yourself in the task. It's not just volunteering; it's experiencing the island deeper than any tourist.",
      icon: <HeartHandshake className="text-red-500" size={32} />,
      color: "bg-red-50 border-red-200"
    },
    {
      title: "Snap & Upload",
      desc: "Take a clear photo as proof of your action. Upload it directly through the app (optimized for 4G).",
      icon: <Camera className="text-blue-500" size={32} />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Earn & Redeem",
      desc: "Admins verify your proof. You earn XP instantly! Spend XP in the Marketplace for discounts at local cafes & hotels.",
      icon: <Gift className="text-orange-500" size={32} />,
      color: "bg-orange-50 border-orange-200"
    }
  ];

  const partnerSteps = [
    {
      title: "Create an Experience",
      // UPDATED: Generalized description for any business type
      desc: "Turn your business into a destination for conscious travelers. Design any type of challenge, activity, or cultural experience that brings people to your location and creates positive impact.",
      icon: <Users className="text-purple-600" size={32} />,
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Admin Verification",
      desc: "Our 'Game Masters' review your Quest to ensure safety and quality. Once approved, it goes LIVE on the map.",
      icon: <Shield className="text-emerald-600" size={32} />,
      color: "bg-emerald-50 border-emerald-200"
    },
    {
      title: "Receive Travelers",
      desc: "Travelers find your Quest, visit your location, and complete the task. You get visibility; the island gets impact.",
      icon: <Map className="text-brand-600" size={32} />,
      color: "bg-brand-50 border-brand-200"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      
      {/* --- HERO SECTION --- */}
      <div className="bg-brand-600 pt-32 pb-20 px-4 text-center relative overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-800 rounded-full blur-3xl"></div>
        </div>

        <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          How SideQuest Works
        </h1>
        <p className="relative z-10 text-brand-100 text-lg max-w-2xl mx-auto">
          Whether you're an adventurer looking to make a difference or a local business growing your community, here is your guide.
        </p>

        {/* --- TOGGLE SWITCH --- */}
        <div className="relative z-10 flex justify-center mt-10">
          <div className="bg-brand-800/50 p-1 rounded-full backdrop-blur-md inline-flex">
            <button 
              onClick={() => setActiveTab('traveler')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === 'traveler' 
                  ? 'bg-white text-brand-600 shadow-lg scale-105' 
                  : 'text-brand-100 hover:text-white'
              }`}
            >
              For Travelers
            </button>
            <button 
              onClick={() => setActiveTab('partner')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === 'partner' 
                  ? 'bg-white text-brand-600 shadow-lg scale-105' 
                  : 'text-brand-100 hover:text-white'
              }`}
            >
              For Partners
            </button>
          </div>
        </div>
      </div>

      {/* --- STEPS CONTENT --- */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(activeTab === 'traveler' ? travelerSteps : partnerSteps).map((step, index) => (
            <div 
              key={index} 
              className={`bg-white p-8 rounded-3xl shadow-lg border-2 ${step.color} flex flex-col items-start hover:-translate-y-1 transition-transform duration-300`}
            >
              <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm inline-block">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {index + 1}. {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* --- THE SIDEQUEST PROMISE (Privacy & Trust) --- */}
        {activeTab === 'traveler' && (
            <div className="mt-12 bg-slate-50 border border-slate-200 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">The SideQuest Promise</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Privacy */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-600">
                            <EyeOff size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">No Tracking</h4>
                        <p className="text-sm text-slate-500">
                            We value your freedom. We do not track your live location unless you actively click "Find Nearest Quests".
                        </p>
                    </div>

                    {/* Anonymity */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-600">
                            <Shield size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Stay Anonymous</h4>
                        <p className="text-sm text-slate-500">
                            You can sign up with any nickname. We only need an email to save your XP and badges.
                        </p>
                    </div>

                    {/* Recovery */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-600">
                            <Zap size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Instant Recovery</h4>
                        <p className="text-sm text-slate-500">
                            Forget your password? No problem. We send a secure Magic Link to your email to log you back in instantly.
                        </p>
                    </div>

                </div>
            </div>
        )}

        {/* --- GUIDELINES SECTION --- */}
        <div className="mt-12 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {activeTab === 'traveler' ? 'Submission Guidelines' : 'Partner Rules'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* DO'S */}
            <div>
              <h3 className="text-emerald-600 font-bold text-lg mb-4 flex items-center uppercase tracking-wider">
                <CheckCircle className="mr-2" /> Do This
              </h3>
              <ul className="space-y-4">
                {activeTab === 'traveler' ? (
                  <>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0"></div>Take clear photos showing YOU doing the activity.</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0"></div>Respect local customs and dress codes.</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0"></div>Wait for GPS to lock before starting a quest.</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0"></div>Provide accurate GPS coordinates.</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0"></div>Offer genuine rewards (discounts/freebies).</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0"></div>Keep safety instructions clear.</li>
                  </>
                )}
              </ul>
            </div>

            {/* DONT'S */}
            <div>
              <h3 className="text-red-500 font-bold text-lg mb-4 flex items-center uppercase tracking-wider">
                <Shield className="mr-2" /> Avoid This
              </h3>
              <ul className="space-y-4">
                {activeTab === 'traveler' ? (
                  <>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 shrink-0"></div>Don't upload blurry or dark photos.</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 shrink-0"></div>Don't submit the same photo for multiple quests.</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 shrink-0"></div>Don't trespass on private property.</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 shrink-0"></div>Don't create quests that harm wildlife.</li>
                    <li className="flex items-start text-gray-600"><div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 shrink-0"></div>Don't use copyrighted images without permission.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* --- CTA --- */}
        <div className="mt-16 text-center pb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Ready to start?</h3>
            
            {activeTab === 'traveler' ? (
                <button 
                  onClick={() => navigate('/')} 
                  className="bg-brand-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-700 hover:shadow-xl transition-all flex items-center justify-center mx-auto"
                >
                  Find a Quest <ArrowRight className="ml-2" />
                </button>
            ) : (
                <div className="flex flex-col items-center">
                    <p className="text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
                        Join our network of regenerative businesses. Simply create an account and select <strong>"Partner"</strong> as your role to access the dashboard immediately.
                    </p>
                    
                    {currentUser ? (
                         <button 
                            onClick={() => navigate('/partner')}
                            className="bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-700 hover:shadow-xl transition-all flex items-center justify-center"
                        >
                            Go to Partner Dashboard <Users className="ml-2" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowAuthModal(true)}
                            className="bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-700 hover:shadow-xl transition-all flex items-center justify-center"
                        >
                            Create Partner Account <Users className="ml-2" />
                        </button>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default HowItWorks;