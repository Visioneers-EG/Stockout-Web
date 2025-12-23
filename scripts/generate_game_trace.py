"""
Generate Game Traces for Multiple Scenarios

This script:
1. Loads the trained RL model (best_model_uwu.zip)
2. Generates 3 distinct traces (Simple, Moderate, Complex)
3. Moderate/Complex have more suppliers for added difficulty
4. Adds seasonal info (season_name, season_factor) to each turn
5. Saves them to src/assets/trace_{scenario}.json
"""

import sys
import json
import math
import numpy as np
from pathlib import Path

# Add parent repo to path for imports
REPO_PATH = Path(__file__).parent.parent.parent / "Multi-Supplier-Perishable-Inventory"
sys.path.insert(0, str(REPO_PATH))
sys.path.insert(0, str(REPO_PATH / "colab_training")) 

from stable_baselines3 import PPO
from gym_env import create_gym_env, PerishableInventoryGymWrapper
from perishable_inventory_mdp.demand import PoissonDemand, NegativeBinomialDemand

# Global Config
SHELF_LIFE = 5
EPISODE_LENGTH = 20
INITIAL_INVENTORY = 30  # Start with 30 units (same as player)

# Supplier configurations per scenario
SUPPLIER_CONFIGS = {
    "simple": [
        {"id": 0, "name": "Fast Supplier", "lead_time": 1, "cost": 2.0},
        {"id": 1, "name": "Slow Supplier", "lead_time": 3, "cost": 1.0}
    ],
    "moderate": [
        {"id": 0, "name": "Express", "lead_time": 1, "cost": 2.5},
        {"id": 1, "name": "Standard", "lead_time": 2, "cost": 1.5},
        {"id": 2, "name": "Economy", "lead_time": 4, "cost": 0.8}
    ],
    "complex": [
        {"id": 0, "name": "Premium", "lead_time": 1, "cost": 3.0},
        {"id": 1, "name": "Express", "lead_time": 2, "cost": 2.0},
        {"id": 2, "name": "Standard", "lead_time": 3, "cost": 1.2},
        {"id": 3, "name": "Budget", "lead_time": 5, "cost": 0.6}
    ]
}

# Scenario definitions with seasonal patterns
SCENARIO_CONFIG = {
    "simple": {
        "base_demand": 10.0,
        "demand_type": "poisson",
        "seasonal_pattern": None,
        "description": "Steady demand, 2 suppliers"
    },
    "moderate": {
        "base_demand": 12.0,
        "demand_type": "negbin",
        "seasonal_pattern": None,
        "description": "High variance, 3 suppliers"
    },
    "complex": {
        "base_demand": 15.0,
        "demand_type": "poisson",
        "seasonal_pattern": "sinusoidal",
        "description": "Seasonal waves, 4 suppliers"
    }
}


def get_season_info(step, demand, base_demand, scenario):
    """Determine season based on step and demand relative to baseline."""
    config = SCENARIO_CONFIG[scenario]
    pattern = config.get("seasonal_pattern")
    
    if pattern == "sinusoidal":
        # Full cycle over 20 steps: Winter at start/end, Summer in middle
        phase = step / EPISODE_LENGTH * 2 * math.pi
        season_factor = 1.0 + 0.5 * math.sin(phase)
        
        if step < 5 or step >= 15:
            season_name = "Winter"
        elif step < 10:
            season_name = "Spring"
        else:
            season_name = "Summer"
    else:
        season_factor = 1.0
        if demand > base_demand * 1.3:
            season_name = "High Demand"
        elif demand < base_demand * 0.7:
            season_name = "Low Demand"
        else:
            season_name = "Normal"
    
    return season_name, round(season_factor, 2)


