import React, { useState, useEffect, useMemo } from 'react';
import { PerishableInventoryMDP } from './engine/Simulation';
import { InventoryState, SupplierPipeline } from './engine/State';
import { CostParameters } from './engine/Costs';
import OrderingScreen from './components/OrderingScreen';
import ShopView from './components/ShopView';
import ResultsScreen from './components/ResultsScreen';
import StartScreen from './components/StartScreen';
import TutorialScreen from './components/TutorialScreen';
import ConfirmationModal from './components/ConfirmationModal';
import LeaderboardScreen from './components/LeaderboardScreen';

// Load Traces - Single best trace per difficulty (AI plays without events)
import traceSimple from './assets/trace_simple.json';
import traceModerate from './assets/trace_moderate.json';
import traceComplex from './assets/trace_complex.json';

const TRACES = {
  simple: traceSimple,
  moderate: traceModerate,
  complex: traceComplex
};

// Event system configuration (player-only challenges)
// Guaranteed number of events per playthrough
const EVENT_CONFIG = {
  simple: {
    surgeCount: 0,        // No events on simple
    extremeSurgeCount: 0,
    slumpCount: 0
  },
  moderate: {
    surgeCount: 2,        // 2 guaranteed surges
    extremeSurgeCount: 0,
    slumpCount: 1         // 1 guaranteed slump
  },
  complex: {
    surgeCount: 3,        // 3 guaranteed surges
    extremeSurgeCount: 1, // 1 guaranteed extreme surge
    slumpCount: 1         // 1 guaranteed slump
  }
};

// Generate scheduled events for a playthrough
const generateEventSchedule = (scenario, episodeLength) => {
  const config = EVENT_CONFIG[scenario];
  const schedule = {}; // { turnIndex: eventType }

  const totalEvents = config.surgeCount + config.extremeSurgeCount + config.slumpCount;
  if (totalEvents === 0) return schedule;

  // Get available turns (skip first 2 and last 2 turns for fairness)
  const availableTurns = [];
  for (let i = 2; i < episodeLength - 2; i++) {
    availableTurns.push(i);
  }

  // Shuffle available turns
  for (let i = availableTurns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableTurns[i], availableTurns[j]] = [availableTurns[j], availableTurns[i]];
  }

  // Assign events to turns
  let turnIdx = 0;

  // Extreme surges first (more impactful)
  for (let i = 0; i < config.extremeSurgeCount && turnIdx < availableTurns.length; i++) {
    schedule[availableTurns[turnIdx++]] = 'extreme_surge';
  }

  // Regular surges
  for (let i = 0; i < config.surgeCount && turnIdx < availableTurns.length; i++) {
    schedule[availableTurns[turnIdx++]] = 'surge';
  }

  // Slumps
  for (let i = 0; i < config.slumpCount && turnIdx < availableTurns.length; i++) {
    schedule[availableTurns[turnIdx++]] = 'slump';
  }

  return schedule;
};

// --- CONFIG ---
const SHELF_LIFE = 5;
const COST_PARAMS = new CostParameters({
  holding_costs: new Array(SHELF_LIFE).fill(0.5),
  shortage_cost: 10.0,
  spoilage_cost: 5.0
});
const DEFAULT_EPISODE_LENGTH = 20;

// Default suppliers (used if trace doesn't have them)
const DEFAULT_SUPPLIERS = [
  { id: 0, name: "Fast Supplier", lead_time: 1, cost: 2.0 },
  { id: 1, name: "Slow Supplier", lead_time: 3, cost: 1.0 }
];

