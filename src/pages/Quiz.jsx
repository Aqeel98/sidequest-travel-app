import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, HelpCircle, Zap, Sparkles, ChevronRight, 
  RotateCcw, Brain, MapPin, Award , Lock, Compass, Leaf, Waves, Anchor, Bird, CheckCircle
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';

const Quiz = () => {


    const navigate = useNavigate();
    const { currentUser, quizBank, completedQuizIds, submitQuizAnswer, showToast, setShowAuthModal } = useSideQuest(); 

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null); // null, true, false
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [xpAnimate, setXpAnimate] = useState(false);
    const [level2Started, setLevel2Started] = useState(localStorage.getItem('sq_l2_start') === 'true');


    const level1RemainingCount = useMemo(() => {
        if (!quizBank.length) return 0;
        return quizBank.filter(q => q.level === 1 && !completedQuizIds.includes(q.id)).length;
    }, [quizBank, completedQuizIds]);

    const userLevel = useMemo(() => {
        if (quizBank.length === 0) return 1;
        return (level1RemainingCount === 0) ? 2 : 1;
    }, [quizBank, level1RemainingCount]);

    const isLevel1Finished = useMemo(() => {
        const hasLevel1Content = quizBank.some(q => q.level === 1);
        return hasLevel1Content && level1RemainingCount === 0;
    }, [quizBank, level1RemainingCount]);

    useEffect(() => {

        if (quizBank.length > 0 && availableQuestions.length === 0) {

            const snapshot = quizBank.filter(q => 
                q.level === userLevel && 
                !completedQuizIds.includes(q.id)
            );

            if (snapshot.length > 0) {
                const shuffled = [...snapshot];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                
                setAvailableQuestions(shuffled);

                if (currentIndex >= shuffled.length) {
                    setCurrentIndex(0);
                    localStorage.setItem('sq_quiz_index', '0');
                }
            }
        }

    }, [quizBank, userLevel, completedQuizIds]);

    const currentQuestion = availableQuestions[currentIndex];
    

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
"The Yoda Ela canal moves water by mere inches, yet it nourishes entire kingdoms. Great change begins with small, steady steps.",
"Every destination is a mirror. What you find in the island is a reflection of what you bring within you.",
"The most beautiful view in Sri Lanka isn't a mountain or a beach; it's the smile of a stranger you've truly helped.",
"A rainforest takes centuries to grow and a moment to disappear. Be the shield that protects the emerald silence.",
"Even the hardest granite was once shaped by the hands of dreamers. Your actions today are the carvings of tomorrow.",
"In a world of fast travel, be the one who lingers. The island reveals its secrets only to those who stop to listen.",
"Take more than memories; take inspiration. Leave more than footprints; leave an impact.",
"One island, thousands of stories. You are not just a visitor; you are a character in its unfolding history."
];

const [quoteIdx, setQuoteIdx] = useState(0);

