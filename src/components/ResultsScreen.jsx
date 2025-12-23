import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, AlertTriangle, RotateCcw, Send, CheckCircle, RefreshCw } from 'lucide-react';
import { submitScore, fetchLeaderboard } from '../services/leaderboard';

const ResultsScreen = ({ userHistory, rlTrace, onRestart, scenario }) => {
    const [playerName, setPlayerName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

    const currentScenario = rlTrace?.metadata?.scenario || scenario || 'simple';

    // Load leaderboard on mount
    useEffect(() => {
        loadLeaderboard();
    }, [currentScenario]);

    const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        const data = await fetchLeaderboard(currentScenario);
        setLeaderboard(data);
        setLoadingLeaderboard(false);
    };

    // calculate metrics
    const calculateTotalCost = (turns) => turns.reduce((sum, t) => sum + t.cost, 0);
    const calculateFillRate = (turns) => {
        const totalDemand = turns.reduce((sum, t) => sum + t.demand, 0);
        const totalSales = turns.reduce((sum, t) => sum + t.sales, 0);
        return totalDemand > 0 ? (totalSales / totalDemand) * 100 : 100;
    };
    const calculateSpoilage = (turns) => turns.reduce((sum, t) => sum + t.spoilage, 0);

    // User Stats
    const userTotalCost = calculateTotalCost(userHistory);
    const userFillRate = calculateFillRate(userHistory);
    const userSpoilage = calculateSpoilage(userHistory);

    // RL Stats (from trace)
    const rlTurns = rlTrace.turns.slice(0, userHistory.length).map(t => ({
        cost: t.environment_outcome.cost,
        demand: t.environment_outcome.demand,
        sales: t.environment_outcome.sales,
        spoilage: t.environment_outcome.spoilage
    }));

    const rlTotalCost = calculateTotalCost(rlTurns);
    const rlFillRate = calculateFillRate(rlTurns);
    const rlSpoilage = calculateSpoilage(rlTurns);

    // Prepare Chart Data
    const chartData = userHistory.map((h, i) => ({
        turn: i + 1,
        UserCost: h.cost,
        RLCost: rlTurns[i]?.cost || 0
    }));

    const betterThanRL = userTotalCost < rlTotalCost;

    const handleSubmitScore = async () => {
        if (!playerName.trim()) return;

        setSubmitting(true);
        await submitScore(playerName.trim(), currentScenario, userTotalCost, betterThanRL);
        setSubmitted(true);
        setSubmitting(false);
        // Reload leaderboard after submission
        loadLeaderboard();
    };

    const getScenarioLabel = (s) => {
        switch (s) {
            case 'simple': return 'Easy';
            case 'moderate': return 'Medium';
            case 'complex': return 'Hard';
            default: return s;
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 text-white overflow-y-auto overflow-x-hidden p-4 md:p-6 flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-amber-500 text-center shrink-0">SIMULATION COMPLETE</h1>

            <div className="flex-1 w-full max-w-6xl flex flex-col gap-4">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
                    {/* Main Scorecard */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
                        <div className="text-sm text-slate-400 mb-2">You vs AI</div>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl md:text-4xl font-bold text-white">${userTotalCost.toFixed(2)}</span>
                        </div>

                        <div className="text-xs text-slate-400 mb-4">
                            AI: <span className="text-white font-mono">${rlTotalCost.toFixed(2)}</span>
                        </div>

                        {betterThanRL ? (
                            <div className="bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm">
                                <Trophy size={16} /> YOU BEAT THE AI!
                            </div>
                        ) : (
                            <div className="bg-amber-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm">
                                <AlertTriangle size={16} /> AI Wins
                            </div>
                        )}
                    </div>

                    {/* Submit Score */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-400 mb-3">Submit Score</h3>

                        {submitted ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <CheckCircle className="text-green-400 mb-2" size={32} />
                                <p className="text-green-400 font-bold text-sm">Submitted!</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Your name..."
                                    maxLength={20}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none mb-2"
                                />
                                <button
                                    onClick={handleSubmitScore}
                                    disabled={!playerName.trim() || submitting}
                                    className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${playerName.trim() && !submitting
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={14} /> Submit
                                </button>
                            </>
                        )}
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-400" />
                                {getScenarioLabel(currentScenario)} Leaderboard
                            </h3>
                            <button onClick={loadLeaderboard} className="text-slate-500 hover:text-white">
                                <RefreshCw size={12} className={loadingLeaderboard ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loadingLeaderboard ? (
                            <div className="flex-1 flex items-center justify-center">
                                <RefreshCw className="animate-spin text-slate-500" size={20} />
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                                No scores yet
                            </div>
                        ) : (
                            <div className="space-y-1 overflow-y-auto max-h-32">
                                {leaderboard.slice(0, 5).map((entry, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className={`w-4 font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-500' : 'text-slate-500'}`}>
                                            {entry.rank}
                                        </span>
                                        <span className="flex-1 truncate text-white">{entry.name}</span>
                                        <span className="font-mono text-emerald-400">${entry.score}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-4 gap-2 shrink-0">
                    <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                        <div className="text-slate-500 text-[10px]">Fill Rate</div>
                        <div className="text-lg font-bold">{userFillRate.toFixed(0)}%</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                        <div className="text-slate-500 text-[10px]">Spoilage</div>
                        <div className="text-lg font-bold">{userSpoilage.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                        <div className="text-slate-500 text-[10px]">Your Cost</div>
                        <div className="text-lg font-bold text-blue-400">${userTotalCost.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                        <div className="text-slate-500 text-[10px]">AI Cost</div>
                        <div className="text-lg font-bold text-slate-400">${rlTotalCost.toFixed(0)}</div>
                    </div>
                </div>

                {/* Cost Chart */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-56 shrink-0">
                    <h3 className="text-slate-400 mb-2 font-bold text-sm">Cost Per Turn</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="turn" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} width={30} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Line type="monotone" dataKey="UserCost" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="RLCost" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="pb-4 flex justify-center shrink-0">
                    <button onClick={onRestart} className="text-slate-400 hover:text-white flex items-center gap-2 transition bg-slate-800 px-6 py-2 rounded-full border border-slate-700 hover:bg-slate-700 text-sm">
                        <RotateCcw size={16} /> Play Again
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResultsScreen;