def create_scenario_env(scenario, seed=42):
    """Create a gym environment tailored for a specific scenario."""
    np.random.seed(seed)
    
    config = SCENARIO_CONFIG[scenario]
    suppliers = SUPPLIER_CONFIGS[scenario]
    base_demand = config["base_demand"]
    demand_type = config["demand_type"]
    
    if demand_type == "poisson":
        demand_process = PoissonDemand(base_rate=base_demand)
    elif demand_type == "negbin":
        # Higher variance for moderate
        demand_process = NegativeBinomialDemand(n_successes=4, prob_success=0.25)
    else:
        demand_process = PoissonDemand(base_rate=base_demand)
    
    # Get lead times and costs from supplier config
    fast_lt = suppliers[0]["lead_time"]
    slow_lt = suppliers[-1]["lead_time"]
    fast_cost = suppliers[0]["cost"]
    slow_cost = suppliers[-1]["cost"]
    
    env = create_gym_env(
        shelf_life=SHELF_LIFE,
        mean_demand=base_demand,
        fast_lead_time=fast_lt,
        slow_lead_time=slow_lt,
        fast_cost=fast_cost,
        slow_cost=slow_cost,
        demand_process=demand_process,
        enable_crisis=False
    )
    return env, suppliers


def set_initial_inventory(env, inventory_qty):
    """Set initial inventory in the environment's internal state."""
    if hasattr(env, 'current_state') and env.current_state is not None:
        env.current_state.inventory[SHELF_LIFE - 1] = inventory_qty
    elif hasattr(env, 'mdp') and hasattr(env.mdp, 'current_state'):
        env.mdp.current_state.inventory[SHELF_LIFE - 1] = inventory_qty


def generate_traces(model_path, output_dir):
    print(f"Loading model from {model_path}...")
    model = PPO.load(model_path)
    
    scenarios = ["simple", "moderate", "complex"]
    
    for scenario in scenarios:
        config = SCENARIO_CONFIG[scenario]
        suppliers = SUPPLIER_CONFIGS[scenario]
        
        print(f"Generating trace for: {scenario} ({config['description']})...")
        
        env, _ = create_scenario_env(scenario)
        obs, info = env.reset(seed=42)
        
        # Set initial inventory to 30 (same as player starts with)
        set_initial_inventory(env, INITIAL_INVENTORY)
        if hasattr(env, '_get_observation') and hasattr(env, 'current_state'):
            obs = env._get_observation(env.current_state)
        
        trace = {
            "turns": [], 
            "metadata": {
                "scenario": scenario, 
                "episode_length": EPISODE_LENGTH,
                "base_demand": config["base_demand"],
                "description": config["description"],
                "initial_inventory": INITIAL_INVENTORY,
                "suppliers": suppliers
            }
        }
        
        total_cost = 0
        
        for step in range(EPISODE_LENGTH):
            action, _ = model.predict(obs, deterministic=True)
            next_obs, reward, terminated, truncated, info = env.step(action)
            
            cost = float(info.get("total_cost", 0))
            demand = float(info.get("demand", 0))
            total_cost += cost
            
            season_name, season_factor = get_season_info(
                step, demand, config["base_demand"], scenario
            )
            
            # Build RL action dict for all suppliers in this scenario
            rl_action = {}
            for i, s in enumerate(suppliers):
                if i < len(action):
                    rl_action[str(s["id"])] = float(action[i])
                else:
                    rl_action[str(s["id"])] = 0.0
            
            turn_data = {
                "step": step,
                "demand": demand,
                "season_name": season_name,
                "season_factor": season_factor,
                "rl_action": rl_action,
                "environment_outcome": {
                    "cost": cost,
                    "sales": float(info.get("sales", 0)),
                    "spoilage": float(info.get("spoilage", 0)),
                    "inventory": float(info.get("inventory", 0)),
                    "demand": demand
                }
            }
            trace["turns"].append(turn_data)
            obs = next_obs
            
            if terminated or truncated:
                break
                
        print(f"  > Total Cost: {total_cost:.2f}")
        
        out_path = Path(output_dir) / f"trace_{scenario}.json"
        with open(out_path, "w") as f:
            json.dump(trace, f, indent=2)


if __name__ == "__main__":
    MODEL_PATH = str(REPO_PATH / "best_model_uwu.zip")
    OUTPUT_DIR = str(Path(__file__).parent.parent / "src" / "assets")
    generate_traces(MODEL_PATH, OUTPUT_DIR)
