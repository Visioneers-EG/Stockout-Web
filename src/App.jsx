import React, { useState, useEffect } from 'react';
import { PerishableInventoryMDP } from './engine/Simulation';
import { InventoryState, SupplierPipeline } from './engine/State';
import { CostParameters } from './engine/Costs';
import OrderingScreen from './components/OrderingScreen';
import ShopView from './components/ShopView';
import ResultsScreen from './components/ResultsScreen';
import StartScreen from './components/StartScreen';

// Load Traces
import traceSimple from './assets/trace_simple.json';
import traceModerate from './assets/trace_moderate.json';
import traceComplex from './assets/trace_complex.json';
import traceExtreme from './assets/trace_extreme.json';

// --- CONFIG ---
const SHELF_LIFE = 5;
const SUPPLIERS = [
  { id: 0, name: "Fast Supplier", lead_time: 1, cost: 2.0 }, // Expensive, Fast
  { id: 1, name: "Slow Supplier", lead_time: 3, cost: 1.0 }  // Cheap, Slow
];
const COST_PARAMS = new CostParameters({
  holding_costs: new Array(SHELF_LIFE).fill(0.5), // Matches config.json
  shortage_cost: 10.0,
  spoilage_cost: 5.0
});
const EPISODE_LENGTH = 20; // Short for fun gameplay

const TRACES = {
  simple: traceSimple,
  moderate: traceModerate,
  complex: traceComplex,
  extreme: traceExtreme
};

function App() {
  const [gameState, setGameState] = useState('SCENARIO_SELECT'); // SCENARIO_SELECT, START, ORDERING, SHOP_VIEW, RESULTS
  const [turnIndex, setTurnIndex] = useState(0);
  const [scenario, setScenario] = useState('simple');
  const [activeTrace, setActiveTrace] = useState(traceSimple);

  // MDP Engine State
  const [mdp] = useState(() => new PerishableInventoryMDP({
    shelf_life: SHELF_LIFE,
    suppliers: SUPPLIERS,
    cost_params: COST_PARAMS
  }));

  const [inventoryState, setInventoryState] = useState(null);

  // History for Results
  const [userHistory, setUserHistory] = useState([]);
  const [lastTurnResult, setLastTurnResult] = useState(null);

  // Select Scenario
  const handleSelectScenario = (selectedId) => {
    setScenario(selectedId);
    setActiveTrace(TRACES[selectedId]);
    setGameState('START');
  };

  // Initialize Game
  useEffect(() => {
    if (gameState === 'START') {
      let initial = mdp.create_initial_state();

      // Start with 30 units of fresh inventory
      const freshStock = 30;
      // Add to newest bucket (index 4 for shelf life 5)
      initial.inventory[SHELF_LIFE - 1] = freshStock;

      // Note: total_inventory and inventory_position are getters, so we don't set them manually.
      // They will automatically calculate based on initial.inventory.

      setInventoryState(initial);
      setTurnIndex(0);
      setUserHistory([]);
      setGameState('ORDERING');
    }
  }, [gameState, mdp]);

  // Handle Order Submission
  const handleOrder = (orders) => {
    // 1. Get Demand from Trace for current turn
    const traceTurn = activeTrace.turns[turnIndex];
    // fallback if trace is shorter than episode, though it shouldn't be
    const demand = traceTurn ? traceTurn.environment_outcome.demand : 10;

    // 2. Run Simulation Step
    const action = {};
    Object.keys(orders).forEach(k => action[parseInt(k)] = orders[k]);

    const result = mdp.step(inventoryState, action, demand);

    // 3. Update State
    setInventoryState(result.next_state);
    setLastTurnResult({
      ...result,
      cost: result.costs.total_cost
    });

    // 4. Log History
    const historyEntry = {
      turn: turnIndex,
      demand: demand,
      sales: result.sales,
      spoilage: result.spoiled,
      cost: result.costs.total_cost,
      orders: action
    };

    const newHistory = [...userHistory, historyEntry];
    setUserHistory(newHistory);

    // 5. Transition
    setGameState('SHOP_VIEW');
  };

  // Handle Next Turn Transition
  const handleNextTurn = () => {
    const nextTurn = turnIndex + 1;
    if (nextTurn >= EPISODE_LENGTH) {
      setGameState('RESULTS');
    } else {
      setTurnIndex(nextTurn);
      setGameState('ORDERING');
    }
  };

  if (gameState === 'SCENARIO_SELECT') {
    return <StartScreen onSelectScenario={handleSelectScenario} />;
  }

  // Render Based on State
  if (gameState === 'ORDERING' && inventoryState) {
    // Get Season Info from trace
    const traceTurn = activeTrace.turns[turnIndex];
    const seasonInfo = {
      name: traceTurn?.season_name || 'Normal',
      factor: traceTurn?.season_factor || 1.0
    };

    // Get Last Turn Metrics for Comparison
    let lastTurnMetrics = null;
    if (turnIndex > 0) {
      const prevUser = userHistory[turnIndex - 1];
      const prevRL = activeTrace.turns[turnIndex - 1]?.environment_outcome;
      if (prevUser && prevRL) {
        lastTurnMetrics = {
          userCost: prevUser.cost,
          rlCost: prevRL.cost
        };
      }
    }

    return (
      <OrderingScreen
        state={inventoryState}
        suppliers={SUPPLIERS}
        onOrder={handleOrder}
        turnIndex={turnIndex + 1}
        seasonInfo={seasonInfo}
        lastTurnMetrics={lastTurnMetrics}
      />
    );
  }

  if (gameState === 'SHOP_VIEW' && lastTurnResult) {
    const traceTurn = activeTrace.turns[turnIndex];
    const seasonInfo = {
      name: traceTurn?.season_name || 'Normal',
      factor: traceTurn?.season_factor || 1.0
    };

    const rlOutcome = traceTurn?.environment_outcome;
    const aiComparison = rlOutcome ? {
      cost: rlOutcome.cost,
      spoilage: rlOutcome.spoilage
    } : null;

    return (
      <ShopView
        turnResult={lastTurnResult}
        seasonInfo={seasonInfo}
        onNextTurn={handleNextTurn}
        aiComparison={aiComparison}
        history={userHistory}
        rlTrace={activeTrace}
      />
    );
  }

  if (gameState === 'RESULTS') {
    return (
      <ResultsScreen
        userHistory={userHistory}
        rlTrace={activeTrace}
        onRestart={() => setGameState('SCENARIO_SELECT')}
      />
    );
  }

  return <div className="flex h-screen items-center justify-center bg-black text-white">Initializing Simulation...</div>;
}

export default App;
