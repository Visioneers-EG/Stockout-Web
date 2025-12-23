import React, { useState } from 'react';
import { Play, TrendingUp, Activity, Trophy } from 'lucide-react';
import LeaderboardModal from './LeaderboardModal';

const ScenarioCard = ({ title, description, difficulty, suppliers, icon: Icon, color, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-slate-800 border-2 border-slate-700 hover:border-${color}-500 hover:scale-105 transition-all cursor-pointer rounded-xl p-6 flex flex-col items-center text-center group`}
    >
        <div className={`bg-slate-900 p-4 rounded-full mb-4 group-hover:bg-${color}-900 transition-colors`}>
            <Icon size={32} className={`text-${color}-500`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className={`text-${color}-400 text-xs font-bold uppercase tracking-wider mb-2`}>{difficulty}</div>
        <div className="text-slate-500 text-xs mb-4">{suppliers} Suppliers</div>
        <p className="text-slate-400 text-sm">{description}</p>
    </div>
);

const StartScreen = ({ onSelectScenario }) => {
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const scenarios = [
        {
            id: 'simple',
            title: 'The Trainee',
            difficulty: 'Easy',
            suppliers: 2,
            description: 'Steady demand. Perfect for learning the ropes. Low risk, low stress.',
            icon: Play,
            color: 'green'
        },
        {
            id: 'moderate',
            title: 'Market Shift',
            difficulty: 'Medium',
            suppliers: 3,
            description: 'Unpredictable demand with 3 suppliers to manage. Choose wisely.',
            icon: TrendingUp,
            color: 'blue'
        },
        {
            id: 'complex',
            title: 'Peak Season',
            difficulty: 'Hard',
            suppliers: 4,
            description: 'Seasonal demand waves with 4 suppliers. Can you beat the AI?',
            icon: Activity,
            color: 'amber'
        }
    ];

    return (
        <div className="min-h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-4xl w-full">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Pharma Tycoon
                </h1>
                <p className="text-center text-slate-400 mb-8 text-lg">
                    Manage inventory, minimize costs, and beat the AI.
                </p>

                {/* Leaderboard Button */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-full shadow-lg transition-all hover:scale-105"
                    >
                        <Trophy size={20} />
                        View Leaderboard
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {scenarios.map((s) => (
                        <ScenarioCard
                            key={s.id}
                            {...s}
                            onClick={() => onSelectScenario(s.id)}
                        />
                    ))}
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
