import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, AlertTriangle, RotateCcw, Send, CheckCircle, RefreshCw, Sparkles, Star, Zap } from 'lucide-react';
import { submitScore, fetchLeaderboard } from '../services/leaderboard';
import useSoundEffects from '../hooks/useSoundEffects';

const ResultsScreen = ({ userHistory, rlTrace, onRestart, scenario }) => {
    const [playerName, setPlayerName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
    const { victory, defeat, confirm, click } = useSoundEffects();

    const currentScenario = rlTrace?.metadata?.scenario || scenario || 'simple';

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

    // Prepare Chart Data - Cumulative Cost
    const chartData = userHistory.map((h, i) => {
        const userCum = userHistory.slice(0, i + 1).reduce((sum, item) => sum + item.cost, 0);
        const rlCum = rlTrace.turns.slice(0, i + 1).reduce((sum, item) => sum + item.environment_outcome.cost, 0);
        return {
            turn: i + 1,
            UserCost: userCum,
            RLCost: rlCum
        };
    });

    const isDraw = Math.abs(userTotalCost - rlTotalCost) < 0.01;
    const betterThanRL = userTotalCost < rlTotalCost && !isDraw;

    // Load leaderboard on mount and play result sound
    useEffect(() => {
        loadLeaderboard();
        // Play victory, defeat, or neutral sound based on result
        if (betterThanRL) {
            victory();
        } else if (isDraw) {
            // Use sale sound as a neutral positive, or add a specific draw sound if available
            // reusing victory but maybe less intense would be ideal, or just sale
            confirm();
        } else {
            defeat();
        }
    }, [currentScenario, betterThanRL, isDraw]);

    const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        const data = await fetchLeaderboard(currentScenario);
        setLeaderboard(data);
        setLoadingLeaderboard(false);
    };

    const handleSubmitScore = async () => {
        if (!playerName.trim()) return;

        confirm();
        setSubmitting(true);
        // Treat draw as "beat AI" for submission purposes? Or strictly better? 
        // Usually "beat AI" means strictly better. Let's send false for draw to be safe, or check backend requirement.
        // Assuming strict inequality for "beat".
        await submitScore(playerName.trim(), currentScenario, userTotalCost, betterThanRL);
        setSubmitted(true);
        setSubmitting(false);
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
        <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white overflow-y-auto overflow-x-hidden p-2 sm:p-4 lg:p-6 flex flex-col items-center relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

            {/* Title */}
            <div className="relative z-10 mb-3 sm:mb-4 lg:mb-6 text-center shrink-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 flex items-center justify-center gap-2 sm:gap-3">
                    {betterThanRL ? (
                        <>
                            <Trophy className="text-yellow-400 animate-bounce w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                            VICTORY!
                            <Trophy className="text-yellow-400 animate-bounce w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                        </>
                    ) : isDraw ? (
                        <>
                            <RotateCcw className="text-orange-400 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                            DRAW!
                            <RotateCcw className="text-orange-400 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                        </>
                    ) : (
                        <>
                            <Zap className="text-amber-400 w-5 h-5 sm:w-7 sm:h-7 lg:w-9 lg:h-9" />
                            <span className="hidden sm:inline">SIMULATION COMPLETE</span>
                            <span className="sm:hidden">COMPLETE</span>
                        </>
                    )}
                </h1>
                {betterThanRL && (
                    <p className="text-emerald-400 font-bold mt-1 sm:mt-2 animate-pulse text-xs sm:text-sm lg:text-base">🎉 You outperformed the AI! 🎉</p>
                )}
                {isDraw && (
                    <p className="text-orange-400 font-bold mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">You matched the AI's performance!</p>
                )}
            </div>

            <div className="relative z-10 flex-1 w-full max-w-6xl flex flex-col gap-2 sm:gap-3 lg:gap-4">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 shrink-0">
                    {/* Main Scorecard */}
                    <div className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center ${betterThanRL ? 'bg-gradient-to-br from-emerald-900/50 to-green-900/30 border-emerald-500/50' : isDraw ? 'bg-gradient-to-br from-orange-900/50 to-amber-900/30 border-orange-500/50' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="text-[10px] sm:text-xs lg:text-sm text-slate-400 mb-1 sm:mb-2 font-bold uppercase tracking-wider">You vs AI</div>

                        <div className="flex items-end gap-2 mb-2 sm:mb-3">
                            <span className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black ${betterThanRL ? 'text-emerald-400' : isDraw ? 'text-orange-400' : 'text-white'}`}>
                                ${userTotalCost.toFixed(2)}
                            </span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 lg:mb-4 flex items-center gap-2">
                            <span>AI:</span>
                            <span className="text-white font-mono font-bold">${rlTotalCost.toFixed(2)}</span>
                        </div>

                        {betterThanRL ? (
                            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm lg:text-lg shadow-lg shadow-emerald-500/30 animate-bounce-in">
                                <Trophy size={16} className="sm:hidden text-yellow-300" />
                                <Trophy size={20} className="hidden sm:block lg:hidden text-yellow-300" />
                                <Trophy size={24} className="hidden lg:block text-yellow-300" />
                                YOU BEAT THE AI!
                            </div>
                        ) : isDraw ? (
                            <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm lg:text-lg shadow-lg">
                                <RotateCcw size={16} className="sm:hidden" />
                                <RotateCcw size={20} className="hidden sm:block lg:hidden" />
                                <RotateCcw size={24} className="hidden lg:block" />
                                IT'S A TIE!
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm lg:text-lg shadow-lg">
                                <AlertTriangle size={16} className="sm:hidden" />
                                <AlertTriangle size={20} className="hidden sm:block lg:hidden" />
                                <AlertTriangle size={24} className="hidden lg:block" />
                                <span className="hidden sm:inline">AI Wins This Time</span>
                                <span className="sm:hidden">AI Wins</span>
                            </div>
                        )}
                    </div>

                    {/* Submit Score */}
                    <div className="bg-slate-800 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border border-slate-700 flex flex-col">
                        <h3 className="text-[10px] sm:text-xs lg:text-sm font-black text-slate-400 mb-2 sm:mb-3 lg:mb-4 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                            <Star size={12} className="sm:hidden text-yellow-400" />
                            <Star size={14} className="hidden sm:block text-yellow-400" />
                            Submit Score
                        </h3>

                        {submitted ? (
                            <div className="flex-1 flex flex-col items-center justify-center animate-bounce-in py-2 sm:py-4">
                                <div className="bg-emerald-500 p-2 sm:p-3 lg:p-4 rounded-full mb-2 sm:mb-3">
                                    <CheckCircle className="text-white w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                                </div>
                                <p className="text-emerald-400 font-black text-sm sm:text-base lg:text-lg">Submitted!</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Enter your name..."
                                    maxLength={20}
                                    className="w-full bg-slate-900 border-2 border-slate-600 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none mb-2 sm:mb-3 font-mono"
                                />
                                <button
                                    onClick={handleSubmitScore}
                                    disabled={!playerName.trim() || submitting}
                                    className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm lg:text-base flex items-center justify-center gap-1.5 sm:gap-2 ${playerName.trim() && !submitting
                                        ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-[0_3px_0_#065f46] sm:shadow-[0_4px_0_#065f46] active:shadow-none active:translate-y-[3px] sm:active:translate-y-[4px]'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={14} className="sm:hidden" />
                                    <Send size={18} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Submit to Leaderboard</span>
                                    <span className="sm:hidden">Submit</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-slate-800 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border border-slate-700 flex flex-col md:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                            <h3 className="text-[10px] sm:text-xs lg:text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                                <Trophy size={12} className="sm:hidden text-yellow-400" />
                                <Trophy size={14} className="hidden sm:block text-yellow-400" />
                                {getScenarioLabel(currentScenario)} Leaderboard
                            </h3>
                            <button onClick={loadLeaderboard} className="text-slate-500 hover:text-white p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                <RefreshCw size={14} className={`sm:hidden ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                                <RefreshCw size={16} className={`hidden sm:block ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {loadingLeaderboard ? (
                            <div className="flex-1 flex items-center justify-center py-4">
                                <RefreshCw className="animate-spin text-slate-500 w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs sm:text-sm py-4">
                                No scores yet - be the first!
                            </div>
                        ) : (
                            <div className="space-y-1.5 sm:space-y-2 overflow-y-auto max-h-28 sm:max-h-36">
                                {leaderboard.slice(0, 5).map((entry, i) => (
                                    <div key={i} className={`flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1.5 sm:p-2 rounded-lg ${i === 0 ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-slate-700/50'}`}>
                                        <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full font-black text-[10px] sm:text-xs ${entry.rank === 1 ? 'bg-yellow-500 text-yellow-900' : entry.rank === 2 ? 'bg-slate-300 text-slate-800' : entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                                            {entry.rank}
                                        </span>
                                        <span className="flex-1 truncate text-white font-bold">{entry.name}</span>
                                        <span className="font-mono text-emerald-400 font-bold">${entry.score}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
                    <div className="bg-slate-800 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl text-center border border-slate-700">
                        <div className="text-slate-500 text-[8px] sm:text-[10px] font-bold uppercase">Fill Rate</div>
                        <div className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-black font-mono ${userFillRate >= 90 ? 'text-emerald-400' : userFillRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{userFillRate.toFixed(0)}%</div>
                    </div>
                    <div className="bg-slate-800 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl text-center border border-slate-700">
                        <div className="text-slate-500 text-[8px] sm:text-[10px] font-bold uppercase">Spoilage</div>
                        <div className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-black font-mono ${userSpoilage === 0 ? 'text-emerald-400' : 'text-purple-400'}`}>{userSpoilage.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl text-center border border-slate-700">
                        <div className="text-slate-500 text-[8px] sm:text-[10px] font-bold uppercase">Your Cost</div>
                        <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-blue-400 font-mono">${userTotalCost.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl text-center border border-slate-700">
                        <div className="text-slate-500 text-[8px] sm:text-[10px] font-bold uppercase">AI Cost</div>
                        <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-slate-400 font-mono">${rlTotalCost.toFixed(0)}</div>
                    </div>
                </div>

                {/* Cost Chart */}
                <div className="bg-slate-800 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border border-slate-700 h-40 sm:h-48 lg:h-56 xl:h-60 shrink-0">
                    <h3 className="text-slate-400 mb-2 sm:mb-3 font-black text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                        <Sparkles size={12} className="sm:hidden text-yellow-400" />
                        <Sparkles size={14} className="hidden sm:block text-yellow-400" />
                        Cumulative Cost
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="turn" stroke="#94a3b8" fontSize={9} />
                            <YAxis stroke="#94a3b8" fontSize={9} width={30} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '10px', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Line type="monotone" dataKey="UserCost" stroke="#10b981" strokeWidth={2} dot={false} name="You" />
                            <Line type="monotone" dataKey="RLCost" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="AI" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="pb-4 sm:pb-6 flex justify-center shrink-0">
                    <button
                        onClick={() => { click(); onRestart(); }}
                        className="bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-lg sm:rounded-xl border border-slate-600 shadow-[0_3px_0_#1e293b] sm:shadow-[0_4px_0_#1e293b] active:shadow-none active:translate-y-[3px] sm:active:translate-y-[4px] transition-all flex items-center gap-2 sm:gap-3 font-black text-sm sm:text-base lg:text-lg"
                    >
                        <RotateCcw size={16} className="sm:hidden" />
                        <RotateCcw size={20} className="hidden sm:block" />
                        Play Again
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResultsScreen;
