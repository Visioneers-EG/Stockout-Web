import React, { useState, useEffect } from 'react';
import { Trophy, X, RefreshCw } from 'lucide-react';
import { fetchLeaderboard } from '../services/leaderboard';

const LeaderboardModal = ({ isOpen, onClose, defaultTab = 'all' }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(defaultTab);

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'simple', label: 'Easy' },
        { id: 'moderate', label: 'Medium' },
        { id: 'complex', label: 'Hard' }
    ];

    const loadLeaderboard = async () => {
        setLoading(true);
        const data = await fetchLeaderboard(activeTab);
        setEntries(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab);
        }
    }, [isOpen, defaultTab]);

    useEffect(() => {
        if (isOpen) {
            loadLeaderboard();
        }
    }, [isOpen, activeTab]);

    if (!isOpen) return null;

    const getRankStyle = (rank) => {
        switch (rank) {
            case 1:
                return { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-400' };
            case 2:
                return { bg: 'bg-slate-700/50', border: 'border-slate-500', text: 'text-slate-300' };
            case 3:
                return { bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-500' };
            default:
                return { bg: 'bg-slate-800/50', border: 'border-slate-700', text: 'text-slate-400' };
        }
    };

    const getScenarioLabel = (scenario) => {
        switch (scenario) {
            case 'simple': return 'Easy';
            case 'moderate': return 'Medium';
            case 'complex': return 'Hard';
            default: return scenario;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        <h2 className="text-lg font-bold text-white">Leaderboard</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 text-xs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 font-bold transition-colors ${activeTab === tab.id
                                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                                    : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No scores yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {entries.map((entry, index) => {
                                const style = getRankStyle(entry.rank);
                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-2 rounded-lg border ${style.bg} ${style.border}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs ${style.text}`}>
                                            {entry.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white text-sm truncate">{entry.name}</div>
                                            <div className="text-[10px] text-slate-500">
                                                {getScenarioLabel(entry.scenario)}
                                                {entry.beatAI && <span className="ml-1 text-green-500">★</span>}
                                            </div>
                                        </div>
                                        <div className="font-mono font-bold text-emerald-400 text-sm">${entry.score}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
