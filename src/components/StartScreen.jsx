import React from 'react';
import { Play, TrendingUp, Activity, Zap } from 'lucide-react';

const ScenarioCard = ({ title, description, difficulty, icon: Icon, color, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-slate-800 border-2 border-slate-700 hover:border-${color}-500 hover:scale-105 transition-all cursor-pointer rounded-xl p-6 flex flex-col items-center text-center group`}
    >
        <div className={`bg-slate-900 p-4 rounded-full mb-4 group-hover:bg-${color}-900 transition-colors`}>
            <Icon size={32} className={`text-${color}-500`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className={`text-${color}-400 text-xs font-bold uppercase tracking-wider mb-4`}>{difficulty}</div>
        <p className="text-slate-400 text-sm">{description}</p>
    </div>
);

const StartScreen = ({ onSelectScenario }) => {
    const scenarios = [
        {
            id: 'simple',
            title: 'The Trainee',
            difficulty: 'Simple',
            description: 'Steady demand. Perfect for learning the ropes. Low risk, low stress.',
            icon: Play,
            color: 'green'
        },
        {
            id: 'moderate',
            title: 'Market Shift',
            difficulty: 'Moderate',
            description: 'Demand is unpredictable. Customers are fickle. Watch your inventory closely.',
            icon: TrendingUp,
            color: 'blue'
        },
        {
            id: 'complex',
            title: 'Peak Season',
            difficulty: 'Complex',
            description: 'High volume. Sustained demand pressure. Mistakes are costly.',
            icon: Activity,
            color: 'amber'
        },
        {
            id: 'extreme',
            title: 'Pandemic Panic',
            difficulty: 'Extreme',
            description: 'Massive demand spikes. Supply chain chaos. Can you survive without stockouts?',
            icon: Zap,
            color: 'red'
        }
    ];

    return (
        <div className="min-h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-5xl w-full">
                <h1 className="text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Pharma Tycoon
                </h1>
                <p className="text-center text-slate-400 mb-12 text-lg">
                    Manage inventory, minimize costs, and beat the AI.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {scenarios.map((s) => (
                        <ScenarioCard
                            key={s.id}
                            {...s}
                            onClick={() => onSelectScenario(s.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StartScreen;
