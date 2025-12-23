"""
Generate Game Traces for Multiple Scenarios

This script:
1. Loads the trained RL models:
   - best_model_uwu.zip for simple, moderate, complex
   - best_model.zip for extreme
2. Generates 4 distinct traces with 30 initial inventory
3. Adds seasonal info (season_name, season_factor) to each turn
4. Saves them to src/assets/trace_{scenario}.json
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
FAST_LEAD_TIME = 1
SLOW_LEAD_TIME = 3
FAST_COST = 2.0
SLOW_COST = 1.0
INITIAL_INVENTORY = 30  # Start with 30 units (same as player)

# Scenario definitions with seasonal patterns
SCENARIO_CONFIG = {
    "simple": {
        "base_demand": 10.0,
        "demand_type": "poisson",
        "seasonal_pattern": None,
        "description": "Steady demand",
        "model": "uwu"
    },
    "moderate": {
        "base_demand": 10.0,
        "demand_type": "negbin",
        "seasonal_pattern": None,
        "description": "High variance demand",
        "model": "uwu"
    },
    "complex": {
        "base_demand": 12.0,
        "demand_type": "poisson",
        "seasonal_pattern": "sinusoidal",
        "description": "Seasonal demand waves",
        "model": "uwu"
    },
    "extreme": {
        "base_demand": 20.0,
        "demand_type": "poisson",
        "seasonal_pattern": "surges",
        "description": "High demand with surges",
        "model": "regular"  # Uses best_model.zip
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
            
    elif pattern == "surges":
        surge_threshold = base_demand * 1.5
        if demand > surge_threshold:
            season_name = "Surge!"
            season_factor = demand / base_demand
        elif demand > base_demand * 1.2:
            season_name = "High Demand"
            season_factor = demand / base_demand
        else:
            season_name = "Normal"
            season_factor = 1.0
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
    base_demand = config["base_demand"]
    demand_type = config["demand_type"]
    
    if demand_type == "poisson":
        demand_process = PoissonDemand(base_rate=base_demand)
    elif demand_type == "negbin":
        demand_process = NegativeBinomialDemand(n_successes=5, prob_success=0.33)
    else:
        demand_process = PoissonDemand(base_rate=base_demand)
    
    env = create_gym_env(
        shelf_life=SHELF_LIFE,
        mean_demand=base_demand,
        fast_lead_time=FAST_LEAD_TIME,
        slow_lead_time=SLOW_LEAD_TIME,
        fast_cost=FAST_COST,
        slow_cost=SLOW_COST,
        demand_process=demand_process,
        enable_crisis=False
    )
    return env


def set_initial_inventory(env, inventory_qty):
    """Set initial inventory in the environment's internal state."""
    # Access the internal MDP state via the wrapper
    # The gym wrapper has 'current_state' after reset
    if hasattr(env, 'current_state') and env.current_state is not None:
        # Add inventory to the freshest bucket (last index = shelf_life - 1)
        env.current_state.inventory[SHELF_LIFE - 1] = inventory_qty
    elif hasattr(env, 'mdp') and hasattr(env.mdp, 'current_state'):
        env.mdp.current_state.inventory[SHELF_LIFE - 1] = inventory_qty


def generate_traces(models, output_dir):
    scenarios = ["simple", "moderate", "complex", "extreme"]
    
    for scenario in scenarios:
        config = SCENARIO_CONFIG[scenario]
        model_key = config["model"]
        model = models[model_key]
        
        print(f"Generating trace for: {scenario} ({config['description']}) using {model_key} model...")
        
        env = create_scenario_env(scenario)
        obs, info = env.reset(seed=42)
        
        # Set initial inventory to 30 (same as player starts with)
        set_initial_inventory(env, INITIAL_INVENTORY)
        # Need to update observation after modifying state
        if hasattr(env, '_get_observation') and hasattr(env, 'current_state'):
            obs = env._get_observation(env.current_state)
        
        trace = {
            "turns": [], 
            "metadata": {
                "scenario": scenario, 
                "episode_length": EPISODE_LENGTH,
                "base_demand": config["base_demand"],
                "description": config["description"],
                "initial_inventory": INITIAL_INVENTORY
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
            
            turn_data = {
                "step": step,
                "demand": demand,
                "season_name": season_name,
                "season_factor": season_factor,
                "rl_action": {
                    "0": float(action[0]) if len(action) > 0 else 0,
                    "1": float(action[1]) if len(action) > 1 else 0
                },
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
    # Load both models
    MODEL_UWU_PATH = str(REPO_PATH / "best_model_uwu.zip")
    MODEL_REGULAR_PATH = str(REPO_PATH / "best_model.zip")
    
    print("Loading models...")
    models = {
        "uwu": PPO.load(MODEL_UWU_PATH),
        "regular": PPO.load(MODEL_REGULAR_PATH)
    }
    print("  > Loaded best_model_uwu.zip for simple/moderate/complex")
    print("  > Loaded best_model.zip for extreme")
    
    OUTPUT_DIR = str(Path(__file__).parent.parent / "src" / "assets")
    generate_traces(models, OUTPUT_DIR)
