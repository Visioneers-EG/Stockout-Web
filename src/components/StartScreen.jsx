import React, { useState } from 'react';
import { Play, TrendingUp, Activity, Trophy, Sparkles, Zap } from 'lucide-react';
import LeaderboardModal from './LeaderboardModal';
import useSoundEffects from '../hooks/useSoundEffects';

const ScenarioCard = ({ title, description, difficulty, suppliers, icon: Icon, colorClasses, onClick, playSound }) => {
    return (
        <div
            onClick={() => { playSound(); onClick(); }}
            className={`
                relative overflow-hidden
                bg-gradient-to-br from-slate-800 to-slate-900 
                border-2 border-slate-700 
                hover:border-opacity-100 hover:scale-[1.02] sm:hover:scale-105 
                hover:shadow-2xl
                transition-all duration-300 cursor-pointer 
                rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 
                flex flex-col items-center text-center group
            `}
            style={{ borderColor: colorClasses.borderHover }}
        >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.glowGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>

            {/* Icon Container */}
            <div className={`relative z-10 ${colorClasses.iconBg} p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <Icon size={24} className={`sm:hidden ${colorClasses.iconColor}`} />
                <Icon size={32} className={`hidden sm:block lg:hidden ${colorClasses.iconColor}`} />
                <Icon size={36} className={`hidden lg:block ${colorClasses.iconColor}`} />

                <Sparkles size={10} className={`sm:hidden absolute -top-0.5 -right-0.5 ${colorClasses.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <Sparkles size={14} className={`hidden sm:block absolute -top-1 -right-1 ${colorClasses.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>

            <h3 className="relative z-10 text-base sm:text-lg lg:text-xl font-black text-white mb-1.5 sm:mb-2 tracking-wide">{title}</h3>

            <div className={`relative z-10 ${colorClasses.badgeClasses} px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 sm:mb-3`}>
                {difficulty}
            </div>

            <div className="relative z-10 text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1">
                <span className="font-mono font-bold text-white">{suppliers}</span> Suppliers
            </div>

            <p className="relative z-10 text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">{description}</p>

            {/* Play indicator */}
            <div className={`mt-3 sm:mt-4 ${colorClasses.playBtn} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <Zap size={12} className="sm:hidden" />
                <Zap size={14} className="hidden sm:block" />
                <span>PLAY</span>
            </div>
        </div>
    );
};

const StartScreen = ({ onSelectScenario }) => {
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const { click } = useSoundEffects();

    const scenarios = [
        {
            id: 'simple',
            title: 'The Trainee',
            difficulty: 'Easy',
            suppliers: 2,
            description: 'Steady demand. Perfect for learning the ropes.',
            icon: Play,
            colorClasses: {
                iconBg: 'bg-gradient-to-br from-green-600 to-emerald-700',
                iconColor: 'text-green-300',
                badgeClasses: 'bg-green-900/50 text-green-400 border border-green-500/50',
                glowGradient: 'from-green-500 to-emerald-600',
                playBtn: 'bg-green-600 text-white',
                borderHover: 'rgb(34, 197, 94)'
            }
        },
        {
            id: 'moderate',
            title: 'Market Shift',
            difficulty: 'Medium',
            suppliers: 3,
            description: 'Unpredictable demand with 3 suppliers to manage.',
            icon: TrendingUp,
            colorClasses: {
                iconBg: 'bg-gradient-to-br from-blue-600 to-blue-800',
                iconColor: 'text-blue-300',
                badgeClasses: 'bg-blue-900/50 text-blue-400 border border-blue-500/50',
                glowGradient: 'from-blue-500 to-cyan-600',
                playBtn: 'bg-blue-600 text-white',
                borderHover: 'rgb(59, 130, 246)'
            }
        },
        {
            id: 'complex',
            title: 'Peak Season',
            difficulty: 'Hard',
            suppliers: 4,
            description: 'Seasonal demand waves. Can you beat the AI?',
            icon: Activity,
            colorClasses: {
                iconBg: 'bg-gradient-to-br from-amber-500 to-orange-700',
                iconColor: 'text-amber-300',
                badgeClasses: 'bg-amber-900/50 text-amber-400 border border-amber-500/50',
                glowGradient: 'from-amber-500 to-orange-600',
                playBtn: 'bg-amber-600 text-white',
                borderHover: 'rgb(245, 158, 11)'
            }
        }
    ];

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

            <div className="max-w-4xl w-full relative z-10">
                {/* Title with glow effect */}
                <div className="text-center mb-1.5 sm:mb-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 drop-shadow-lg">
                        STOCKOUT
                    </h1>
                    <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-slate-500 font-mono tracking-widest mt-1 sm:mt-2">SUPPLY CHAIN COMMANDER</div>
                </div>

                <p className="text-center text-slate-400 mb-6 sm:mb-8 lg:mb-10 text-sm sm:text-base lg:text-lg flex items-center justify-center gap-1.5 sm:gap-2">
                    <Sparkles className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Manage inventory, minimize costs, and beat the AI.</span>
                    <span className="sm:hidden">Beat the AI!</span>
                    <Sparkles className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                </p>

                {/* Leaderboard Button */}
                <div className="flex justify-center mb-6 sm:mb-8 lg:mb-10">
                    <button
                        onClick={() => { click(); setShowLeaderboard(true); }}
                        className="flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-gradient-to-b from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black rounded-lg sm:rounded-xl shadow-[0_4px_0_#b45309] sm:shadow-[0_6px_0_#b45309] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[6px] transition-all text-sm sm:text-base lg:text-lg"
                    >
                        <Trophy size={18} className="sm:hidden" />
                        <Trophy size={24} className="hidden sm:block" />
                        <span className="hidden sm:inline">View Leaderboard</span>
                        <span className="sm:hidden">Leaderboard</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {scenarios.map((s) => (
                        <ScenarioCard
                            key={s.id}
                            {...s}
                            onClick={() => onSelectScenario(s.id)}
                            playSound={click}
                        />
                    ))}
                </div>

                {/* Instructions hint */}
                <div className="text-center mt-6 sm:mt-8 lg:mt-10 text-slate-600 text-xs sm:text-sm">
                    <span className="bg-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-700">
                        👆 <span className="hidden sm:inline">Click a scenario to start playing</span><span className="sm:hidden">Tap to play</span>
                    </span>
                </div>
            </div>

            <LeaderboardModal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
            />
        </div>
    );
};

export default StartScreen;