// --- ROTATION ENGINE (10 SECONDS) ---
useEffect(() => {
    const interval = setInterval(() => {
        setQuoteIdx((prev) => (prev + 1) % EXPLORER_QUOTES.length);
    }, 10000);
    return () => clearInterval(interval); // Clean up on tab switch
}, []);

    // Scroll to top on load
    useEffect(() => { window.scrollTo(0, 0); }, []);

    const handleAnswer = (index) => {
        if (isCorrect !== null) return; 
        
        setSelectedOption(index);

        const isCorrectLocal = index === currentQuestion.correct_index;
        
        if (isCorrectLocal) {
            setIsCorrect(true);
            setXpAnimate(true);
            setTimeout(() => setXpAnimate(false), 600);
        } else {
            setIsCorrect(false);
        }

        submitQuizAnswer(currentQuestion.id, index, isCorrectLocal, currentQuestion.xp_reward);
    };


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

    const nextQuestion = () => {
        setSelectedOption(null);
        setIsCorrect(null);
        setShowHint(false);
        
        if (currentIndex < availableQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {

            localStorage.removeItem('sq_quiz_index');

            const hasMoreInLevel = quizBank.some(q => 
                q.level === userLevel && !completedQuizIds.includes(q.id)
            );

            if (hasMoreInLevel) {
                setAvailableQuestions([]); 
                setCurrentIndex(0);
            } else {

                console.log("SQ-Quiz: Level batch complete. Transitioning UI...");
            }
        }
    };


    // --- 1. GUEST CHECK (Keep this first) ---
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-[#E6D5B8] flex items-center justify-center px-4 text-center relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
                    <Compass size={400} className="absolute -top-20 -left-20 text-brand-900 opacity-[0.03] -rotate-12" />
                    <Leaf size={300} className="absolute top-10 -right-10 text-brand-900 opacity-[0.03] rotate-45" />
                    <Waves size={350} className="absolute top-1/2 -left-20 text-brand-900 opacity-[0.02] -rotate-12" />
                    <Anchor size={300} className="absolute -bottom-10 -right-10 text-brand-900 opacity-[0.04] -rotate-45" />
                    <Bird size={200} className="absolute bottom-20 left-1/4 text-brand-900 opacity-[0.02] rotate-12" />
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm border border-white relative z-10">
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-brand-600" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">Locked Quest</h2>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">Sri Lankan secrets are earned! Login to play the quiz and earn XP.</p>
                    <button onClick={() => setShowAuthModal(true)} className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg">Login to Play</button>
                    <button onClick={() => navigate('/')} className="mt-4 text-gray-400 font-bold hover:text-brand-600 block w-full text-center">Maybe Later</button>
                </div>
            </div>
        );
    }

    // --- 2. LEVEL 1 COMPLETE PROMOTION (Show this when L1 is done but L2 hasn't started) ---
    if (isLevel1Finished && !level2Started) {
        return (
            <div className="min-h-screen bg-[#E6D5B8] flex items-center justify-center px-4 text-center relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
                    <Compass size={400} className="absolute -top-20 -left-20 text-brand-900 opacity-[0.03] -rotate-12" />
                    <Sparkles size={300} className="absolute top-1/2 -right-10 text-brand-900 opacity-[0.03] rotate-45" />
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm border border-white relative z-10">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">Level 1 Complete!</h2>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                        Excellent work! You've mastered the basics. Are you ready for the Expert Level? 
                    </p>
                    <button 
                        onClick={() => {
                            localStorage.setItem('sq_l2_start', 'true');
                            localStorage.removeItem('sq_quiz_index');
                            setLevel2Started(true);
                            setCurrentIndex(0);
                            setAvailableQuestions([]); 
                        }} 
                        className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg"
                    >
                        Unlock Level 2
                    </button>
                </div>
            </div>
        );
    }

    // --- 3. FINAL TROPHY CHECK  ---
    const allDone = useMemo(() => {
        if (quizBank.length === 0) return false;
        // If we are on Level 2 and no questions are left in the whole bank
        const remainingInGame = quizBank.filter(q => !completedQuizIds.includes(q.id)).length;
        return remainingInGame === 0;
    }, [quizBank, completedQuizIds]);

    if (allDone) {
        return (
            <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 text-center">
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
                    <Compass size={400} className="absolute -top-20 -left-20 text-brand-900 opacity-[0.03] -rotate-12" />
                </div>
                <div className="max-w-md relative z-10">
                    <div className="bg-white p-10 rounded-[2rem] shadow-2xl border-4 border-white text-center">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="text-yellow-600" size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Quiz Master!</h2>
                        <p className="text-gray-600 mb-8 font-medium">You've answered all available questions! Check back soon for more Sri Lankan secrets.</p>
                        <button onClick={() => navigate('/rewards')} className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg">Go Redeem My XP</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-[#E6D5B8] flex items-center justify-center">
                <div className="relative">
                    {/* A subtle spinning compass for the background */}
                    <Compass size={60} className="text-brand-700/20 animate-spin-slow" />
                    {/* A pulsing spark in the middle to show life */}
                    <Sparkles size={24} className="text-brand-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E6D5B8] pb-20 pt-10 px-4 relative overflow-hidden">

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
                <div className="flex items-center justify-between mb-6 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-600 p-2 rounded-lg text-white shadow-lg">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                    <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest leading-none mb-1">Your Impact</p>
                     <p className={`text-2xl font-black transition-all duration-300 ${
                        xpAnimate ? 'scale-125 text-emerald-500' : 'text-gray-900'
                            }`}>
                     {currentUser.xp} <span className="text-sm">XP</span>
                     </p>
                    </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Progress</p>
                        <p className="text-lg font-black text-gray-900 leading-none">{currentIndex + 1} / {availableQuestions.length}</p>
                    </div>
                </div>

                {/* --- THE QUIZ CARD --- */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white relative">
                    
                    {/* Category Tab */}
                    <div className="bg-brand-600 text-white px-6 py-2 inline-block rounded-br-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                        {currentQuestion.category}
                    </div>

                    <div className="p-8 md:p-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-10">
                            {currentQuestion.question}
                        </h2>

                        {/* MCQ Options Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedOption === index;
                                let btnClass = "w-full p-5 rounded-2xl text-left font-bold transition-all duration-200 border-2 flex items-center justify-between ";
                                
                                if (isCorrect === null) {
                                    btnClass += isSelected 
                                        ? "border-brand-600 bg-brand-50 text-brand-700 shadow-md" 
                                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-brand-200 hover:bg-white";
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
                                    className="flex items-center justify-center gap-2 text-sm font-black text-brand-600 uppercase tracking-widest hover:opacity-70 transition-opacity"
                                >
                                    <HelpCircle size={18} />
                                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                                </button>
                            ) : (
                                <button 
                                    onClick={nextQuestion}
                                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center"
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
                    <div className="h-2 bg-gray-100 w-full">
                        <div 
                            className="h-full bg-brand-600 transition-all duration-500" 
                            style={{ width: `${((currentIndex + 1) / availableQuestions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mt-12 min-h-[60px] flex flex-col items-center justify-center text-center px-6">
    <div className="flex items-center justify-center gap-2 text-brand-600/50 mb-2">
        <Brain size={16} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expedition Wisdom</span>
    </div>
    
    {/* The key={quoteIdx} restart every 10 seconds */}
    <p 
        key={quoteIdx} 
        className="text-gray-500 font-medium text-sm italic leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-1000 max-w-sm"
                      >
        "{EXPLORER_QUOTES[quoteIdx]}"
             </p>
            </div>
            </div>
        </div>
    );
};

export default Quiz;