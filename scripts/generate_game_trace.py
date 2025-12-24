"""
Generate Game Traces for Multiple Scenarios (Simplified - No Seasons)

This script:
1. Uses a heuristic Base-Stock policy AI
2. Generates 50 traces per difficulty with NO seasonal variation
3. Keeps only the BEST (lowest cost) trace per difficulty
4. Seasons are handled as player-only events in the frontend
"""

import json
import random
import numpy as np
from pathlib import Path

# Global Config
SHELF_LIFE = 5
INITIAL_INVENTORY = 30
TRACES_TO_GENERATE = 50  # Generate many, keep best

# Supplier configurations per scenario
SUPPLIER_CONFIGS = {
    "simple": [
        {"id": 0, "name": "Fast Supplier", "lead_time": 1, "cost": 2.0},
        {"id": 1, "name": "Slow Supplier", "lead_time": 3, "cost": 1.0}
    ],
    "moderate": [
        {"id": 0, "name": "Express", "lead_time": 1, "cost": 2.5},
        {"id": 2, "name": "Standard", "lead_time": 2, "cost": 1.5},
        {"id": 1, "name": "Economy", "lead_time": 4, "cost": 0.8}
    ],
    "complex": [
        {"id": 0, "name": "Premium", "lead_time": 1, "cost": 3.0},
        {"id": 2, "name": "Express", "lead_time": 2, "cost": 2.0},
        {"id": 1, "name": "Standard", "lead_time": 3, "cost": 1.2},
        {"id": 3, "name": "Budget", "lead_time": 5, "cost": 0.6}
    ]
}

# Scenario definitions (NO seasonal patterns - steady demand for AI)
SCENARIO_CONFIG = {
    "simple": {
        "base_demand": 10.0,
        "demand_cv": 0.15,  # Low variance for simple
        "episode_length": 15,
        "description": "Steady demand, 2 suppliers"
    },
    "moderate": {
        "base_demand": 12.0,
        "demand_cv": 0.25,  # Moderate variance
        "episode_length": 20,
        "description": "Variable demand, 3 suppliers"
    },
    "complex": {
        "base_demand": 15.0,
        "demand_cv": 0.3,  # Higher variance
        "episode_length": 20,
        "description": "High variance, 4 suppliers"
    }
}


def generate_demand(base_demand, cv, rng):
    """Generate demand with noise (no seasonal adjustment)."""
    std_dev = base_demand * cv
    if std_dev > 0:
        shape = (base_demand / std_dev) ** 2
        scale = (std_dev ** 2) / base_demand
        demand = rng.gamma(shape, scale)
    else:
        demand = base_demand
    return max(1, round(demand))


class InventorySimulator:
    """Simulates inventory dynamics for the heuristic AI."""
    
    def __init__(self, suppliers, shelf_life=5):
        self.suppliers = sorted(suppliers, key=lambda s: s["cost"])
        self.shelf_life = shelf_life
        self.inventory = [0] * shelf_life
        self.inventory[-1] = INITIAL_INVENTORY
        self.pipelines = {s["id"]: [0] * s["lead_time"] for s in suppliers}
        self.backorders = 0
        
        self.holding_cost = 0.5
        self.shortage_cost = 10.0
        self.spoilage_cost = 5.0
    
    def get_total_inventory(self):
        return sum(self.inventory)
    
    def get_pipeline_total(self):
        return sum(sum(p) for p in self.pipelines.values())
    
    def get_inventory_position(self):
        return self.get_total_inventory() + self.get_pipeline_total() - self.backorders
    
    def step(self, orders, demand):
        costs = {"purchase": 0, "holding": 0, "shortage": 0, "spoilage": 0}
        
        # Receive arrivals
        arrivals = 0
        for supplier in self.suppliers:
            sid = supplier["id"]
            if self.pipelines[sid]:
                arrivals += self.pipelines[sid][0]
                self.pipelines[sid] = self.pipelines[sid][1:] + [0]
        self.inventory[-1] += arrivals
        
        # Serve demand (FIFO)
        total_demand = demand + self.backorders
        sales = 0
        for i in range(len(self.inventory)):
            available = self.inventory[i]
            sold = min(available, total_demand - sales)
            self.inventory[i] -= sold
            sales += sold
            if sales >= total_demand:
                break
        
        new_backorders = max(0, total_demand - sales)
        costs["holding"] = sum(self.inventory) * self.holding_cost
        costs["shortage"] = new_backorders * self.shortage_cost
        
        # Age inventory
        spoiled = self.inventory[0]
        self.inventory = self.inventory[1:] + [0]
        costs["spoilage"] = spoiled * self.spoilage_cost
        
        # Place orders
        for supplier in self.suppliers:
            sid = supplier["id"]
            qty = orders.get(sid, 0)
            if qty > 0:
                self.pipelines[sid][-1] += qty
                costs["purchase"] += qty * supplier["cost"]
        
        self.backorders = new_backorders
        total_cost = sum(costs.values())
        
        return {
            "costs": costs,
            "total_cost": total_cost,
            "demand": demand,
            "sales": sales,
            "spoilage": spoiled,
            "inventory": self.get_total_inventory(),
            "arrivals": arrivals
        }