function App() {
  const [gameState, setGameState] = useState('SCENARIO_SELECT');
  const [turnIndex, setTurnIndex] = useState(0);
  const [scenario, setScenario] = useState('simple');
  const [activeTrace, setActiveTrace] = useState(TRACES.simple);
  const [showExitModal, setShowExitModal] = useState(false);

  // Event system state (player-only challenges)
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventSchedule, setEventSchedule] = useState({}); // { turnIndex: eventType }
  const [showEventPopup, setShowEventPopup] = useState(false); // Show popup when new event starts
  // activeEvent = { type: 'surge' | 'extreme_surge' | 'slump', modifier: number, endChance: number, turnsActive: number }

  // Get suppliers from trace metadata or use defaults
  const suppliers = useMemo(() => {
    return activeTrace?.metadata?.suppliers || DEFAULT_SUPPLIERS;
  }, [activeTrace]);

  // MDP Engine - recreated when suppliers change
  const mdp = useMemo(() => new PerishableInventoryMDP({
    shelf_life: SHELF_LIFE,
    suppliers: suppliers,
    cost_params: COST_PARAMS
  }), [suppliers]);

  // Get episode length from trace or use default
  const episodeLength = activeTrace?.metadata?.episode_length || DEFAULT_EPISODE_LENGTH;

  const [inventoryState, setInventoryState] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [lastTurnResult, setLastTurnResult] = useState(null);

  // Get event for current turn from schedule
  const getEventForTurn = (turn) => {
    // Check if there's an active event that might continue
    if (activeEvent) {
      const roll = Math.random();
      if (roll < activeEvent.endChance) {
        // Event ends
        return null;
      } else {
        // Event continues, chance to end increases
        return {
          ...activeEvent,
          endChance: Math.min(0.9, activeEvent.endChance + 0.2),
          turnsActive: activeEvent.turnsActive + 1
        };
      }
    }

    // Check schedule for new event
    const scheduledType = eventSchedule[turn];
    if (!scheduledType) return null;

    const eventModifiers = {
      'extreme_surge': { type: 'extreme_surge', modifier: 3.0, endChance: 0.4, turnsActive: 1 },
      'surge': { type: 'surge', modifier: 2.0, endChance: 0.2, turnsActive: 1 },
      'slump': { type: 'slump', modifier: 0.5, endChance: 0.3, turnsActive: 1 }
    };

    return eventModifiers[scheduledType] || null;
  };

  // Select Scenario - set trace directly and generate event schedule
  const handleSelectScenario = (selectedId) => {
    setScenario(selectedId);
    setActiveTrace(TRACES[selectedId]);
    setActiveEvent(null);

    // Generate event schedule for this playthrough
    const traceEpisodeLength = TRACES[selectedId]?.metadata?.episode_length || DEFAULT_EPISODE_LENGTH;
    const schedule = generateEventSchedule(selectedId, traceEpisodeLength);
    setEventSchedule(schedule);
    // Check if user has seen tutorial before (localStorage)
    const hasSeenTutorial = localStorage.getItem('stockout_tutorial_seen');
    if (hasSeenTutorial) {
      setGameState('START');
    } else {
      setGameState('TUTORIAL');
    }
  };

  // Handle Back to Menu with Confirmation
  const handleBack = () => {
    if (turnIndex >= 1) {
      setShowExitModal(true);
    } else {
      setGameState('SCENARIO_SELECT');
    }
  };

  const confirmExit = () => {
    setShowExitModal(false);
    setGameState('SCENARIO_SELECT');
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    localStorage.setItem('stockout_tutorial_seen', 'true');
    setGameState('START');
  };

  // Handle tutorial skip
  const handleTutorialSkip = () => {
    localStorage.setItem('stockout_tutorial_seen', 'true');
    setGameState('START');
  };

  // Initialize Game
  useEffect(() => {
    // Check for hidden leaderboard route (handle potential trailing slash)
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/leaderboard') {
      setGameState('LEADERBOARD');
      return;
    }

    if (gameState === 'START') {
      let initial = mdp.create_initial_state();

      // Start with 30 units of fresh inventory
      const freshStock = 30;
      initial.inventory[SHELF_LIFE - 1] = freshStock;

      setInventoryState(initial);
      setTurnIndex(0);
      setUserHistory([]);
      setGameState('ORDERING');
    }
  }, [gameState, mdp]);

  // Handle Order Submission
  const handleOrder = (orders) => {
    const traceTurn = activeTrace.turns[turnIndex];
    const baseDemand = traceTurn ? traceTurn.environment_outcome.demand : 10;

    // Apply event modifier (player-only challenge)
    const eventModifier = activeEvent?.modifier || 1.0;
    const actualDemand = Math.round(baseDemand * eventModifier);

    const action = {};
    Object.keys(orders).forEach(k => action[parseInt(k)] = orders[k]);

    const result = mdp.step(inventoryState, action, actualDemand);

    setInventoryState(result.next_state);
    setLastTurnResult({
      ...result,
      cost: result.costs.total_cost,
      baseDemand: baseDemand,
      actualDemand: actualDemand,
      eventModifier: eventModifier
    });

    const historyEntry = {
      turn: turnIndex,
      demand: actualDemand, // Track actual demand player faced
      baseDemand: baseDemand,
      sales: result.sales,
      spoilage: result.spoiled,
      cost: result.costs.total_cost,
      orders: action,
      hadEvent: activeEvent !== null
    };

    const newHistory = [...userHistory, historyEntry];
    setUserHistory(newHistory);

    setGameState('SHOP_VIEW');
  };

  // Handle Next Turn Transition
  const handleNextTurn = () => {
    const nextTurn = turnIndex + 1;
    if (nextTurn >= episodeLength) {
      setGameState('RESULTS');
    } else {
      // Check for events on the next turn
      const nextEvent = getEventForTurn(nextTurn);
      setActiveEvent(nextEvent);

      // Show popup if this is a NEW event (not a continuation)
      if (nextEvent && nextEvent.turnsActive === 1) {
        setShowEventPopup(true);
      }

      setTurnIndex(nextTurn);
      setGameState('ORDERING');
    }
  };

  if (gameState === 'SCENARIO_SELECT') {
    return (
      <StartScreen
        onSelectScenario={handleSelectScenario}
        onShowLeaderboard={() => setGameState('LEADERBOARD')}
      />
    );
  }

  if (gameState === 'TUTORIAL') {
    return (
      <TutorialScreen
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    );
  }

  if (gameState === 'ORDERING' && inventoryState) {
    const traceTurn = activeTrace.turns[turnIndex];

    // Season info now comes from active event, not trace
    const seasonInfo = activeEvent ? {
      name: activeEvent.type === 'extreme_surge' ? 'EXTREME SURGE!' :
        activeEvent.type === 'surge' ? 'Demand Surge!' : 'Demand Slump',
      factor: activeEvent.modifier,
      endChance: Math.round(activeEvent.endChance * 100)
    } : {
      name: 'Normal',
      factor: 1.0,
      endChance: null
    };

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

    const totalPaidCost = userHistory.reduce((sum, h) => sum + h.cost, 0);

    return (
      <>
        <OrderingScreen
          state={inventoryState}
          suppliers={suppliers}
          onOrder={handleOrder}
          turnIndex={turnIndex + 1}
          seasonInfo={seasonInfo}
          lastTurnMetrics={lastTurnMetrics}
          onBack={handleBack}
          totalPaidCost={totalPaidCost}
          totalTurns={episodeLength}
          activeEvent={activeEvent}
          showEventPopup={showEventPopup}
          onDismissEventPopup={() => setShowEventPopup(false)}
        />
        <ConfirmationModal
          isOpen={showExitModal}
          title="Exit Game?"
          message="Are you sure you want to quit? All current progress will be lost and you'll have to start over."
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      </>
    );
  }

  if (gameState === 'SHOP_VIEW' && lastTurnResult) {
    const traceTurn = activeTrace.turns[turnIndex];

    // Season info from active event (same as ordering screen)
    const seasonInfo = activeEvent ? {
      name: activeEvent.type === 'extreme_surge' ? 'EXTREME SURGE!' :
        activeEvent.type === 'surge' ? 'Demand Surge!' : 'Demand Slump',
      factor: activeEvent.modifier,
      endChance: Math.round(activeEvent.endChance * 100)
    } : {
      name: 'Normal',
      factor: 1.0,
      endChance: null
    };

    const rlOutcome = traceTurn?.environment_outcome;
    const aiComparison = rlOutcome ? {
      cost: rlOutcome.cost,
      spoilage: rlOutcome.spoilage
    } : null;

    return (
      <>
        <ShopView
          turnResult={lastTurnResult}
          seasonInfo={seasonInfo}
          onNextTurn={handleNextTurn}
          aiComparison={aiComparison}
          activeEvent={activeEvent}
          history={userHistory}
          rlTrace={activeTrace}
          onBack={handleBack}
        />
        <ConfirmationModal
          isOpen={showExitModal}
          title="Exit Game?"
          message="Are you sure you want to quit? All current progress will be lost and you'll have to start over."
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      </>
    );
  }

  if (gameState === 'RESULTS') {
    return (
      <ResultsScreen
        userHistory={userHistory}
        rlTrace={activeTrace}
        scenario={scenario}
        onRestart={() => setGameState('SCENARIO_SELECT')}
      />
    );
  }

  if (gameState === 'LEADERBOARD') {
    return <LeaderboardScreen onBack={() => setGameState('SCENARIO_SELECT')} />;
  }

  return (
    <>
      <div className="flex h-screen items-center justify-center bg-black text-white">Initializing Simulation...</div>

      <ConfirmationModal
        isOpen={showExitModal}
        title="Exit Game?"
        message="Are you sure you want to quit? All current progress will be lost and you'll have to start over."
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </>
  );
}

export default App;
