import React, { useMemo } from 'react';
import { Award, Compass, Globe, CheckCircle, Clock, Leaf, Heart, Flag } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const BADGE_THRESHOLDS = {
    'Impact Explorer': 1,
    'Committed Traveler': 3,
    'South Coast Steward': 6,
    'Eco Champion': 2,
    'Community Builder': 2,
    'Cultural Ambassador': 1,
    'Animal Ally': 1,
};

const Profile = () => {
    // 1. All Hooks called at the top level
    const { currentUser, questProgress, quests } = useSideQuest();

    // 2. Memoize stats calculation and badge logic
    const stats = useMemo(() => {
        // If no user, return empty stats safely
        if (!currentUser) return {
            totalXP: 0, completedQuests: 0, totalQuests: 0, badges: [], recentQuests: []
        };
        
        const myProgress = questProgress.filter(p => p.traveler_id === currentUser.id);
        const completedProgress = myProgress.filter(p => p.status === 'approved');
        const completedQuests = completedProgress.length;
        const totalQuests = myProgress.length; // Correct variable usage here

        // Count completed quests by category
        const categoryCounts = completedProgress.reduce((acc, p) => {
            const quest = quests.find(q => q.id === p.quest_id);
            const category = quest?.category || 'Other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        // Badge Logic
        const badges = [];
        
        // 1. General Completion Badges
        if (completedQuests >= BADGE_THRESHOLDS['Impact Explorer']) badges.push({ name: 'Impact Explorer', icon: <Compass size={24} />, color: 'text-brand-500', desc: 'Completed your very first SideQuest' });
        if (completedQuests >= BADGE_THRESHOLDS['Committed Traveler']) badges.push({ name: 'Committed Traveler', icon: <CheckCircle size={24} />, color: 'text-emerald-500', desc: `Completed ${BADGE_THRESHOLDS['Committed Traveler']} quests` });
        if (completedQuests >= BADGE_THRESHOLDS['South Coast Steward']) badges.push({ name: 'South Coast Steward', icon: <Globe size={24} />, color: 'text-blue-500', desc: `Completed ${BADGE_THRESHOLDS['South Coast Steward']} quests in the pilot region` });
        if (currentUser.xp >= 150) badges.push({ name: 'XP Collector', icon: <Award size={24} />, color: 'text-yellow-500', desc: 'Accumulated over 150 XP' });

        // 2. Category-Specific Badges
        if (categoryCounts['Environmental'] >= BADGE_THRESHOLDS['Eco Champion']) {
             badges.push({ name: 'Eco Champion', icon: <Leaf size={24} />, color: 'text-green-600', desc: 'Completed 2+ Environmental Quests' });
        }
        if (categoryCounts['Social'] >= BADGE_THRESHOLDS['Community Builder']) {
             badges.push({ name: 'Community Builder', icon: <Heart size={24} />, color: 'text-red-500', desc: 'Completed 2+ Social Quests' });
        }
        if (categoryCounts['Cultural'] >= BADGE_THRESHOLDS['Cultural Ambassador']) {
             badges.push({ name: 'Cultural Ambassador', icon: <Flag size={24} />, color: 'text-orange-500', desc: 'Completed a Cultural Exchange Quest' });
        }
        if (categoryCounts['Animal Welfare'] >= BADGE_THRESHOLDS['Animal Ally']) {
             badges.push({ name: 'Animal Ally', icon: <Heart size={24} />, color: 'text-pink-500', desc: 'Completed an Animal Welfare Quest' });
        }

        return {
            totalXP: currentUser.xp,
            completedQuests,
            totalQuests, // Correct variable usage here
            badges,
            recentQuests: completedProgress.slice(-3).reverse(),
        };
    }, [currentUser, questProgress, quests]);
    
    // 3. Early return after all hooks are called
    if (!currentUser) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Please login to view your Traveler Profile</h2>
            </div>
        );
    }
    
    // Use the values returned from stats
    const { totalXP, completedQuests, totalQuests, badges, recentQuests } = stats;


    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 flex items-center">
                <Award className="text-yellow-500 mr-3" size={32} />
                Traveler Profile
            </h1>
            <p className="text-lg text-gray-500 mb-8">Welcome back, {currentUser.name || currentUser.email.split('@')[0]}!</p>

            {/* --- XP & STATS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
                    <p className="text-sm font-semibold text-gray-500">Total Impact Points</p>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">⭐ {totalXP} XP</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-brand-500">
                    <p className="text-sm font-semibold text-gray-500">Quests Completed</p>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{completedQuests}</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                    <p className="text-sm font-semibold text-gray-500">Quests In Progress</p>
                    {/* FIXED: Use the correct variable from the destructured stats object */}
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{totalQuests - completedQuests}</p>
                </div>
            </div>

            {/* --- BADGES --- */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Impact Badges ({badges.length})</h2>
                <div className="flex flex-wrap gap-4">
                    {badges.length > 0 ? (
                        badges.map(badge => (
                            <div key={badge.name} className="flex items-center bg-white border border-brand-100 rounded-xl p-4 shadow-sm hover:shadow-md transition group">
                                <div className={`mr-3 ${badge.color} group-hover:scale-110 transition-transform`}>{badge.icon}</div>
                                <div>
                                    <span className="font-bold text-gray-800">{badge.name}</span>
                                    <p className="text-xs text-gray-500 mt-0.5">{badge.desc}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Complete your first quest to earn a badge!</p>
                    )}
                </div>
            </div>

            {/* --- RECENT ACTIVITY --- */}
            <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Completed Quests</h2>
                <div className="space-y-3">
                    {recentQuests.length > 0 ? (
                        recentQuests.map(p => {
                            const quest = quests.find(q => q.id === p.quest_id);
                            return (
                                <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Clock size={20} className="mr-3 text-gray-400" />
                                        <div className="text-gray-800 font-medium">
                                            {quest?.title}
                                            <p className={`text-xs mt-1 font-bold uppercase ${p.status === 'approved' ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                                {p.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    {p.status === 'approved' && <span className="text-sm font-bold text-emerald-600">+ {quest?.xp_value} XP</span>}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500">No quests completed yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;