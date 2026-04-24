import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, HelpCircle, Zap, Sparkles, ChevronRight, 
  RotateCcw, Brain, MapPin, Award , Lock, Compass, Leaf, Waves, Anchor, Bird, CheckCircle
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import { useAppPreferences } from '../context/AppPreferencesContext';

const Quiz = () => {

    const navigate = useNavigate();
    const { currentUser, quizBank, completedQuizIds, submitQuizAnswer, showToast, setShowAuthModal, isLoading } = useSideQuest(); 
    const { theme } = useAppPreferences();
    const isDark = theme === 'dark';

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [xpAnimate, setXpAnimate] = useState(false);
    const [gateOpenedFor, setGateOpenedFor] = useState(parseInt(localStorage.getItem('sq_gate_unlocked')) || 1);   
    const [isPromoting, setIsPromoting] = useState(false);




    const [activeLevel, setActiveLevel] = useState(() => {
        return parseInt(localStorage.getItem('sq_gate_unlocked')) || 1;
    });
    
    const completedInLevelCount = useMemo(() => {
        return quizBank.filter(q => q.level === activeLevel && completedQuizIds.includes(q.id)).length;
    }, [quizBank, activeLevel, completedQuizIds]);
    

    const maxDefinedLevel = useMemo(() => {
        if (!quizBank.length) return 8;
        return Math.max(...quizBank.map(q => q.level));
    }, [quizBank]);

    const allDone = useMemo(() => {
        const dbComplete = quizBank.length > 0 && completedQuizIds.length >= quizBank.length;
        const levelOvershot = activeLevel > maxDefinedLevel && completedQuizIds.length > 0;
        return dbComplete || levelOvershot;
    }, [quizBank, completedQuizIds, activeLevel, maxDefinedLevel]);
    


    const availableQuestions = useMemo(() => {
        if (!quizBank.length || allDone) return [];
        
        const pool = quizBank.filter(q => q.level === activeLevel && !completedQuizIds.includes(q.id));
        
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
    
        return shuffled;
    }, [quizBank, activeLevel, completedQuizIds, allDone]);
    
    const isLevelComplete = completedInLevelCount >= 10;

    

    
    const isLevelGateActive = useMemo(() => {
        // If they finished 10 questions but haven't "reloaded" to clear the availableQuestions
        return completedInLevelCount === 0 && completedQuizIds.length > 0 && availableQuestions.length === 0;
    }, [completedInLevelCount, completedQuizIds.length, availableQuestions.length]);

    const getXpForLevel = (lvl) => {
        if (lvl <= 3) return 2;
        if (lvl <= 6) return 4;
        return 6;
    };


   

    // --- 10 THOUGHT PROVOKING QUOTES ---
const EXPLORER_QUOTES = [
    "Your impact is measured in the stories you leave behind, not the miles you travel.",
    "Sri Lanka's beauty is a gift from the past; your actions are a gift to its future.",
    "Ancient irrigation taught us that every drop counts. How will you make your mark?",
    "Discovery isn't just seeing new lands, it's seeing with new eyes.",
    "The ocean doesn't separate islands; it connects them. We are all stewards of the same sea.",
    "Tread lightly on this emerald isle; the ancestors are watching and the future is waiting.",
    "Sigiriya was built on a dream of height. May your journey reach the same heights of purpose.",
    "A traveler sees what they see; an adventurer sees what they have come to see.",
    "Leave the island better than you found it, one quest at a time.",
    "The map shows you where to go, but your heart decides why you stay.",
    "The sea turtle returns to its birth beach after thousands of miles. May your journey always lead you back to your purpose.",
"Ancient cities were built to outlast kings. True impact is building something that the next generation will inherit with pride.",
"Every destination is a mirror. What you find in the island is a reflection of what you bring within you.",
"The most beautiful view in Sri Lanka isn't a mountain or a beach; it's the smile of a stranger you've truly helped.",
"A rainforest takes centuries to grow and a moment to disappear. Be the shield that protects the emerald silence.",
"Even the hardest granite was once shaped by the hands of dreamers. Your actions today are the carvings of tomorrow.",
"In a world of fast travel, be the one who lingers. The island reveals its secrets only to those who stop to listen.",
"Take more than memories; take inspiration. Leave more than footprints; leave an impact.",
"One island, thousands of stories. You are not just a visitor; you are a character in its unfolding history."
];

const [quoteIdx, setQuoteIdx] = useState(0);

// --- ROTATION ENGINE  ---
useEffect(() => {
    const interval = setInterval(() => {
        setQuoteIdx((prev) => (prev + 1) % EXPLORER_QUOTES.length);
    }, 10000);
    return () => clearInterval(interval); 
}, []);

    // Scroll to top on load
    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        if (!isLoading && completedQuizIds.length > 0) {
            const dbLevel = Math.floor(completedQuizIds.length / 10) + 1;
            const local = parseInt(localStorage.getItem('sq_gate_unlocked')) || 1;
            // Sync the gate to the highest known level
            setGateOpenedFor(Math.max(dbLevel, local));
        }
    }, [completedQuizIds, isLoading]);


    useEffect(() => {
        const savedIndex = localStorage.getItem('sq_quiz_index');
        if (savedIndex) {
            setCurrentIndex(parseInt(savedIndex));
        }
    }, []);
    
    // 2. Save progress whenever the index changes
    useEffect(() => {
        localStorage.setItem('sq_quiz_index', currentIndex.toString());
    }, [currentIndex]);

    const [frozenQuestion, setFrozenQuestion] = React.useState(null);

    React.useEffect(() => {
        if (isCorrect === null) {
            if (availableQuestions[currentIndex]) {
                setFrozenQuestion(availableQuestions[currentIndex]);
            } else {
                setFrozenQuestion(null);
            }
        }
    }, [availableQuestions, currentIndex, isCorrect]);

    const currentQuestion = frozenQuestion;

    const handleAnswer = (index) => {
        if (selectedOption !== null || !currentQuestion) return; 
        
        setSelectedOption(index);
    
        const isActuallyCorrect = index === currentQuestion.correct_index;
        setIsCorrect(isActuallyCorrect);
    
        if (isActuallyCorrect) {
            setXpAnimate(true);
            showToast(`Correct! +${currentQuestion.xp_reward || 2} XP`, 'success');
            setTimeout(() => setXpAnimate(false), 600);
        } else {
            showToast("Incorrect answer.", 'error');
        }
    
        submitQuizAnswer(
            currentQuestion.id, 
            index, 
            currentQuestion.xp_reward || 2, 
            isActuallyCorrect
        );
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setIsCorrect(null);
        setShowHint(false);
        setCurrentIndex(0);
    };

    useEffect(() => {
        let stuckTimer;

        const isActuallyStuck = !currentQuestion && !allDone && !isLoading && quizBank.length > 0;
        const showingPromotion = completedInLevelCount >= 10;

        if (isActuallyStuck && !showingPromotion) {
            console.warn("SQ-Quiz: Stalls detected. Sanitizing in 15s...");
            stuckTimer = setTimeout(() => {
                window.location.reload();
            }, 15000); 
        }

        return () => clearTimeout(stuckTimer); 
    }, [currentQuestion, allDone, isLoading, quizBank.length, completedInLevelCount, activeLevel]);

    // --- 1. GUEST CHECK (Keep this first) ---
    if (!currentUser) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 text-center relative overflow-hidden ${isDark ? 'bg-[#4F452B] text-cyan-50' : 'bg-[#E6D5B8]'}`}>
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
                    <Compass size={400} className="absolute -top-20 -left-20 text-brand-900 opacity-[0.03] -rotate-12" />
                    <Leaf size={300} className="absolute top-10 -right-10 text-brand-900 opacity-[0.03] rotate-45" />
                    <Waves size={350} className="absolute top-1/2 -left-20 text-brand-900 opacity-[0.02] -rotate-12" />
                    <Anchor size={300} className="absolute -bottom-10 -right-10 text-brand-900 opacity-[0.04] -rotate-45" />
                    <Bird size={200} className="absolute bottom-20 left-1/4 text-brand-900 opacity-[0.02] rotate-12" />
                </div>
                <div className={`p-10 rounded-[2.5rem] shadow-2xl max-w-sm border relative z-10 ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-white'}`}>
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-brand-600" size={40} />
                    </div>
                    <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>Locked Quest</h2>
                    <p className={`mb-8 font-medium leading-relaxed ${isDark ? 'text-cyan-100/90' : 'text-gray-600'}`}>Sri Lankan secrets are earned! Login to play the quiz and earn XP.</p>
                    <button onClick={() => setShowAuthModal(true)} className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg ${isDark ? 'bg-[#0f5c5c] hover:bg-[#125f5f] text-white' : 'bg-brand-600 text-white'}`}>Login to Play</button>
                    <button onClick={() => navigate('/')} className={`mt-4 font-bold block w-full text-center ${isDark ? 'text-cyan-200 hover:text-cyan-50' : 'text-gray-400 hover:text-brand-600'}`}>Maybe Later</button>
                </div>
            </div>
        );
    }

    if (allDone) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 text-center ${isDark ? 'bg-[#4F452B] text-cyan-50' : 'bg-brand-50'}`}>
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
                    <Compass size={400} className="absolute -top-20 -left-20 text-brand-900 opacity-[0.03] -rotate-12" />
                </div>
                <div className="max-w-md relative z-10">
                    <div className={`p-10 rounded-[2rem] shadow-2xl border-4 text-center ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-white'}`}>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="text-yellow-600" size={40} />
                        </div>
                        <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>Quiz Master!</h2>
                        <p className={`mb-8 font-medium ${isDark ? 'text-cyan-100/80' : 'text-gray-600'}`}>You've answered all available questions! Check back soon for more Sri Lankan secrets.</p>
                        <button onClick={() => navigate('/rewards')} className={`w-full text-white py-4 rounded-2xl font-black text-lg shadow-lg ${isDark ? 'bg-[#0f5c5c] hover:bg-[#125f5f]' : 'bg-brand-600'}`}>Go Redeem My XP</button>
                    </div>
                </div>
            </div>
        );
    }


    // --- 2. DYNAMIC LEVEL PROMOTION ---

    if (isCorrect === null && completedInLevelCount >= 10 && !allDone && currentUser) {
        
        if (activeLevel >= maxDefinedLevel) {
            return (
                <div className={`min-h-screen flex items-center justify-center px-4 text-center ${isDark ? 'bg-[#4F452B] text-cyan-50' : 'bg-[#E6D5B8]'}`}>
                    <div className={`p-10 rounded-[2.5rem] shadow-2xl max-w-sm border z-10 ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-white'}`}>
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-emerald-500" />
                        </div>
                        <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>Quiz Complete!</h2>
                        <p className={`mb-8 font-medium leading-relaxed ${isDark ? 'text-cyan-100/80' : 'text-gray-600'}`}>
                             You have mastered all {maxDefinedLevel} tiers of the SideQuest Quiz.
                        </p>
                        <button 
                            onClick={() => navigate('/rewards')} 
                            className={`w-full text-white py-4 rounded-2xl font-black text-lg shadow-lg ${isDark ? 'bg-[#0f5c5c] hover:bg-[#125f5f]' : 'bg-brand-600'}`}
                        >
                            View All Rewards
                        </button>
                    </div>
                </div>
            );
        }
        
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 text-center ${isDark ? 'bg-[#4F452B] text-cyan-50' : 'bg-[#E6D5B8]'}`}>
                <div className={`p-10 rounded-[2.5rem] shadow-2xl max-w-sm border z-10 ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-white'}`}>
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>Level {activeLevel} Complete!</h2>
                    <p className={`mb-8 font-medium leading-relaxed ${isDark ? 'text-cyan-100/80' : 'text-gray-600'}`}>
                         You've mastered this tier. Ready for Level {activeLevel + 1}? 
                    </p>
                    <button 
                             disabled={isPromoting}
                             onClick={async () => {
                           setIsPromoting(true);
                           const nextLevel = activeLevel + 1; 
                           await new Promise(r => setTimeout(r, 3000)); 
                           localStorage.setItem('sq_gate_unlocked', nextLevel.toString());
                            localStorage.setItem('sq_quiz_index', '0');
                            setActiveLevel(nextLevel);
                          window.location.reload();
                         }} 
                      className={`w-full ${isPromoting ? 'bg-gray-400' : (isDark ? 'bg-[#0f5c5c] hover:bg-[#125f5f]' : 'bg-brand-600')} text-white py-4 rounded-2xl font-black text-lg shadow-lg`}
                        >
                    {isPromoting ? "Saving XP..." : `Unlock Level ${activeLevel + 1}`}
                    </button>
                    </div>
                    </div>
                 );
             }

    if (isLoading || (quizBank.length > 0 && !currentQuestion && !allDone)) {
        return <div className={`min-h-screen ${isDark ? 'bg-[#4F452B]' : 'bg-[#E6D5B8]'}`} />;
    }

              return (
                <div className={`min-h-screen pb-20 pt-10 px-4 relative overflow-hidden ${isDark ? 'bg-[#4F452B] text-cyan-50' : 'bg-[#E6D5B8]'}`}>

            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">

            <Compass 
                size={400} 
                className="absolute -top-20 -left-20 text-brand-900 opacity-[0.03] -rotate-12" 
            />

            <Leaf 
                size={300} 
                className="absolute top-10 -right-10 text-brand-900 opacity-[0.03] rotate-45" 
            />

            <Waves 
                size={350} 
                className="absolute top-1/2 -left-20 text-brand-900 opacity-[0.02] -rotate-12" 
            />

            <Anchor 
                size={300} 
                className="absolute -bottom-10 -right-10 text-brand-900 opacity-[0.04] -rotate-45" 
            />

             <Bird 
                size={200} 
                className="absolute bottom-20 left-1/4 text-brand-900 opacity-[0.02] rotate-12" 
            />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
                
                {/* --- HEADER: XP PROGRESS --- */}
                <div className={`flex items-center justify-between mb-6 backdrop-blur-md p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-[#0d4b4b]/80 border-cyan-900/60' : 'bg-white/50 border-white/50'}`}>
                    <div className="flex items-center gap-3">
                    <div className="bg-brand-600 p-2 rounded-lg text-white shadow-lg">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${isDark ? 'text-cyan-200/80' : 'text-brand-700'}`}>
                      Level {activeLevel}
                      </p>
                    <p className={`text-2xl font-black transition-all duration-300 ${xpAnimate ? 'scale-125 text-emerald-500' : (isDark ? 'text-cyan-50' : 'text-gray-900')}`}>
                       {currentUser.xp} <span className="text-sm">XP</span>
                        </p>
                         </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                 <div>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>Progress</p>
              <p className={`text-lg font-black leading-none ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>
                 {Math.min(completedInLevelCount + 1, 10)} / 10
                </p>
          </div>
           {/* Small Header Bar */}
          <div className={`w-24 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-cyan-950/70' : 'bg-gray-200'}`}>
        <div 
            className="h-full bg-brand-600 transition-all duration-500" 
            style={{ width: `${(Math.min(completedInLevelCount + 1, 10) / 10) * 100}%` }}
               ></div>
                      </div>
            </div>
                </div>

                {/* --- THE QUIZ CARD --- */}
                <div className={`rounded-[2.5rem] shadow-2xl overflow-hidden border relative ${isDark ? 'bg-[#0d4b4b] border-cyan-900/60' : 'bg-white border-white'}`}>
                    
                    {/* Category Tab */}
                    <div className="bg-brand-600 text-white px-6 py-2 inline-block rounded-br-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                        {currentQuestion.category}
                    </div>

                    <div className="p-8 md:p-12">
                        <h2 className={`text-2xl md:text-3xl font-bold leading-tight mb-10 ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>
                            {currentQuestion.question}
                        </h2>

                        {/* MCQ Options Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedOption === index;
                                let btnClass = "w-full p-5 rounded-2xl text-left font-bold transition-all duration-200 border-2 flex items-center justify-between ";
                                
                                if (isCorrect === null) {
                                    btnClass += isSelected 
                                        ? (isDark
                                            ? "border-[#1e6b6b] bg-[#0f5c5c] text-cyan-50 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                                            : "border-brand-600 bg-brand-50 text-brand-700 shadow-md")
                                        : `${isDark ? 'border-cyan-900/50 bg-[#0a3a3a] text-cyan-100 hover:border-[#1e6b6b] hover:bg-[#0f4b4b]' : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-brand-200 hover:bg-white'}`;
                                } else {
                                    if (index === currentQuestion.correct_index) {
                                        btnClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
                                    } else if (isSelected && !isCorrect) {
                                        btnClass += "border-red-500 bg-red-50 text-red-700";
                                    } else {
                                        btnClass += "border-gray-50 bg-gray-50 text-gray-300 opacity-50";
                                    }
                                }

                                return (
                                    <button 
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={isCorrect !== null || isSubmitting}
                                        className={btnClass}
                                    >
                                        <span>{option}</span>
                                        {isCorrect !== null && index === currentQuestion.correct_index && (
                                            <Sparkles size={20} className="text-emerald-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* --- ACTIONS --- */}
                        <div className="mt-10 flex flex-col gap-4">
                            {isCorrect === null ? (
                                <button 
                                    onClick={() => setShowHint(!showHint)}
                                    className={`flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest hover:opacity-70 transition-opacity ${isDark ? 'text-cyan-200' : 'text-brand-600'}`}
                                >
                                    <HelpCircle size={18} />
                                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                                </button>
                            ) : (
                                <button 
                                    onClick={nextQuestion}
                                    className={`w-full text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center ${isDark ? 'bg-[#0f5c5c] hover:bg-[#125f5f]' : 'bg-gray-900 hover:bg-black'}`}
                                >
                                    {isCorrect ? 'Awesome! Next Question' : 'Try the Next One'}
                                    <ChevronRight className="ml-2" />
                                </button>
                            )}

                            {showHint && isCorrect === null && (
                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-yellow-800 text-sm italic animate-in fade-in slide-in-from-top-2">
                                    <span className="font-bold not-italic">Clue:</span> {currentQuestion.hint}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Graphic */}
                    <div className={`h-2 w-full ${isDark ? 'bg-cyan-950/60' : 'bg-gray-100'}`}>
                    <div 
                         className="h-full bg-brand-600 transition-all duration-500" 
                         style={{ width: `${(Math.min(completedInLevelCount + 1, 10) / 10) * 100}%` }}
                    ></div>
                    </div>
                </div>

                <div className="mt-12 min-h-[60px] flex flex-col items-center justify-center text-center px-6">
    <div className={`flex items-center justify-center gap-2 mb-2 ${isDark ? 'text-cyan-300/60' : 'text-brand-600/50'}`}>
        <Brain size={16} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expedition Wisdom</span>
    </div>
    
    {/* The key={quoteIdx} restart every 10 seconds */}
    <p 
        key={quoteIdx} 
        className={`font-medium text-sm italic leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-1000 max-w-sm ${isDark ? 'text-cyan-100/80' : 'text-gray-500'}`}
                      >
        "{EXPLORER_QUOTES[quoteIdx]}"
             </p>
            </div>
            </div>
        </div>
    );
};

export default Quiz;