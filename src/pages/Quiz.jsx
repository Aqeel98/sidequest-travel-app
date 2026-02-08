import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, HelpCircle, Zap, Sparkles, ChevronRight, 
  RotateCcw, Brain, MapPin, Award , Lock
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

    useEffect(() => {
    
        if (quizBank.length > 0 && availableQuestions.length === 0) {
            const snapshot = quizBank.filter(q => !completedQuizIds.includes(q.id));
            setAvailableQuestions(snapshot);
        }
    }, [quizBank, completedQuizIds]); 

    const currentQuestion = availableQuestions[currentIndex];
    

    // Scroll to top on load
    useEffect(() => { window.scrollTo(0, 0); }, []);

    const handleAnswer = async (index) => {
        if (isSubmitting || isCorrect !== null) return;
        
        setSelectedOption(index);
        setIsSubmitting(true);

        const result = await submitQuizAnswer(currentQuestion.id, index);
        
        if (result.success) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
        }
        setIsSubmitting(false);
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
            setAvailableQuestions([]); 
            setCurrentIndex(0);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-[#E6D5B8] flex items-center justify-center px-4 text-center">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm border border-white">
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-brand-600" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">Locked Quest</h2>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                        Sri Lankan secrets are earned! Login to play the quiz, earn XP, and unlock real-world rewards.
                    </p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => setShowAuthModal(true)} 
                            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-brand-100"
                        >
                            Login to Play
                        </button>
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (availableQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 text-center">
                <div className="max-w-md">
                    <div className="bg-white p-10 rounded-[2rem] shadow-2xl border-4 border-white">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="text-yellow-600" size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Quiz Master!</h2>
                        <p className="text-gray-600 mb-8 font-medium">
                            You've answered all available questions! Check back soon as we add more Sri Lankan secrets to the map.
                        </p>
                        <button 
                            onClick={() => navigate('/rewards')} 
                            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-brand-100 flex items-center justify-center group"
                        >
                            Go Redeem My XP <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E6D5B8] pb-20 pt-10 px-4">
            <div className="max-w-2xl mx-auto">
                
                {/* --- HEADER: XP PROGRESS --- */}
                <div className="flex items-center justify-between mb-6 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-600 p-2 rounded-lg text-white shadow-lg">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Your Impact</p>
                            <p className="text-lg font-black text-gray-900 leading-none">{currentUser.xp} XP</p>
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

                {/* --- FUN TIP --- */}
                <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 font-medium text-sm italic text-center">
                    <Brain size={16} />
                    Did you know? SideQuest quizzes help you discover hidden spots on the map.
                </div>
            </div>
        </div>
    );
};

export default Quiz;