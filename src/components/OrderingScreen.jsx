import React, { useState } from 'react';
import { Package, Truck, Calendar, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const OrderingScreen = ({ state, suppliers, onOrder, turnIndex, seasonInfo, lastTurnMetrics }) => {
    const [orders, setOrders] = useState(
        Object.fromEntries(suppliers.map(s => [s.id, 0]))
    );

    const handleOrderChange = (id, val) => {
        setOrders(prev => ({ ...prev, [id]: Math.max(0, parseInt(val) || 0) }));
    };

    const submitOrder = () => {
        onOrder(orders);
    };

    // Helper to visualize inventory buckets
    const renderInventoryShelf = () => {
        // inventory is [expiring_soon, ..., fresh]
        // Display: Top = Fresh (N days left), Bottom = Expiring Soon (1 day left)
        const shelves = [...state.inventory].map((qty, idx) => ({
            qty,
            daysLeft: idx + 1,
            isSpoiling: idx === 0,
            // Color gradient from Red (old) to Green (fresh)
            colorClass: idx === 0 ? 'bg-red-600 border-red-800' :
                idx === 1 ? 'bg-orange-500 border-orange-700' :
                    idx === 2 ? 'bg-amber-500 border-amber-700' :
                        'bg-emerald-600 border-emerald-800'
        })).reverse(); // Reverse so Fresh is on Top

        return (
            <div className="flex bg-slate-800 rounded-xl border-4 border-slate-700 shadow-2xl relative overflow-hidden w-full h-full md:w-48 flex-row md:flex-col p-2 md:p-4 gap-2 md:gap-3 items-stretch justify-between">
                {/* Shelf Texture Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent),radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]"></div>

                <h3 className="hidden md:block relative text-emerald-400 text-center font-black text-lg mb-2 border-b-2 border-slate-600 pb-2 tracking-wider">INVENTORY</h3>

                <div className="relative flex-1 flex flex-row md:flex-col justify-between gap-1">
                    <div className="hidden md:block text-[10px] text-emerald-200 text-center font-mono uppercase tracking-widest mb-1">Fresh (5 Days)</div>

                    {shelves.map((shelf, i) => (
                        <div key={i} className={`relative p-2 md:p-3 rounded-lg border-b-4 transition-all duration-300 flex-1 md:flex-none flex items-center justify-center md:justify-between ${shelf.colorClass} shadow-lg`}>
                            <div className="flex flex-col items-center">
                                <Package className={`w-4 h-4 md:w-6 md:h-6 ${shelf.isSpoiling && shelf.qty > 0 ? 'text-white animate-pulse' : 'text-white'}`} />
                                <span className="hidden md:inline text-[10px] font-bold text-white/80">{shelf.daysLeft}d left</span>
                                <span className="md:hidden text-[8px] font-bold text-white/80">{shelf.daysLeft}d</span>
                            </div>

                            <div className="font-mono text-xl md:text-2xl font-bold text-white drop-shadow-md ml-1 md:ml-0">
                                {Math.round(shelf.qty)}
                            </div>

                            {shelf.isSpoiling && shelf.qty > 0 && (
                                <div className="absolute -right-2 -top-2 bg-red-600 text-white rounded-full p-1 shadow-lg animate-bounce z-10">
                                    <AlertTriangle size={12} />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="hidden md:block text-[10px] text-red-300 text-center mt-2 font-mono uppercase tracking-widest font-bold">Expiring Soon!</div>
                </div>
            </div>
        );
    };

    // Helper for Pipeline Road
    const renderPipeline = () => {
        return (
            <div className="h-44 md:h-44 bg-slate-800 border-t-8 border-slate-900 relative flex items-center w-full shrink-0">
                {/* Road Surface */}
                <div className="absolute inset-0 bg-slate-800"></div>
                <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-slate-600"></div>

                {/* Truck Container */}
                <div className="flex-1 flex flex-row-reverse items-center justify-start gap-8 md:gap-12 px-4 md:px-12 overflow-x-auto h-full w-full pb-6 pt-8">

                    {(() => {
                        let allTrucks = [];
                        suppliers.forEach(supp => {
                            const pipe = state.pipelines[supp.id];
                            if (pipe) {
                                pipe.pipeline.forEach((qty, idx) => {
                                    if (qty > 0) {
                                        // idx 0 = arriving in 1 day
                                        allTrucks.push({
                                            id: supp.id,
                                            name: supp.name,
                                            qty,
                                            daysOut: idx + 1,
                                            color: supp.id === 0 ? 'text-cyan-400' : 'text-orange-400',
                                            bgColor: supp.id === 0 ? 'bg-cyan-900/50 border-cyan-500' : 'bg-orange-900/50 border-orange-500'
                                        });
                                    }
                                });
                            }
                        });

                        // Sort by daysOut ascending
                        allTrucks.sort((a, b) => a.daysOut - b.daysOut);

                        if (allTrucks.length === 0) return <div className="text-slate-600 font-bold text-xl italic mx-auto">NO INCOMING ORDERS</div>;

                        return allTrucks.map((truck, i) => (
                            <div key={i} className="relative group shrink-0 transform transition-all hover:scale-110 cursor-pointer min-w-[80px]">
                                {/* Days Label - Positioned higher to avoid cutoff */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold text-slate-300 whitespace-nowrap bg-slate-800 px-2 py-1 rounded border border-slate-600 z-20 shadow-lg">
                                    {truck.daysOut === 1 ? 'Tomorrow' : `In ${truck.daysOut} Days`}
                                </div>

                                {/* Truck Icon */}
                                <div className={`p-2 rounded-lg border-2 ${truck.bgColor} flex flex-col items-center gap-1 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-slate-800`}>
                                    <Truck className={`w-8 h-8 ${truck.color}`} />
                                    <span className="font-black text-white text-lg font-mono">{Math.round(truck.qty)}</span>
                                </div>

                                {/* Supplier Label */}
                                <div className={`text-[10px] uppercase font-bold text-center mt-1 ${truck.color} opacity-70`}>{truck.name.split(' ')[0]}</div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">

            {/* Top Header */}
            <div className="h-14 md:h-16 bg-slate-900 flex items-center px-4 md:px-8 justify-between shadow-lg border-b border-slate-800 z-30 shrink-0">
                <div className="flex items-center gap-2 md:gap-6">
                    <div className="bg-emerald-600 px-2 py-0.5 md:px-3 md:py-1 rounded-md font-bold text-xs md:text-base text-emerald-100 shadow-lg shadow-emerald-900/20">
                        TURN {turnIndex} / 20
                    </div>

                    <div className={`flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full border ${seasonInfo.factor > 1.0 ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300' : 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'}`}>
                        <Calendar size={14} className="md:w-5 md:h-5" />
                        <span className="font-bold text-xs md:text-sm tracking-wide">{seasonInfo.name}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="text-right">
                        <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Stock</div>
                        <div className="font-mono text-lg md:text-2xl font-bold text-emerald-400">{Math.round(state.total_inventory)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-400 font-bold">Backorders</div>
                        <div className="font-mono text-lg md:text-2xl font-bold text-red-500">{Math.round(state.backorders)}</div>
                    </div>
                </div>
            </div>

            {/* Comparison Metrics */}
            {lastTurnMetrics && (
                <div className="bg-slate-900/50 border-b border-white/5 py-1 px-4 flex justify-center gap-4 md:gap-8 text-[10px] md:text-xs shrink-0">
                    <span className="text-slate-400">LAST ROUND:</span>
                    <span className={lastTurnMetrics.userCost <= lastTurnMetrics.rlCost ? 'text-green-400' : 'text-red-400'}>
                        You: ${lastTurnMetrics.userCost.toFixed(2)}
                    </span>
                    <span className="text-slate-500">vs</span>
                    <span className="text-blue-400">AI: ${lastTurnMetrics.rlCost.toFixed(2)}</span>
                </div>
            )}

            {/* Main Gameplay Area with Mobile Support */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

                {/* Left: Inventory (Stack on top for mobile) */}
                <div className="h-24 md:h-auto md:w-64 bg-slate-900 p-2 md:p-6 border-b md:border-b-0 md:border-r border-slate-800 shadow-xl z-20 shrink-0 overflow-x-auto md:overflow-visible">
                    {renderInventoryShelf()}
                </div>

                {/* Center: Ordering Terminal */}
                <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 overflow-y-auto">
                    {/* Background Decor */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"></div>

                    <div className="relative z-10 w-full max-w-4xl bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-600/50 flex flex-col lg:flex-row my-auto">

                        {/* Terminal Left: Suppliers */}
                        <div className="p-4 md:p-8 flex-1">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-3 text-white border-b border-slate-600 pb-4">
                                <ShoppingCart className="text-emerald-400" />
                                <span>Procurement</span>
                            </h2>

                            <div className="space-y-4">
                                {suppliers.map(s => (
                                    <div key={s.id} className={`group relative p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${orders[s.id] > 0 ? 'bg-slate-700 border-blue-500 shadow-md' : 'bg-slate-700/50 border-slate-600'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-base md:text-lg text-white">{s.name}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Truck size={12} /> Lead: <span className="text-white font-mono">{s.lead_time}d</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-900 border border-slate-700 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-mono text-green-400">
                                                ${s.cost}<span className="text-[10px] text-slate-500">/unit</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-4">
                                            <input
                                                type="range"
                                                min="0" max="50" step="5"
                                                className="flex-1 accent-blue-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                                                value={orders[s.id]}
                                                onChange={(e) => handleOrderChange(s.id, e.target.value)}
                                            />
                                            <div className="w-16 md:w-20">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-slate-900 border border-slate-600 rounded p-1 md:p-2 text-center text-lg md:text-xl font-mono text-white outline-none focus:border-blue-500"
                                                    value={orders[s.id]}
                                                    onChange={(e) => handleOrderChange(s.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terminal Right: Summary */}
                        <div className="bg-slate-900/80 p-4 md:p-8 w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-700 flex flex-col justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Summary</h3>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Cost</span>
                                        <span className="text-emerald-400 font-mono">
                                            ${suppliers.reduce((sum, s) => sum + (orders[s.id] * s.cost), 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={submitOrder}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 md:py-4 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                                <span>CONFIRM</span>
                                <TrendingUp size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Pipeline Visualization */}
            {renderPipeline()}
        </div>
    );
};

export default OrderingScreen;
