import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle, Package, Snowflake, Sun, DollarSign, Activity, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Import merged scene (4K resolution)
import pharmacyScene from '../assets/pharmacy_scene.jpg';

// ============================================================
// BUBBLE POSITION CONFIG - Adjust these values to move the bubble
// ============================================================
// Bottom position: higher % = bubble moves UP, lower % = bubble moves DOWN
// Left position: 50% = centered, lower % = moves LEFT, higher % = moves RIGHT
const BUBBLE_POSITION = {
    bottom: '63%',  // Distance from bottom (try: '20%', '30%', '35%', etc.)
    left: '60%',    // Horizontal position (50% = center)
};
// ============================================================


const ShopView = ({ turnResult, seasonInfo, onNextTurn, aiComparison, history, rlTrace }) => {
    const [animationStep, setAnimationStep] = useState('idle');

    useEffect(() => {
        if (!turnResult) return;

        setAnimationStep('arrival');

        const t1 = setTimeout(() => setAnimationStep('demand'), 1500);
        const t2 = setTimeout(() => setAnimationStep('summary'), 3500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [turnResult]);

    if (!turnResult) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>;

    const { arrivals, demand_realized, sales, spoiled, costs } = turnResult;
    const missed_sales = demand_realized - sales;
    const aiCost = aiComparison ? aiComparison.cost : 0;
    const userCost = costs.total_cost;
    const beatAI = userCost <= aiCost;

    const chartData = history.map((h, i) => {
        const userCum = history.slice(0, i + 1).reduce((sum, item) => sum + item.cost, 0);
        const rlCum = rlTrace.turns.slice(0, i + 1).reduce((sum, item) => sum + item.environment_outcome.cost, 0);
        return {
            turn: i + 1,
            User: userCum,
            AI: rlCum
        };
    });

    return (
        <div className="flex flex-col lg:flex-row bg-slate-950 text-white font-sans overflow-hidden h-screen w-screen">

            {/* LEFT: Shop Floor Visualization - Single Merged Scene */}
            <div className="flex-1 relative border-b lg:border-b-0 lg:border-r-2 border-slate-700 flex flex-col h-[55%] sm:h-[60%] lg:h-full min-h-0 overflow-hidden">

                {/* Merged Pharmacy Scene - Full Coverage */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url(${pharmacyScene})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />

                {/* Subtle vignette for UI contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />

                {/* Header */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-6 lg:left-6 z-20 flex flex-col gap-0.5 sm:gap-1">
                    <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs sm:text-sm lg:text-base font-black text-emerald-400 tracking-wider">SHOP FLOOR</span>
                    </div>
                </div>

                {/* Main Scene Overlays */}
                <div className="flex-1 flex flex-col items-center justify-center relative">

                    {/* Arrivals Animation */}
                    {animationStep === 'arrival' && arrivals > 0 && (
                        <div className="absolute top-[10%] sm:top-[15%] left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-30">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 rounded-full font-black shadow-lg shadow-emerald-500/30 border border-emerald-400/50 text-xs sm:text-sm lg:text-base whitespace-nowrap flex items-center gap-1.5 sm:gap-2">
                                <Package size={14} className="sm:hidden" />
                                <Package size={18} className="hidden sm:block" />
                                +{Math.round(arrivals)} Stock Arrived
                            </div>
                        </div>
                    )}

                    {/* Demand Bubble - Position controlled by BUBBLE_POSITION config at top of file */}
                    {(animationStep === 'demand' || animationStep === 'summary') && (
                        <div
                            className="absolute z-30 animate-fade-in-up transform -translate-x-1/2"
                            style={{ bottom: BUBBLE_POSITION.bottom, left: BUBBLE_POSITION.left }}
                        >
                            <div className="relative bg-slate-800/95 backdrop-blur-sm border-2 sm:border-3 border-slate-500 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-3 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/50 flex flex-col items-center">
                                <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white leading-none">
                                    {Math.round(demand_realized)}
                                </div>
                                <div className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</div>

                                {/* Bubble tail */}
                                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-slate-800/95 border-r-2 border-b-2 sm:border-r-3 sm:border-b-3 border-slate-500 rotate-45" />
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    {animationStep === 'summary' && (
                        <div className="absolute inset-x-2 top-12 sm:inset-x-4 sm:top-16 lg:top-auto lg:right-4 xl:right-6 lg:bottom-[50%] flex flex-row lg:flex-col justify-between lg:justify-end gap-1.5 sm:gap-2 lg:gap-3 animate-slide-in-right z-30 pointer-events-none">
                            <div className="bg-emerald-900/90 backdrop-blur-sm border-l-2 sm:border-l-4 border-emerald-500 p-1.5 sm:p-2 lg:p-3 shadow-lg shadow-emerald-900/50 flex items-center gap-1.5 sm:gap-2 lg:gap-3 lg:w-44 xl:w-52 pointer-events-auto rounded-md sm:rounded-lg animate-bounce-in flex-1 lg:flex-none">
                                <CheckCircle className="text-emerald-400 shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                                <div className="min-w-0">
                                    <div className="font-black text-emerald-100 text-sm sm:text-base lg:text-lg truncate">{Math.round(sales)} Sales</div>
                                </div>
                            </div>

                            {missed_sales > 0 && (
                                <div className="bg-red-900/90 backdrop-blur-sm border-l-2 sm:border-l-4 border-red-500 p-1.5 sm:p-2 lg:p-3 shadow-lg shadow-red-900/50 flex items-center gap-1.5 sm:gap-2 lg:gap-3 lg:w-44 xl:w-52 pointer-events-auto rounded-md sm:rounded-lg animate-bounce-in flex-1 lg:flex-none" style={{ animationDelay: '0.1s' }}>
                                    <XCircle className="text-red-400 shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                                    <div className="min-w-0">
                                        <div className="font-black text-red-100 text-sm sm:text-base lg:text-lg truncate">{Math.round(missed_sales)} Missed</div>
                                    </div>
                                </div>
                            )}

                            {spoiled > 0 && (
                                <div className="bg-purple-900/90 backdrop-blur-sm border-l-2 sm:border-l-4 border-purple-500 p-1.5 sm:p-2 lg:p-3 shadow-lg shadow-purple-900/50 flex items-center gap-1.5 sm:gap-2 lg:gap-3 lg:w-44 xl:w-52 pointer-events-auto rounded-md sm:rounded-lg animate-bounce-in flex-1 lg:flex-none" style={{ animationDelay: '0.2s' }}>
                                    <Activity className="text-purple-400 shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 animate-pulse" />
                                    <div className="min-w-0">
                                        <div className="font-black text-purple-100 text-sm sm:text-base lg:text-lg truncate">{Math.round(spoiled)} Spoiled</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Daily Report Sidebar */}
            <div className="w-full lg:w-80 xl:w-96 bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col shadow-2xl z-20 h-[45%] sm:h-[40%] lg:h-full border-l border-slate-800 shrink-0">
                <div className="px-2 py-2 sm:px-4 sm:py-3 lg:p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm sm:text-base lg:text-xl font-black tracking-widest text-slate-200 flex items-center gap-1.5 sm:gap-2">
                            <Sparkles className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                            DAILY REPORT
                        </h2>
                        <div className="hidden lg:block text-xs text-slate-500 mt-1">Market simulation results</div>
                    </div>
                    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 bg-slate-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                        {seasonInfo.factor > 1.0 ? <Snowflake size={10} className="sm:hidden text-cyan-300" /> : <Sun size={10} className="sm:hidden text-yellow-400" />}
                        {seasonInfo.factor > 1.0 ? <Snowflake size={12} className="hidden sm:block text-cyan-300" /> : <Sun size={12} className="hidden sm:block text-yellow-400" />}
                        <span className="font-bold uppercase text-slate-300">{seasonInfo.name}</span>
                    </div>
                </div>

                <div className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-6 overflow-y-auto">
                    {/* Season Card (Desktop) */}
                    <div className="hidden lg:flex items-center gap-4 bg-gradient-to-r from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700">
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

                    {/* Performance Graph */}
                    <div className="flex-1 min-h-[80px] sm:min-h-[100px] lg:h-40 lg:flex-none bg-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-700 relative">
                        <h4 className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 mb-1 sm:mb-2 absolute top-1.5 sm:top-2 left-2 sm:left-3">Cost Trend</h4>
                        <div className="w-full h-full pt-3 sm:pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '10px', borderRadius: '8px' }}
                                        itemStyle={{ padding: 0 }}
                                    />
                                    <XAxis dataKey="turn" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Line type="monotone" dataKey="User" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={500} />
                                    <Line type="monotone" dataKey="AI" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={false} animationDuration={500} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute bottom-1 sm:bottom-2 right-2 sm:right-3 flex gap-2 sm:gap-3 text-[8px] sm:text-[10px]">
                            <span className="text-emerald-400 font-bold">● You</span>
                            <span className="text-blue-400 font-bold">● AI</span>
                        </div>
                    </div>

                    {/* Cost Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="bg-slate-800 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-slate-700 text-center">
                            <div className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-bold">Turn Cost</div>
                            <div className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-mono font-black ${beatAI ? 'text-emerald-400' : 'text-amber-400'}`}>${costs.total_cost.toFixed(1)}</div>
                        </div>
                        <div className="bg-slate-800 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-slate-700 text-center">
                            <div className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-bold">Spoilage</div>
                            <div className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-mono font-black ${spoiled > 0 ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`}>{spoiled.toFixed(0)}</div>
                        </div>
                    </div>

                </div>

                {/* Continue Button Area */}
                <div className="p-2 sm:p-4 lg:p-6 bg-slate-950 border-t border-slate-800 flex-shrink-0">
                    {animationStep === 'summary' ? (
                        <button
                            onClick={onNextTurn}
                            className="w-full bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black py-2.5 sm:py-3 lg:py-4 xl:py-5 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_6px_0_#1d4ed8] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[6px] transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg xl:text-xl"
                        >
                            <Sparkles size={16} className="sm:hidden text-yellow-300" />
                            <Sparkles size={20} className="hidden sm:block text-yellow-300" />
                            <span>START NEXT DAY</span>
                            <DollarSign size={16} className="sm:hidden" />
                            <DollarSign size={20} className="hidden sm:block" />
                        </button>
                    ) : (
                        <div className="w-full py-2 sm:py-3 lg:py-4 text-center text-slate-600 text-xs sm:text-sm flex items-center justify-center gap-2 bg-slate-800 rounded-lg sm:rounded-xl border border-slate-700">
                            <Activity className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-bold">Processing Market...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopView;
