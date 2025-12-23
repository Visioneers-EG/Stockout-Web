import React, { useState, useRef } from 'react';
import { Package, Truck, Calendar, ShoppingCart, AlertTriangle, TrendingUp, Zap, Clock, DollarSign } from 'lucide-react';

// Supplier identity configuration
const SUPPLIER_IDENTITY = {
    0: {
        emoji: '🚀',
        name: 'Express Logistics',
        tagline: 'Lightning Fast Delivery',
        colorTheme: 'cyan',
        bgGradient: 'from-cyan-600 to-cyan-800',
        borderColor: 'border-cyan-500',
        textColor: 'text-cyan-400',
        bgColor: 'bg-cyan-900/50',
        truckColor: 'text-cyan-400'
    },
    1: {
        emoji: '🐢',
        name: 'Budget Freight',
        tagline: 'Slow but Steady Savings',
        colorTheme: 'orange',
        bgGradient: 'from-orange-600 to-orange-800',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-900/50',
        truckColor: 'text-orange-400'
    },
    2: {
        emoji: '👑',
        name: 'Premium Supply Co',
        tagline: 'Quality You Can Trust',
        colorTheme: 'yellow',
        bgGradient: 'from-yellow-500 to-amber-700',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-900/50',
        truckColor: 'text-yellow-400'
    },
    3: {
        emoji: '📦',
        name: 'Mega Wholesale',
        tagline: 'Bulk Orders, Big Savings',
        colorTheme: 'purple',
        bgGradient: 'from-purple-600 to-purple-800',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-900/50',
        truckColor: 'text-purple-400'
    }
};

// Stepper Component with arcade-style buttons
const OrderStepper = ({ value, onChange, supplier }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const identity = SUPPLIER_IDENTITY[supplier.id] || SUPPLIER_IDENTITY[0];

    const handleChange = (delta) => {
        const newValue = Math.max(0, value + delta);
        onChange(newValue);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 250);
    };

    return (
        <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Minus Button */}
            <button
                onClick={() => handleChange(-5)}
                disabled={value === 0}
                className={`
                    flex items-center justify-center 
                    w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 
                    rounded-lg sm:rounded-xl
                    font-black text-xl sm:text-2xl lg:text-3xl
                    transition-all duration-75 select-none cursor-pointer
                    active:scale-90
                    ${value === 0
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : `bg-gradient-to-b ${identity.bgGradient} text-white shadow-[0_3px_0_rgba(0,0,0,0.3)] sm:shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:brightness-110 active:shadow-none active:translate-y-[3px]`
                    }
                `}
            >
                −
            </button>

            {/* Value Display */}
            <div
                className={`
                    w-14 h-10 sm:w-16 sm:h-12 lg:w-20 lg:h-14 
                    flex items-center justify-center rounded-lg sm:rounded-xl
                    bg-slate-900 border-2 ${identity.borderColor}
                    font-mono text-xl sm:text-2xl lg:text-3xl font-black text-white
                    ${isAnimating ? 'animate-number-pop' : ''}
                    transition-colors duration-200
                `}
            >
                {value}
            </div>

            {/* Plus Button */}
            <button
                onClick={() => handleChange(5)}
                className={`
                    flex items-center justify-center 
                    w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 
                    rounded-lg sm:rounded-xl
                    font-black text-xl sm:text-2xl lg:text-3xl
                    transition-all duration-75 select-none cursor-pointer
                    active:scale-90
                    bg-gradient-to-b ${identity.bgGradient} text-white
                    shadow-[0_3px_0_rgba(0,0,0,0.3)] sm:shadow-[0_4px_0_rgba(0,0,0,0.3)]
                    hover:brightness-110 active:shadow-none active:translate-y-[3px]
                `}
            >
                +
            </button>
        </div>
    );
};

// Supplier Avatar Component
const SupplierAvatar = ({ identity, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-base sm:w-10 sm:h-10 sm:text-lg',
        md: 'w-10 h-10 text-lg sm:w-12 sm:h-12 sm:text-xl lg:w-14 lg:h-14 lg:text-2xl',
        lg: 'w-14 h-14 text-2xl sm:w-16 sm:h-16 sm:text-3xl lg:w-20 lg:h-20 lg:text-4xl'
    };

    return (
        <div
            className={`
                flex items-center justify-center rounded-full
                transition-transform duration-200 hover:scale-110
                ${sizeClasses[size]}
                bg-gradient-to-br ${identity.bgGradient}
                border-2 ${identity.borderColor}
                shadow-lg
            `}
        >
            <span>{identity.emoji}</span>
        </div>
    );
};

