import React, { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchLeaderboard } from '../services/leaderboard';

const LeaderboardScreen = ({ onBack }) => {
    const [allLeaderboards, setAllLeaderboards] = useState({
        simple: [],
        moderate: [],
        complex: []
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const loadAllLeaderboards = async () => {
        // Fetch individually to ensure we get proper data for each
        const [simple, moderate, complex] = await Promise.all([
            fetchLeaderboard('simple'),
            fetchLeaderboard('moderate'),
            fetchLeaderboard('complex')
        ]);

        const processRanks = (data) => {
            const processedData = [];
            for (let i = 0; i < data.length; i++) {
                let rank = i + 1;
                if (i > 0 && Math.abs(data[i].score - data[i - 1].score) < 0.01) {
                    rank = processedData[i - 1].rank;
                }
                processedData.push({ ...data[i], rank });
            }
            return processedData;
        };

        setAllLeaderboards({
            simple: processRanks(simple),
            moderate: processRanks(moderate),
            complex: processRanks(complex)
        });

        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        loadAllLeaderboards();

        // Poll every 5 seconds
        const interval = setInterval(() => {
            loadAllLeaderboards();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getRankStyle = (rank) => {
        switch (rank) {
            case 1:
                return { bg: 'bg-yellow-900/40', border: 'border-yellow-600', text: 'text-yellow-400' };
            case 2:
                return { bg: 'bg-slate-600/40', border: 'border-slate-400', text: 'text-slate-300' };
            case 3:
                return { bg: 'bg-amber-900/40', border: 'border-amber-700', text: 'text-amber-500' };
            default:
                return { bg: 'bg-slate-800/40', border: 'border-slate-700', text: 'text-slate-400' };
        }
    };

    const renderColumn = (title, data, iconColor) => (
        <div className="flex-1 min-w-[300px] flex flex-col bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden shadow-xl backdrop-blur-sm">
            <div className={`p-4 border-b border-slate-700 flex items-center gap-2 bg-gradient-to-r ${title === 'Easy' ? 'from-emerald-900/20' : title === 'Medium' ? 'from-yellow-900/20' : 'from-red-900/20'} to-transparent`}>
                <Trophy size={18} className={iconColor} />
                <h3 className="font-black text-lg text-white uppercase tracking-wider">{title}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {data.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm italic">
                        No champions yet.
                    </div>
                ) : (
                    data.map((entry, index) => {
                        const style = getRankStyle(entry.rank);
                        return (
                            <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${style.bg} ${style.border}`}>
                                <div className={`w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center font-black text-sm ${style.text} shadow-inner`}>
                                    {entry.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white truncate text-sm sm:text-base">{entry.name}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                        {new Date(entry.date).toLocaleDateString()}
                                        {entry.beatAI && <span className="text-emerald-500 font-bold" title="Beat AI">★ AI Defeated</span>}
                                    </div>
                                </div>
                                <div className="font-mono font-black text-emerald-400 text-base sm:text-lg">
                                    ${entry.score.toFixed(2)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 bg-slate-900/90 border-b border-slate-800 p-4 sm:p-6 shadow-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white group"
                        title="Back to Menu"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 flex items-center gap-3">
                            <Trophy className="text-yellow-400" />
                            HALL OF FAME
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">Live updates every 5s • Last updated: {lastUpdated.toLocaleTimeString()}</p>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Updating...</span>
                    </div>
                )}
            </div>

            {/* Leaderboards Grid */}
            <div className="relative z-10 flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-6 h-full min-w-full lg:min-w-0">
                    {renderColumn('Easy', allLeaderboards.simple, 'text-emerald-400')}
                    {renderColumn('Medium', allLeaderboards.moderate, 'text-yellow-400')}
                    {renderColumn('Hard', allLeaderboards.complex, 'text-red-400')}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardScreen;
