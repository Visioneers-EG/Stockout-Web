import React, { useState } from 'react';
import { Package, TrendingDown, AlertTriangle, ChevronRight, ChevronLeft, X, Sparkles, DollarSign, Zap } from 'lucide-react';
import useSoundEffects from '../hooks/useSoundEffects';

const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome!',
        icon: Sparkles,
        iconColor: 'text-yellow-400',
        content: 'Manage a pharmacy, keep customers happy, minimize costs. Beat the AI!',
        tip: 'Lower total cost = you win!',
    },
    {
        id: 'basics',
        title: 'The Basics',
        icon: Package,
        iconColor: 'text-emerald-400',
        content: 'Medicine expires in 5 days. Order from suppliers using + / − buttons. Balance speed vs. cost.',
        tip: 'Fast = expensive. Slow = cheap. Check the pipeline for incoming orders.',
    },
    {
        id: 'costs',
        title: 'Costs',
        icon: DollarSign,
        iconColor: 'text-amber-400',
        content: 'You pay for: storing inventory, missed sales (stockouts), and spoiled medicine.',
        tip: 'Too much stock = spoilage. Too little = angry customers!',
    },
    {
        id: 'events',
        title: 'Market Events',
        icon: Zap,
        iconColor: 'text-red-400',
        content: 'Watch out for 📈 Demand Surges (2x demand) and 📉 Slumps (0.5x demand). These happen randomly!',
        tip: 'Events show an "end chance" that increases each turn. Prepare before they hit!',
    },
    {
        id: 'goal',
        title: 'Your Goal',
        icon: TrendingDown,
        iconColor: 'text-emerald-400',
        content: 'Complete all turns. Green = beating AI. Can you finish with the lowest cost?',
        tip: 'The AI plays without events - can you beat it despite the challenges?',
    },
];

const TutorialScreen = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { nextStep, confirm, click } = useSoundEffects();
    const step = TUTORIAL_STEPS[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            confirm();
            onComplete();
        } else {
            nextStep();
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            nextStep();
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        click();
        onSkip();
    };

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

            {/* Skip Button */}
            <button
                onClick={handleSkip}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm font-medium bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1.5 rounded-lg"
            >
                <span>Skip Tutorial</span>
                <X size={16} />
            </button>

            {/* Progress Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                {TUTORIAL_STEPS.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${i === currentStep
                            ? 'bg-emerald-500 scale-125'
                            : i < currentStep
                                ? 'bg-emerald-500/50'
                                : 'bg-slate-700'
                            }`}
                    />
                ))}
            </div>

            {/* Main Content Card */}
            <div className="relative z-10 max-w-lg w-full">
                <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">

                    {/* Icon */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-600 ${step.iconColor}`}>
                            <Icon size={40} className="sm:hidden" />
                            <Icon size={56} className="hidden sm:block" />
                        </div>
                    </div>

                    {/* Step Counter */}
                    <div className="text-center text-slate-500 text-xs sm:text-sm font-mono mb-2">
                        Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-center text-white mb-4 sm:mb-6">
                        {step.title}
                    </h2>

                    {/* Content */}
                    <p className="text-slate-300 text-center text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6">
                        {step.content}
                    </p>

                    {/* Tip Box */}
                    <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                            <p className="text-amber-200/80 text-xs sm:text-sm">
                                <span className="font-bold text-amber-300">Pro Tip:</span> {step.tip}
                            </p>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 sm:gap-4">
                        {!isFirstStep && (
                            <button
                                onClick={handlePrev}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 sm:py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={20} />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className={`flex-1 font-black py-3 sm:py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${isLastStep
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white'
                                }`}
                        >
                            <span>{isLastStep ? "Let's Play!" : 'Next'}</span>
                            {isLastStep ? <Sparkles size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>
        </div>
    );
};

export default TutorialScreen;