const OrderingScreen = ({ state, suppliers, onOrder, turnIndex, seasonInfo, lastTurnMetrics }) => {
    const [orders, setOrders] = useState(
        Object.fromEntries(suppliers.map(s => [s.id, 0]))
    );
    const confirmBtnRef = useRef(null);

    const handleOrderChange = (id, val) => {
        setOrders(prev => ({ ...prev, [id]: val }));
    };

    const submitOrder = () => {
        onOrder(orders);
    };

    // Helper to visualize inventory buckets
    const renderInventoryShelf = () => {
        const shelves = [...state.inventory].map((qty, idx) => ({
            qty,
            daysLeft: idx + 1,
            isSpoiling: idx === 0,
            colorClass: idx === 0 ? 'bg-red-600 border-red-800' :
                idx === 1 ? 'bg-orange-500 border-orange-700' :
                    idx === 2 ? 'bg-amber-500 border-amber-700' :
                        'bg-emerald-600 border-emerald-800'
        })).reverse();

        return (
            <div className="flex bg-slate-800 rounded-lg sm:rounded-xl border-2 sm:border-4 border-slate-700 shadow-2xl relative overflow-hidden w-full h-full flex-row lg:flex-col p-1.5 sm:p-2 lg:p-4 gap-1 sm:gap-2 lg:gap-3 items-stretch justify-between">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent),radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]"></div>

                <h3 className="hidden lg:block relative text-emerald-400 text-center font-black text-sm lg:text-lg mb-1 lg:mb-2 border-b-2 border-slate-600 pb-1 lg:pb-2 tracking-wider">INVENTORY</h3>

                <div className="relative flex-1 flex flex-row lg:flex-col justify-between gap-0.5 sm:gap-1">
                    <div className="hidden lg:block text-[8px] lg:text-[10px] text-emerald-200 text-center font-mono uppercase tracking-widest mb-1">Fresh (5 Days)</div>

                    {shelves.map((shelf, i) => (
                        <div key={i} className={`relative p-1 sm:p-2 lg:p-3 rounded-md sm:rounded-lg border-b-2 sm:border-b-4 transition-all duration-300 flex-1 lg:flex-none flex items-center justify-center lg:justify-between ${shelf.colorClass} shadow-lg`}>
                            <div className="flex flex-col items-center">
                                <Package className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 ${shelf.isSpoiling && shelf.qty > 0 ? 'text-white animate-pulse' : 'text-white'}`} />
                                <span className="hidden lg:inline text-[8px] lg:text-[10px] font-bold text-white/80">{shelf.daysLeft}d left</span>
                                <span className="lg:hidden text-[6px] sm:text-[8px] font-bold text-white/80">{shelf.daysLeft}d</span>
                            </div>

                            <div className="font-mono text-sm sm:text-lg lg:text-2xl font-bold text-white drop-shadow-md ml-0.5 sm:ml-1 lg:ml-0">
                                {Math.round(shelf.qty)}
                            </div>

                            {shelf.isSpoiling && shelf.qty > 0 && (
                                <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 bg-red-600 text-white rounded-full p-0.5 sm:p-1 shadow-lg animate-bounce z-10">
                                    <AlertTriangle size={8} className="sm:hidden" />
                                    <AlertTriangle size={12} className="hidden sm:block" />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="hidden lg:block text-[8px] lg:text-[10px] text-red-300 text-center mt-1 lg:mt-2 font-mono uppercase tracking-widest font-bold">Expiring Soon!</div>
                </div>
            </div>
        );
    };

    // Helper for Pipeline Road with supplier colors
    const renderPipeline = () => {
        return (
            <div className="h-28 sm:h-36 lg:h-44 bg-slate-800 border-t-4 sm:border-t-8 border-slate-900 relative flex items-center w-full shrink-0">
                <div className="absolute inset-0 bg-slate-800"></div>
                <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 sm:border-t-4 border-dashed border-slate-600"></div>

                <div className="flex-1 flex flex-row-reverse items-center justify-start gap-4 sm:gap-8 lg:gap-12 px-2 sm:px-4 lg:px-12 overflow-x-auto h-full w-full pb-4 sm:pb-6 pt-6 sm:pt-8">

                    {(() => {
                        let allTrucks = [];
                        suppliers.forEach(supp => {
                            const pipe = state.pipelines[supp.id];
                            const identity = SUPPLIER_IDENTITY[supp.id] || SUPPLIER_IDENTITY[0];
                            if (pipe) {
                                pipe.pipeline.forEach((qty, idx) => {
                                    if (qty > 0) {
                                        allTrucks.push({
                                            id: supp.id,
                                            name: supp.name,
                                            qty,
                                            daysOut: idx + 1,
                                            identity: identity,
                                        });
                                    }
                                });
                            }
                        });

                        allTrucks.sort((a, b) => a.daysOut - b.daysOut);

                        if (allTrucks.length === 0) return <div className="text-slate-600 font-bold text-sm sm:text-lg lg:text-xl italic mx-auto">NO INCOMING ORDERS</div>;

                        return allTrucks.map((truck, i) => (
                            <div key={i} className="relative group shrink-0 transform transition-all hover:scale-110 cursor-pointer min-w-[60px] sm:min-w-[70px] lg:min-w-[80px]">
                                <div className="absolute -top-5 sm:-top-6 lg:-top-7 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] lg:text-xs font-bold text-slate-300 whitespace-nowrap bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-slate-600 z-20 shadow-lg">
                                    {truck.daysOut === 1 ? 'Tomorrow' : `In ${truck.daysOut} Days`}
                                </div>

                                <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg border-2 ${truck.identity.bgColor} ${truck.identity.borderColor} flex flex-col items-center gap-0.5 sm:gap-1 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-slate-800`}>
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                        <span className="text-sm sm:text-base lg:text-lg">{truck.identity.emoji}</span>
                                        <Truck className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${truck.identity.truckColor}`} />
                                    </div>
                                    <span className="font-black text-white text-sm sm:text-base lg:text-lg font-mono">{Math.round(truck.qty)}</span>
                                </div>

                                <div className={`text-[8px] sm:text-[10px] uppercase font-bold text-center mt-0.5 sm:mt-1 ${truck.identity.textColor} opacity-70`}>{truck.name.split(' ')[0]}</div>
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
            <div className="h-12 sm:h-14 lg:h-16 bg-slate-900 flex items-center px-2 sm:px-4 lg:px-8 justify-between shadow-lg border-b border-slate-800 z-30 shrink-0">
                <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-md sm:rounded-lg font-black text-xs sm:text-sm lg:text-lg text-white shadow-lg shadow-emerald-900/30 flex items-center gap-1 sm:gap-2">
                        <Zap size={12} className="sm:hidden text-yellow-300" />
                        <Zap size={16} className="hidden sm:block text-yellow-300" />
                        <span>TURN {turnIndex}</span>
                        <span className="text-emerald-200 text-[10px] sm:text-xs">/ 20</span>
                    </div>

                    <div className={`flex items-center gap-1 sm:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 rounded-full border text-[10px] sm:text-xs lg:text-sm ${seasonInfo.factor > 1.0 ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300' : 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'}`}>
                        <Calendar size={10} className="sm:hidden" />
                        <Calendar size={14} className="hidden sm:block lg:hidden" />
                        <Calendar size={18} className="hidden lg:block" />
                        <span className="font-bold tracking-wide">{seasonInfo.name}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
                    <div className="text-right">
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold">Stock</div>
                        <div className="font-mono text-sm sm:text-lg lg:text-2xl font-bold text-emerald-400">{Math.round(state.total_inventory)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold">Backorders</div>
                        <div className="font-mono text-sm sm:text-lg lg:text-2xl font-bold text-red-500">{Math.round(state.backorders)}</div>
                    </div>
                </div>
            </div>

            {/* Comparison Metrics */}
            {lastTurnMetrics && (
                <div className="bg-slate-900/50 border-b border-white/5 py-1 px-2 sm:px-4 flex justify-center gap-2 sm:gap-4 lg:gap-8 text-[9px] sm:text-[10px] lg:text-xs shrink-0">
                    <span className="text-slate-400">LAST ROUND:</span>
                    <span className={lastTurnMetrics.userCost <= lastTurnMetrics.rlCost ? 'text-green-400' : 'text-red-400'}>
                        You: ${lastTurnMetrics.userCost.toFixed(2)}
                    </span>
                    <span className="text-slate-500">vs</span>
                    <span className="text-blue-400">AI: ${lastTurnMetrics.rlCost.toFixed(2)}</span>
                </div>
            )}

            {/* Main Gameplay Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

                {/* Left: Inventory */}
                <div className="h-16 sm:h-20 lg:h-auto lg:w-48 xl:w-64 bg-slate-900 p-1.5 sm:p-2 lg:p-4 xl:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 shadow-xl z-20 shrink-0 overflow-x-auto lg:overflow-visible">
                    {renderInventoryShelf()}
                </div>

                {/* Center: Ordering Terminal */}
                <div className="flex-1 relative flex flex-col items-center justify-start lg:justify-center p-2 sm:p-4 lg:p-6 xl:p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 overflow-y-auto">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"></div>

                    <div className="relative z-10 w-full max-w-4xl bg-slate-800/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-slate-600/50 flex flex-col xl:flex-row my-auto">

                        {/* Terminal Left: Suppliers */}
                        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 flex-1">
                            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2 sm:gap-3 text-white border-b border-slate-600 pb-2 sm:pb-3 lg:pb-4">
                                <ShoppingCart className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                                <span>Procurement</span>
                            </h2>

                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                {suppliers.map(s => {
                                    const identity = SUPPLIER_IDENTITY[s.id] || SUPPLIER_IDENTITY[0];
                                    return (
                                        <div key={s.id} className={`group relative p-2.5 sm:p-3 lg:p-4 xl:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${orders[s.id] > 0 ? `bg-slate-700/80 ${identity.borderColor} shadow-lg` : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'}`}>
                                            {/* Supplier Header with Avatar */}
                                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                                                <SupplierAvatar identity={identity} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-black text-sm sm:text-base lg:text-lg xl:text-xl ${identity.textColor} truncate`}>{identity.name}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-400 italic truncate">{identity.tagline}</div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={`bg-slate-900 border ${identity.borderColor} px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-mono text-sm sm:text-base lg:text-lg ${identity.textColor}`}>
                                                        ${s.cost}<span className="text-[8px] sm:text-[10px] text-slate-500">/unit</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Supplier Stats */}
                                            <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3 lg:mb-4 text-[10px] sm:text-xs text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={10} className="sm:hidden" />
                                                    <Clock size={12} className="hidden sm:block" />
                                                    <span>Lead: <span className={`font-bold ${identity.textColor}`}>{s.lead_time}d</span></span>
                                                </div>
                                            </div>

                                            {/* Stepper Control */}
                                            <OrderStepper
                                                value={orders[s.id]}
                                                onChange={(val) => handleOrderChange(s.id, val)}
                                                supplier={s}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Terminal Right: Summary */}
                        <div className="bg-slate-900/80 p-3 sm:p-4 lg:p-6 xl:p-8 w-full xl:w-72 border-t xl:border-t-0 xl:border-l border-slate-700 flex flex-col justify-between gap-3 sm:gap-4">
                            <div className="flex-1">
                                <h3 className="text-[10px] sm:text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 lg:mb-4">Order Summary</h3>

                                {/* Individual supplier orders */}
                                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                    {suppliers.map(s => {
                                        const identity = SUPPLIER_IDENTITY[s.id] || SUPPLIER_IDENTITY[0];
                                        if (orders[s.id] === 0) return null;
                                        return (
                                            <div key={s.id} className="flex justify-between items-center text-xs sm:text-sm">
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    <span>{identity.emoji}</span>
                                                    <span className="text-slate-400">×{orders[s.id]}</span>
                                                </div>
                                                <span className={`font-mono ${identity.textColor}`}>${(orders[s.id] * s.cost).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Total */}
                                <div className="border-t border-slate-700 pt-2 sm:pt-3 lg:pt-4">
                                    <div className="flex justify-between text-base sm:text-lg lg:text-xl font-bold">
                                        <span>Total Cost</span>
                                        <span className="text-emerald-400 font-mono">
                                            ${suppliers.reduce((sum, s) => sum + (orders[s.id] * s.cost), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] sm:text-xs lg:text-sm text-slate-400 mt-1">
                                        <span>Total Units</span>
                                        <span className="font-mono">
                                            {suppliers.reduce((sum, s) => sum + orders[s.id], 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                ref={confirmBtnRef}
                                onClick={submitOrder}
                                className="w-full bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black py-3 sm:py-4 lg:py-5 rounded-lg sm:rounded-xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_6px_0_#1d4ed8] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[6px] transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg xl:text-xl"
                            >
                                <span>CONFIRM ORDER</span>
                                <TrendingUp size={18} className="sm:hidden" />
                                <TrendingUp size={24} className="hidden sm:block" />
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
