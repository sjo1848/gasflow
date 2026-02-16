CREATE TABLE IF NOT EXISTS delivery_failures (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    reprogram_date DATE,
    reprogram_time_slot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_failures_order_id ON delivery_failures(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_failures_created_at ON delivery_failures(created_at);
