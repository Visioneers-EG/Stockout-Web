import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Trophy, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

const ResultsScreen = ({ userHistory, rlTrace, onRestart }) => {
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
    // Trim rlTurns to match userHistory length if needed
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

    const comparisonData = [
        { name: 'Total Cost', User: userTotalCost, RL: rlTotalCost },
        { name: 'Spoilage Qty', User: userSpoilage, RL: rlSpoilage },
    ];

    const betterThanRL = userTotalCost < rlTotalCost;

    return (
        <div className="h-screen w-screen bg-slate-900 text-white overflow-y-auto overflow-x-hidden p-4 md:p-8 flex flex-col items-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-amber-500 text-center shrink-0">SIMULATION COMPLETE</h1>

            <div className="flex-1 w-full max-w-6xl flex flex-col gap-4 md:gap-8">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 shrink-0">
                    {/* Main Scorecard */}
                    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center">
                        <div className="text-lg md:text-xl text-slate-400 mb-2 md:mb-4">You vs AI Model</div>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl md:text-6xl font-bold text-white">${userTotalCost.toFixed(2)}</span>
                            <span className="text-xs md:text-sm text-slate-400 mb-2">Total Cost</span>
                        </div>

                        <div className="text-xs md:text-sm text-slate-400 mb-4 md:mb-8 flex flex-col items-center">
                            <span>AI Benchmark</span>
                            <span className="text-white font-mono text-lg">${rlTotalCost.toFixed(2)}</span>
                        </div>

                        {betterThanRL ? (
                            <div className="bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-2 font-bold animate-bounce text-sm md:text-base">
                                <Trophy size={20} /> YOU BEAT THE AI!
                            </div>
                        ) : (
                            <div className="bg-amber-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-2 font-bold text-sm md:text-base">
                                <AlertTriangle size={20} /> AI WINS THIS TIME
                            </div>
                        )}
                    </div>

                    {/* Detailed Metrics */}
                    <div className="bg-slate-800 p-4 md:p-8 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Fill Rate */}
                            <div className="bg-slate-700 p-2 md:p-4 rounded text-center">
                                <div className="text-slate-400 text-xs md:text-sm">Fill Rate</div>
                                <div className="text-xl md:text-2xl font-bold">{userFillRate.toFixed(1)}%</div>
                                <div className="text-[10px] md:text-xs text-slate-500">AI: {rlFillRate.toFixed(1)}%</div>
                            </div>

                            {/* Spoilage */}
                            <div className="bg-slate-700 p-2 md:p-4 rounded text-center">
                                <div className="text-slate-400 text-xs md:text-sm">Total Spoilage</div>
                                <div className="text-xl md:text-2xl font-bold">{userSpoilage.toFixed(0)}</div>
                                <div className="text-[10px] md:text-xs text-slate-500">AI: {rlSpoilage.toFixed(0)}</div>
                            </div>
                        </div>

                        {/* Comparison Bar Chart */}
                        <div className="flex-1 min-h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={10} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="User" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="RL" fill="#64748b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Cost Over Time Graph */}
                <div className="bg-slate-800 p-4 md:p-6 rounded-xl shadow-2xl border border-slate-700 min-h-[250px] md:h-80 shrink-0">
                    <h3 className="text-slate-400 mb-2 md:mb-4 font-bold text-sm md:text-base">Cost Per Turn</h3>
                    <div className="w-full h-full pb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="turn" stroke="#94a3b8" fontSize={12} tickCount={10} />
                                <YAxis stroke="#94a3b8" fontSize={12} width={35} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line type="monotone" dataKey="UserCost" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="RLCost" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="pb-8 flex justify-center shrink-0">
                    <button onClick={onRestart} className="mt-4 md:mt-8 text-slate-400 hover:text-white flex items-center gap-2 transition bg-slate-800 px-6 py-3 rounded-full border border-slate-700 hover:bg-slate-700 shadow-lg">
                        <RotateCcw size={20} /> Play Again
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResultsScreen;
