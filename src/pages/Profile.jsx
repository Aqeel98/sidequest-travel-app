import React, { useState, useEffect, useMemo } from 'react';
import { Award, Compass, Globe, CheckCircle, Clock, Leaf, Heart, Flag, Mountain, Map, Anchor, Bird, Trophy, Zap } from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import { useAppPreferences } from '../context/AppPreferencesContext';

const BADGE_THRESHOLDS = {
    'Impact Explorer': 1,
    'Committed Traveler': 3,
    'South Coast Steward': 6,
    'Eco Champion': 2,
    'Community Builder': 2,
    'Cultural Ambassador': 1,
    'Animal Ally': 1,
    'Adventure Seeker': 2,    
    'True Explorer': 2,       
    'Ocean Guardian': 1,    
    'Wildlife Ranger': 1,    
    'Sports MVP': 1,
    'Athletic Champion': 3,

};

const Profile = () => {
        // --- NEW: ROTATING QUOTES LOGIC ---
    const [quoteIndex, setQuoteIndex] = useState(0);
    
    const IMPACT_QUOTES = [
        "Your journey is measured in impact, not just miles.",
        "Leave the island better than you found it.",
        "You are writing a story the island will remember.",
        "Travel far, tread lightly, and give back.",
        "Every quest completed is a story preserved.",
        "The map is only the beginning of the adventure."

    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % IMPACT_QUOTES.length);
        }, 30000); // 30,000ms = 30 seconds
        return () => clearInterval(timer); // Cleanup on leave
    }, []);
    // ----------------------------------


    // 1. All Hooks called at the top level
    const { currentUser, questProgress, quests, questSuggestions } = useSideQuest();
    const { theme } = useAppPreferences();
    const isDark = theme === 'dark';

    // 2. Memoize stats calculation and badge logic
    const stats = useMemo(() => {
        // If no user, return empty stats safely
        if (!currentUser) return {
            lifetimeXP: 0, walletXP: 0, completedQuests: 0, activeQuests: 0, badges: [], recentQuests: [], level: 1, progressPercent: 0
        };
        
        const myProgress = questProgress.filter(p => p.traveler_id === currentUser.id);
        const completedProgress = myProgress.filter(p => p.status === 'approved');
        
        // Fix: Calculate "Active" properly (In Progress + Pending), ignoring Rejected
        const activeProgress = myProgress.filter(p => p.status === 'in_progress' || p.status === 'pending');

        const completedQuests = completedProgress.length;
        const activeQuests = activeProgress.length; 

        // --- TWO DIFFERENT XP NUMBERS ---
        // LIFETIME XP: total XP ever earned from approved quests AND the 50 XP
        // bonus for each approved traveler suggestion. Immutable ledger.
        // Drives Level, progress bar, and achievement badges so they never
        // regress when a user redeems a reward.
        //
        // The 50 constant mirrors the DB trigger award_xp_on_quest_suggestion_approval().
        // If that trigger ever changes the amount, update SUGGESTION_XP_BONUS here too.
        const SUGGESTION_XP_BONUS = 50;
        const questXP = completedProgress.reduce((sum, p) => {
            const q = quests.find(quest => quest.id === p.quest_id);
            return sum + (q?.xp_value || 0);
        }, 0);
        const approvedSuggestionCount = (questSuggestions || []).filter(
            s => s.submitted_by === currentUser.id && s.status === 'approved' && s.xp_awarded
        ).length;
        const suggestionBonusXP = approvedSuggestionCount * SUGGESTION_XP_BONUS;
        const lifetimeXP = questXP + suggestionBonusXP;

        // WALLET XP: spendable balance (profiles.xp). Goes down on redemption.
        // Used for display only — redemption gating is enforced server-side.
        const walletXP = currentUser.xp || 0;

        // Level Calculation: 0-99 XP = Level 1, 100-199 XP = Level 2
        const level = Math.floor(lifetimeXP / 100) + 1;
        // Progress Bar: 0 to 100% based on remainder
        const progressPercent = lifetimeXP % 100;


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
        if (lifetimeXP >= 150) badges.push({ name: 'XP Collector', icon: <Award size={24} />, color: 'text-yellow-500', desc: 'Accumulated over 150 XP' });

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

        if (categoryCounts['Adventure'] >= BADGE_THRESHOLDS['Adventure Seeker']) {
            badges.push({ name: 'Adventure Seeker', icon: <Mountain size={24} />, color: 'text-purple-600', desc: 'Completed 2+ Adventure Quests' });
       }
       if (categoryCounts['Exploration'] >= BADGE_THRESHOLDS['True Explorer']) {
            badges.push({ name: 'True Explorer', icon: <Map size={24} />, color: 'text-indigo-500', desc: 'Completed 2+ Exploration Quests' });
       }
       if (categoryCounts['Marine Adventure'] >= BADGE_THRESHOLDS['Ocean Guardian']) {
            badges.push({ name: 'Ocean Guardian', icon: <Anchor size={24} />, color: 'text-cyan-600', desc: 'Completed a Marine Adventure' });
       }
       if (categoryCounts['Wildlife Adventure'] >= BADGE_THRESHOLDS['Wildlife Ranger']) {
            badges.push({ name: 'Wildlife Ranger', icon: <Bird size={24} />, color: 'text-lime-600', desc: 'Completed a Wildlife Adventure' });
       }
       if (categoryCounts['Sports & Recreation'] >= BADGE_THRESHOLDS['Sports MVP']) {
        badges.push({ 
            name: 'Sports MVP', 
            icon: <Trophy size={24} />, 
            color: 'text-indigo-500', 
            desc: 'Completed your first Sports quest' 
        });
    }
    
    // Tier 2: Athletic Champion (THE NEW ONE)
    if (categoryCounts['Sports & Recreation'] >= BADGE_THRESHOLDS['Athletic Champion']) {
        badges.push({ 
            name: 'Athletic Champion', 
            icon: <Zap size={24} />, 
            color: 'text-indigo-700', 
            desc: 'Completed 3+ Sports & Recreation quests' 
        });
    }
        return {
            lifetimeXP,
            walletXP,
            completedQuests,
            activeQuests, 
            badges,
            recentQuests: [...completedProgress].reverse(),
            level, 
            progressPercent
        };
    }, [currentUser, questProgress, quests, questSuggestions]);
    
    // 3. Early return after all hooks are called
    if (!currentUser) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Please login to view your Traveler Profile</h2>
            </div>
        );
    }
    
    const { lifetimeXP, walletXP, completedQuests, activeQuests, badges, recentQuests, level, progressPercent } = stats;

    return (
        <div className={`max-w-4xl mx-auto px-4 py-8 ${isDark ? 'text-cyan-50' : ''}`}>
            <h1 className={`text-3xl font-bold mb-2 flex items-center ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>
                <Award className="text-yellow-500 mr-3" size={32} />
                Traveler Profile
            </h1>
            {/* Correctly displays Full Name or falls back to Email */}
            {/* User Name + Rotating Quote */}
            <div className="mb-8">
                <p className={`text-lg font-bold ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>
                    {currentUser.full_name || currentUser.email.split('@')[0]}
                </p>
                <p className={`italic text-sm mt-1 animate-in fade-in duration-700 key={quoteIndex} ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>
                    "{IMPACT_QUOTES[quoteIndex]}"
                </p>
            </div>

            {/* --- LEVEL CARD START --- */}
            <div className="bg-[#107870] text-white rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
                                {/* Background Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="relative z-10 flex items-center justify-between gap-6">
                    <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Current Rank</p>
                    <h2 className="text-4xl font-black text-white">Level {level}</h2>
                    <p className="text-white/80 text-xs mt-1">{100 - progressPercent} XP to next level</p>
                
                    </div>

                    <div className="flex-1 max-w-[200px]">
                        <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-white">{Math.round(progressPercent)}%</span>
                            <span className="text-white/80">Level {level + 1}</span>
                                                    </div>
                        <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden border border-gray-600">
                            <div 
                                className="bg-gradient-to-r from-brand-300 to-brand-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- LEVEL CARD END --- */}

            {/* --- XP & STATS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className={`rounded-xl shadow-lg p-6 border-t-4 border-yellow-500 ${isDark ? 'bg-[#0d4b4b] border border-cyan-900/50' : 'bg-white'}`}>
                    <p className={`text-sm font-semibold ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Total Impact Points</p>
                    <p className={`text-4xl font-extrabold mt-1 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>⭐ {lifetimeXP} XP</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`} title="Your spendable balance. Redeemed rewards deduct from this, not from your lifetime impact.">
                        Wallet: <span className="font-bold text-brand-600">{walletXP} XP</span> <span className={isDark ? 'text-cyan-200/70' : 'text-gray-400'}>available to spend</span>
                    </p>
                </div>
                <div className={`rounded-xl shadow-lg p-6 border-t-4 border-brand-500 ${isDark ? 'bg-[#0d4b4b] border border-cyan-900/50' : 'bg-white'}`}>
                    <p className={`text-sm font-semibold ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Quests Completed</p>
                    <p className={`text-4xl font-extrabold mt-1 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>{completedQuests}</p>
                </div>
                <div className={`rounded-xl shadow-lg p-6 border-t-4 border-blue-500 ${isDark ? 'bg-[#0d4b4b] border border-cyan-900/50' : 'bg-white'}`}>
                    <p className={`text-sm font-semibold ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Quests In Progress</p>
                    <p className={`text-4xl font-extrabold mt-1 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>{activeQuests}</p>
                </div>
            </div>

            {/* --- BADGES --- */}
            <div className="mb-10">
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>Impact Badges ({badges.length})</h2>
                <div className="flex flex-wrap gap-4">
                    {badges.length > 0 ? (
                        badges.map(badge => (
                            <div key={badge.name} className={`flex items-center rounded-xl p-4 shadow-sm hover:shadow-md transition group ${isDark ? 'bg-[#0d4b4b] border border-cyan-900/50' : 'bg-white border border-brand-100'}`}>
                                <div className={`mr-3 ${badge.color} group-hover:scale-110 transition-transform`}>{badge.icon}</div>
                                <div>
                                    <span className={`font-bold ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>{badge.name}</span>
                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>{badge.desc}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={isDark ? 'text-cyan-200/80' : 'text-gray-500'}>Complete your first quest to earn a badge!</p>
                    )}
                </div>
            </div>

            {/* --- RECENT ACTIVITY --- */}
            <div>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>Recent Completed Quests</h2>
                <div className="space-y-3">
                    {recentQuests.length > 0 ? (
                        recentQuests.map(p => {
                            const quest = quests.find(q => q.id === p.quest_id);
                            return (
                                <div key={p.id} className={`rounded-xl p-4 shadow-sm flex items-center justify-between ${isDark ? 'bg-[#0d4b4b] border border-cyan-900/50' : 'bg-white'}`}>
                                    <div className="flex items-center">
                                        <Clock size={20} className={`mr-3 ${isDark ? 'text-cyan-200/70' : 'text-gray-400'}`} />
                                        <div className={`font-medium ${isDark ? 'text-cyan-50' : 'text-gray-800'}`}>
                                            {quest?.title || "Unknown Quest"}
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
                        <p className={isDark ? 'text-cyan-200/80' : 'text-gray-500'}>No quests completed yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;