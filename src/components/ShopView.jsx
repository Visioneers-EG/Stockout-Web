import React, { useEffect, useState } from 'react';
import { User, Users, XCircle, CheckCircle, Package, Snowflake, Sun, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ShopView = ({ turnResult, seasonInfo, onNextTurn, aiComparison, history, rlTrace }) => {
    const [animationStep, setAnimationStep] = useState('idle'); // idle, arrival, demand, summary

    // Use effects to trigger animations sequence
    useEffect(() => {
        if (!turnResult) return;

        // Sequence:
        // 0s: Start
        // 0.5s: Arrivals (Trucks unloading)
        // 2.0s: Customers (Demand)
        // 4.0s: Summary & Spoilage

        setAnimationStep('arrival');

        const t1 = setTimeout(() => setAnimationStep('demand'), 1500);
        const t2 = setTimeout(() => setAnimationStep('summary'), 3500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [turnResult]);

    if (!turnResult) return <div>Loading...</div>;

    const { arrivals, demand_realized, sales, spoiled, costs } = turnResult;
    const missed_sales = demand_realized - sales;
    const aiCost = aiComparison ? aiComparison.cost : 0;
    const userCost = costs.total_cost;
    const beatAI = userCost <= aiCost;

    // Prepare Graph Data (Cumulative Cost or Per Turn?)
    // User asked for "results against the AI's for this turn and previous turns".
    // Let's show Cumulative Cost Trend for clarity on who is winning overall.
    const chartData = history.map((h, i) => {
        // Calculate cumulative up to index i
        const userCum = history.slice(0, i + 1).reduce((sum, item) => sum + item.cost, 0);
        const rlCum = rlTrace.turns.slice(0, i + 1).reduce((sum, item) => sum + item.environment_outcome.cost, 0);
        return {
            turn: i + 1,
            User: userCum,
            AI: rlCum
        };
    });

    return (
        <div className="flex flex-col md:flex-row bg-slate-100 text-slate-800 font-sans overflow-hidden h-screen w-screen">

            {/* LEFT: Shop Floor Visualization */}
            <div className="flex-1 relative bg-white border-b md:border-b-0 md:border-r-4 border-slate-300 shadow-inner flex flex-col h-full min-h-0">

                {/* Header */}
                <div className="absolute top-4 left-4 md:top-6 md:left-6 text-xl md:text-2xl font-bold text-slate-400 z-10 flex flex-col gap-1">
                    <span>SHOP FLOOR</span>
                    <span className="text-[10px] md:text-xs text-slate-300 font-normal">Observing Market Day...</span>
                </div>

                {/* Center Scene */}
                <div className="flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden">

                    {/* Counter Area */}
                    <div className="relative z-10 animate-fade-in scale-75 md:scale-100 origin-center">
                        <div className="w-64 md:w-80 h-24 md:h-32 bg-amber-100 border-b-8 border-amber-300 rounded-t-lg shadow-xl relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-x-0 top-0 h-4 bg-amber-200/50"></div>
                            <div className="text-amber-900/20 font-black text-3xl md:text-4xl tracking-widest select-none">PHARMACY</div>
                        </div>
                        {/* User Avatar behind counter */}
                        <div className="absolute bottom-20 md:bottom-24 left-1/2 transform -translate-x-1/2 -z-10">
                            <User strokeWidth={1.5} size={60} className="text-slate-600 fill-slate-200 md:w-20 md:h-20" />
                        </div>
                    </div>

                    {/* Arrivals Animation */}
                    {animationStep === 'arrival' && arrivals > 0 && (
                        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                            <div className="bg-emerald-100 text-emerald-800 px-3 py-1 md:px-4 rounded-full font-bold shadow-lg border border-emerald-200 mb-2 text-sm md:text-base whitespace-nowrap">
                                +{Math.round(arrivals)} Stock Arrived
                            </div>
                            <Package size={48} className="text-emerald-500 drop-shadow-lg md:w-16 md:h-16" />
                        </div>
                    )}

                    {/* Demand Animation */}
                    {(animationStep === 'demand' || animationStep === 'summary') && (
                        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-4 md:translate-y-8 z-30 flex flex-col items-center gap-2 md:gap-4 animate-fade-in-up">
                            {/* Speech Bubble */}
                            <div className="relative bg-white border-2 border-slate-800 p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col items-center scale-90 md:scale-100">
                                <div className="text-3xl md:text-4xl font-black text-slate-900 leading-none">
                                    {Math.round(demand_realized)}
                                </div>
                                <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Requests</div>

                                {/* Tail */}
                                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-white border-r-2 border-b-2 border-slate-800 rotate-45"></div>
                            </div>

                            {/* Customers */}
                            <div className="flex -space-x-4">
                                <Users size={48} className="text-slate-700 md:w-16 md:h-16" />
                                {demand_realized > 5 && <Users size={48} className="text-slate-500 scale-90 md:w-16 md:h-16" />}
                                {demand_realized > 10 && <Users size={48} className="text-slate-400 scale-75 md:w-16 md:h-16" />}
                            </div>
                        </div>
                    )}

                    {/* Summary Checkmarks - Moved to top corners to avoid overlap */}
                    {animationStep === 'summary' && (
                        <div className="absolute inset-x-4 top-16 md:top-auto md:right-8 md:bottom-20 flex flex-row md:flex-col justify-between md:justify-end gap-2 md:gap-3 animate-slide-in-right z-40 pointer-events-none">
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2 md:p-3 shadow-md flex items-center gap-2 md:gap-3 md:w-48 pointer-events-auto rounded">
                                <CheckCircle className="text-emerald-500 shrink-0 w-4 h-4 md:w-5 md:h-5" />
                                <div>
                                    <div className="font-bold text-emerald-900 text-sm md:text-base">{Math.round(sales)} Sales</div>
                                </div>
                            </div>

                            {missed_sales > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-2 md:p-3 shadow-md flex items-center gap-2 md:gap-3 md:w-48 pointer-events-auto rounded">
                                    <XCircle className="text-red-500 shrink-0 w-4 h-4 md:w-5 md:h-5" />
                                    <div>
                                        <div className="font-bold text-red-900 text-sm md:text-base">{Math.round(missed_sales)} Missed</div>
                                    </div>
                                </div>
                            )}

                            {spoiled > 0 && (
                                <div className="bg-purple-50 border-l-4 border-purple-500 p-2 md:p-3 shadow-md flex items-center gap-2 md:gap-3 md:w-48 pointer-events-auto rounded">
                                    <Activity className="text-purple-500 shrink-0 w-4 h-4 md:w-5 md:h-5" />
                                    <div>
                                        <div className="font-bold text-purple-900 text-sm md:text-base">{Math.round(spoiled)} Spoiled</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Daily Report Sidebar */}
            <div className="w-full md:w-96 bg-slate-900 text-white flex flex-col shadow-2xl z-20 h-1/3 md:h-full border-l border-slate-800 shrink-0">
                <div className="px-4 py-3 md:p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div>
                        <h2 className="text-base md:text-xl font-bold tracking-widest text-slate-200">DAILY REPORT</h2>
                        <div className="hidden md:block text-xs text-slate-500 mt-1">Simulating market dynamics...</div>
                    </div>
                    {/* Season Mini Badge for Mobile */}
                    <div className="flex md:hidden items-center gap-2 bg-slate-800 px-2 py-1 rounded text-xs">
                        {seasonInfo.factor > 1.0 ? <Snowflake size={12} className="text-cyan-300" /> : <Sun size={12} className="text-yellow-400" />}
                        <span className="font-bold uppercase text-slate-300">{seasonInfo.name}</span>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto">
                    {/* Season Card (Desktop) */}
                    <div className="hidden md:flex items-center gap-4 bg-gradient-to-r from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className={`p-3 rounded-lg ${seasonInfo.factor > 1.0 ? 'bg-cyan-900/30' : 'bg-yellow-900/30'}`}>
                            {seasonInfo.factor > 1.0 ? <Snowflake className="text-cyan-300 w-6 h-6" /> : <Sun className="text-yellow-400 w-6 h-6" />}
                        </div>
                        <div>
                            <div className="font-bold text-lg uppercase tracking-wider">{seasonInfo.name}</div>
                            <div className={`text-xs ${seasonInfo.factor > 1.0 ? 'text-cyan-200' : 'text-yellow-200/70'}`}>
                                {seasonInfo.factor > 1.0 ? 'High Demand Expected' : 'Standard Demand'}
                            </div>
                        </div>
                    </div>

                    {/* Performance Graph (NEW) */}
                    <div className="flex-1 md:flex-none min-h-[100px] md:h-40 bg-slate-800 rounded-lg p-2 border border-slate-700 relative">
                        <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 absolute top-2 left-2">Cumulative Cost Trend</h4>
                        <div className="w-full h-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }}
                                        itemStyle={{ padding: 0 }}
                                    />
                                    <XAxis dataKey="turn" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Line type="monotone" dataKey="User" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={500} />
                                    <Line type="monotone" dataKey="AI" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={false} animationDuration={500} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="absolute bottom-1 right-2 flex gap-2 text-[10px]">
                            <span className="text-emerald-400">● You</span>
                            <span className="text-blue-400">● AI</span>
                        </div>
                    </div>

                    {/* Cost Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded border border-slate-700">
                            <div className="text-[10px] text-slate-400 uppercase">Turn Cost</div>
                            <div className="text-lg md:text-xl font-mono font-bold text-white">${costs.total_cost.toFixed(1)}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded border border-slate-700">
                            <div className="text-[10px] text-slate-400 uppercase">Spoilage</div>
                            <div className={`text-lg md:text-xl font-mono font-bold ${spoiled > 0 ? 'text-purple-400' : 'text-slate-500'}`}>{spoiled.toFixed(0)}</div>
                        </div>
                    </div>

                </div>

                {/* Continue Button Area */}
                <div className="p-4 md:p-6 bg-slate-950 border-t border-slate-800 flex-shrink-0">
                    {animationStep === 'summary' ? (
                        <button
                            onClick={onNextTurn}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 md:py-4 px-6 rounded-xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <span>START NEXT DAY</span>
                            <DollarSign size={16} />
                        </button>
                    ) : (
                        <div className="w-full py-2 md:py-4 text-center text-slate-600 text-sm animate-pulse flex items-center justify-center gap-2">
                            <Activity className="animate-spin" size={16} /> Processing Market...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopView;
