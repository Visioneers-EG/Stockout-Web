export class SupplierPipeline {
    constructor({
        supplier_id,
        lead_time,
        pipeline = [],
        scheduled = [],
        unit_cost = 1.0,
        fixed_cost = 0.0,
        capacity = Infinity,
        moq = 1
    }) {
        this.supplier_id = supplier_id;
        this.lead_time = lead_time;
        this.unit_cost = unit_cost;
        this.fixed_cost = fixed_cost;
        this.capacity = capacity;
        this.moq = moq;

        // Initialize arrays
        this.pipeline = pipeline.length > 0 ? [...pipeline] : new Array(lead_time).fill(0);
        this.scheduled = scheduled.length > 0 ? [...scheduled] : new Array(lead_time).fill(0);
    }

    get_arriving() {
        return this.pipeline[0] + this.scheduled[0];
    }

    shift_and_add_order(order_qty) {
        const arrived = this.pipeline[0];
        // Shift left
        this.pipeline.shift();
        this.pipeline.push(order_qty);
        return arrived;
    }

    shift_scheduled() {
        const arrived = this.scheduled[0];
        // Shift left
        this.scheduled.shift();
        this.scheduled.push(0);
        return arrived;
    }

    total_in_pipeline() {
        const sum = (arr) => arr.reduce((a, b) => a + b, 0);
        return sum(this.pipeline) + sum(this.scheduled);
    }

    copy() {
        return new SupplierPipeline({
            supplier_id: this.supplier_id,
            lead_time: this.lead_time,
            pipeline: this.pipeline,
            scheduled: this.scheduled,
            unit_cost: this.unit_cost,
            fixed_cost: this.fixed_cost,
            capacity: this.capacity,
            moq: this.moq
        });
    }
}

export class InventoryState {
    constructor({
        shelf_life,
        inventory = [],
        pipelines = {},
        backorders = 0.0,
        exogenous_state = null,
        time_step = 0
    }) {
        this.shelf_life = shelf_life;
        this.inventory = inventory.length > 0 ? [...inventory] : new Array(shelf_life).fill(0);
        this.pipelines = {};
        // Deep copy pipelines if passed
        for (const [key, p] of Object.entries(pipelines)) {
            this.pipelines[key] = p.copy ? p.copy() : new SupplierPipeline(p);
        }

        this.backorders = backorders;
        this.exogenous_state = exogenous_state;
        this.time_step = time_step;
    }

    get total_inventory() {
        return this.inventory.reduce((a, b) => a + b, 0);
    }

    get total_pipeline() {
        return Object.values(this.pipelines).reduce((sum, p) => sum + p.total_in_pipeline(), 0);
    }

    get inventory_position() {
        return this.total_inventory + this.total_pipeline - this.backorders;
    }

    get_arriving_inventory() {
        return Object.values(this.pipelines).reduce((sum, p) => sum + p.get_arriving(), 0);
    }

    add_arrivals(arrivals) {
        // Add to freshest bucket (last index)
        this.inventory[this.shelf_life - 1] += arrivals;
    }

    serve_demand_fifo(demand) {
        let remaining = demand;

        for (let n = 0; n < this.shelf_life; n++) {
            const take = Math.min(this.inventory[n], remaining);
            this.inventory[n] -= take;
            remaining -= take;
            if (remaining <= 0) break;
        }

        const sales = demand - remaining;
        const new_backorders = Math.max(remaining, 0);
        return { sales, new_backorders };
    }

    age_inventory() {
        const spoiled = this.inventory[0];
        // Shift left
        this.inventory.shift();
        this.inventory.push(0);
        return spoiled;
    }

    copy() {
        return new InventoryState({
            shelf_life: this.shelf_life,
            inventory: this.inventory,
            pipelines: this.pipelines,
            backorders: this.backorders,
            exogenous_state: this.exogenous_state,
            time_step: this.time_step
        });
    }
}
