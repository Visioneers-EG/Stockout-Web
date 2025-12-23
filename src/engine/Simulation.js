import { InventoryState, SupplierPipeline } from './State';
import {
    PeriodCosts,
    calculate_purchase_costs,
    calculate_holding_cost,
    calculate_shortage_cost,
    calculate_spoilage_cost
} from './Costs';

export class PerishableInventoryMDP {
    constructor({
        shelf_life,
        suppliers, // Array of objects
        cost_params,
        lost_sales = false
    }) {
        this.shelf_life = shelf_life;
        this.suppliers = suppliers;
        this.cost_params = cost_params;
        this.lost_sales = lost_sales;
    }

    validate_action(state, action) {
        // Basic validation, can be expanded
        for (const [id, qty] of Object.entries(action)) {
            if (qty < 0) throw new Error(`Negative order quantity for supplier ${id}: ${qty}`);
        }
    }

    step(state, action, demand) {
        // 1. Validate
        this.validate_action(state, action);

        // Copy state
        const next_state = state.copy();

        // 2. Arrivals
        const arrivals = next_state.get_arriving_inventory();
        next_state.add_arrivals(arrivals);

        // 3. Serve Demand
        let total_demand = demand;
        if (!this.lost_sales) {
            total_demand += next_state.backorders;
        }

        const { sales, new_backorders } = next_state.serve_demand_fifo(total_demand);

        // Snapshot for holding cost
        const inventory_snapshot = [...next_state.inventory];

        // 4. Calculate Costs
        const costs = new PeriodCosts();

        // Purchase
        const purchase_costs = calculate_purchase_costs(action, next_state.pipelines);
        costs.purchase_cost = purchase_costs.purchase_cost;
        costs.fixed_order_cost = purchase_costs.fixed_order_cost;

        // Holding
        costs.holding_cost = calculate_holding_cost(
            inventory_snapshot,
            this.cost_params.holding_costs
        );

        // Shortage
        costs.shortage_cost = calculate_shortage_cost(
            new_backorders,
            this.cost_params.shortage_cost
        );

        // 5. Aging and Spoilage
        const spoiled = next_state.age_inventory();

        // Spoilage Cost
        costs.spoilage_cost = calculate_spoilage_cost(
            spoiled,
            this.cost_params.spoilage_cost
        );

        // 6. Pipeline Shifts and New Orders
        for (const supplier_id of Object.keys(next_state.pipelines)) {
            const order_qty = action[supplier_id] || 0.0;

            const pipeline = next_state.pipelines[supplier_id];

            // Shift execution
            pipeline.shift_and_add_order(order_qty);
            pipeline.shift_scheduled();
        }

        // 7. Backorder Update
        if (this.lost_sales) {
            next_state.backorders = 0.0;
        } else {
            next_state.backorders = new_backorders;
        }

        // Update time
        next_state.time_step += 1;

        return {
            next_state,
            costs,
            demand_realized: demand,
            sales,
            new_backorders,
            spoiled,
            arrivals
        };
    }

    // Factory to init state
    create_initial_state() {
        const pipelines = {};
        this.suppliers.forEach(s => {
            pipelines[s.id] = new SupplierPipeline({
                supplier_id: s.id,
                lead_time: s.lead_time,
                unit_cost: s.cost || s.unit_cost,
                fixed_cost: s.fixed_cost || 0,
                // Default capacity/moq handled in class default
            });
        });

        return new InventoryState({
            shelf_life: this.shelf_life,
            pipelines: pipelines,
            inventory: new Array(this.shelf_life).fill(0),
            backorders: 0
        });
    }
}
