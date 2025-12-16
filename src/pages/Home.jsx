import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const Home = () => {
  const { quests } = useSideQuest();
  const navigate = useNavigate();

  return (
    <div className="pb-12 bg-slate-50 min-h-screen">
      
      {/* --- AESTHETIC HEADER START --- */}
      <div className="relative bg-brand-600 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-brand-200/50">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full bg-brand-400 opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-300 opacity-20 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-transparent via-white/5 to-transparent rotate-12"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-medium mb-6 animate-fade-in-up">
            <Sparkles size={16} className="text-yellow-300" />
            <span>Discover the unseen Sri Lanka</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Travel with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white">Purpose</span>
          </h1>
          
          <p className="text-lg md:text-xl text-teal-50 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Don't just visit. Connect. Complete micro-impact quests, earn rewards, and leave every place better than you found it.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => document.getElementById('quests-grid').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-brand-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-white/20 transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
              Explore Quests
            </button>
            <button 
              onClick={() => navigate('/map')}
              className="bg-brand-700/50 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-700/70 transition-all flex items-center justify-center"
            >
              View Map <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
      {/* --- AESTHETIC HEADER END --- */}

      {/* Quest Grid */}
      <div id="quests-grid" className="max-w-7xl mx-auto px-4 mt-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Available Quests</h2>
            <p className="text-gray-500 mt-2">Curated experiences for the modern traveler</p>
          </div>
          <button onClick={() => navigate('/map')} className="hidden md:block text-brand-600 font-bold hover:underline">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quests
                .filter(quest => quest.status === 'active') // <-- FILTER: Only show active quests
                .map(quest => (
                <div 
                    key={quest.id} 
                    onClick={() => navigate(`/quest/${quest.id}`)} 
                    className="group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:shadow-brand-100/50 transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                >
                    <div className="relative h-64 overflow-hidden">
                        <img 
                            src={quest.image} 
                            alt={quest.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-brand-600 shadow-lg">
                            ⭐ {quest.xp_value} XP
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                quest.category === 'Environmental' ? 'bg-emerald-100 text-emerald-700' :
                                quest.category === 'Social' ? 'bg-blue-100 text-blue-700' :
                                quest.category === 'Education' ? 'bg-indigo-100 text-indigo-700' :
                                quest.category === 'Animal Welfare' ? 'bg-pink-100 text-pink-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                                {quest.category}
                            </span>
                        </div>
                        
                        <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-brand-600 transition-colors">
                            {quest.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-500 text-sm mt-4">
                            <MapPin size={16} className="mr-1.5 text-gray-400" /> 
                            {quest.location_address}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Home;