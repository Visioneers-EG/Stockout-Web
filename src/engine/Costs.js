export class CostParameters {
    constructor({
        holding_costs,
        shortage_cost = 10.0,
        spoilage_cost = 5.0,
        safety_penalty = 0.0,
        discount_factor = 0.99
    }) {
        this.holding_costs = holding_costs; // Array
        this.shortage_cost = shortage_cost;
        this.spoilage_cost = spoilage_cost;
        this.safety_penalty = safety_penalty;
        this.discount_factor = discount_factor;
    }
}

export class PeriodCosts {
    constructor({
        purchase_cost = 0.0,
        fixed_order_cost = 0.0,
        holding_cost = 0.0,
        shortage_cost = 0.0,
        spoilage_cost = 0.0,
        safety_violation_cost = 0.0
    } = {}) {
        this.purchase_cost = purchase_cost;
        this.fixed_order_cost = fixed_order_cost;
        this.holding_cost = holding_cost;
        this.shortage_cost = shortage_cost;
        this.spoilage_cost = spoilage_cost;
        this.safety_violation_cost = safety_violation_cost;
    }

    get total_cost() {
        return (
            this.purchase_cost +
            this.fixed_order_cost +
            this.holding_cost +
            this.shortage_cost +
            this.spoilage_cost +
            this.safety_violation_cost
        );
    }
}

export function calculate_purchase_costs(actions, pipelines) {
    let purchase_cost = 0.0;
    let fixed_cost = 0.0;

    for (const [supplier_id, order_qty] of Object.entries(actions)) {
        if (order_qty > 0) {
            const pipeline = pipelines[supplier_id];
            purchase_cost += pipeline.unit_cost * order_qty;
            fixed_cost += pipeline.fixed_cost;
        }
    }

    return new PeriodCosts({ purchase_cost, fixed_order_cost: fixed_cost });
}

export function calculate_holding_cost(inventory, holding_costs) {
    // dot product
    return inventory.reduce((sum, qty, idx) => sum + qty * holding_costs[idx], 0);
}

export function calculate_shortage_cost(new_backorders, shortage_penalty) {
    return shortage_penalty * new_backorders;
}

export function calculate_spoilage_cost(spoiled_qty, spoilage_penalty) {
    return spoilage_penalty * spoiled_qty;
}