class BaseStockPolicy:
    """Heuristic AI using Base-Stock policy."""
    
    def __init__(self, suppliers, base_demand, safety_factor=1.5):
        self.suppliers = sorted(suppliers, key=lambda s: s["cost"])
        self.base_demand = base_demand
        self.max_lead_time = max(s["lead_time"] for s in suppliers)
        self.target_level = base_demand * (self.max_lead_time + safety_factor)
    
    def get_orders(self, inventory_position):
        """Determine orders based on current inventory position."""
        gap = max(0, self.target_level - inventory_position)
        
        if gap <= 0:
            return {s["id"]: 0 for s in self.suppliers}
        
        orders = {}
        remaining_gap = gap
        
        for supplier in self.suppliers:
            if remaining_gap <= 0:
                orders[supplier["id"]] = 0
                continue
            
            if supplier["lead_time"] <= 2:
                order_qty = min(remaining_gap * 0.3, self.base_demand * 0.5)
            else:
                order_qty = min(remaining_gap * 0.5, self.base_demand * 1.5)
            
            order_qty = round(order_qty / 5) * 5
            order_qty = max(0, min(order_qty, remaining_gap))
            
            orders[supplier["id"]] = order_qty
            remaining_gap -= order_qty
        
        return orders


def generate_trace(scenario, seed):
    """Generate a single trace for a scenario with given seed."""
    rng = np.random.default_rng(seed)
    random.seed(seed)
    
    config = SCENARIO_CONFIG[scenario]
    suppliers = SUPPLIER_CONFIGS[scenario]
    episode_length = config["episode_length"]
    
    sim = InventorySimulator(suppliers, SHELF_LIFE)
    policy = BaseStockPolicy(suppliers, config["base_demand"], safety_factor=1.5)
    
    trace = {
        "turns": [],
        "metadata": {
            "scenario": scenario,
            "episode_length": episode_length,
            "base_demand": config["base_demand"],
            "description": config["description"],
            "initial_inventory": INITIAL_INVENTORY,
            "suppliers": suppliers,
            "seed": seed
        }
    }
    
    total_cost = 0
    
    for step in range(episode_length):
        # Generate steady demand (no seasons)
        demand = generate_demand(config["base_demand"], config["demand_cv"], rng)
        
        # AI determines orders
        inventory_position = sim.get_inventory_position()
        orders = policy.get_orders(inventory_position)
        
        # Execute step
        result = sim.step(orders, demand)
        total_cost += result["total_cost"]
        
        turn_data = {
            "step": step,
            "demand": demand,
            "season_name": "Normal",  # No seasons for AI
            "season_factor": 1.0,
            "rl_action": {str(k): float(v) for k, v in orders.items()},
            "environment_outcome": {
                "cost": round(result["total_cost"], 2),
                "sales": result["sales"],
                "spoilage": result["spoilage"],
                "inventory": result["inventory"],
                "demand": demand
            }
        }
        trace["turns"].append(turn_data)
    
    trace["metadata"]["total_ai_cost"] = round(total_cost, 2)
    return trace


def generate_best_traces(output_dir):
    """Generate multiple traces per scenario, keep only the best."""
    output_path = Path(output_dir)
    
    # Clean up old traces directory if exists
    traces_dir = output_path / "traces"
    if traces_dir.exists():
        import shutil
        shutil.rmtree(traces_dir)
    
    scenarios = ["simple", "moderate", "complex"]
    
    for scenario in scenarios:
        print(f"\nGenerating {TRACES_TO_GENERATE} traces for {scenario}...")
        
        best_trace = None
        best_cost = float('inf')
        
        for i in range(TRACES_TO_GENERATE):
            seed = hash(f"{scenario}_{i}_v2") % (2**32)
            trace = generate_trace(scenario, seed)
            cost = trace["metadata"]["total_ai_cost"]
            
            if cost < best_cost:
                best_cost = cost
                best_trace = trace
                print(f"  > New best: ${cost:.2f} (seed {i})")
        
        # Save only the best trace
        out_file = output_path / f"trace_{scenario}.json"
        with open(out_file, "w") as f:
            json.dump(best_trace, f, indent=2)
        
        print(f"  > Best trace saved: ${best_cost:.2f}")
    
    print(f"\nBest traces saved to {output_path}")


if __name__ == "__main__":
    OUTPUT_DIR = str(Path(__file__).parent.parent / "src" / "assets")
    generate_best_traces(OUTPUT_DIR)
