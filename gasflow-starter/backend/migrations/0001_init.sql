CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'REPARTIDOR')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    address TEXT NOT NULL,
    zone TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDIENTE', 'ASIGNADO', 'EN_REPARTO', 'ENTREGADO')),
    assignee_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    llenas_entregadas INTEGER NOT NULL CHECK (llenas_entregadas >= 0),
    vacias_recibidas INTEGER NOT NULL CHECK (vacias_recibidas >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_inbounds (
    id UUID PRIMARY KEY,
    inbound_date DATE NOT NULL,
    cantidad_llenas INTEGER NOT NULL CHECK (cantidad_llenas > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assignee_id ON orders(assignee_id);

INSERT INTO users (id, username, password, role)
VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'admin123', 'ADMIN'),
('00000000-0000-0000-0000-000000000002', 'repartidor', 'repartidor123', 'REPARTIDOR')
ON CONFLICT (username) DO NOTHING;
