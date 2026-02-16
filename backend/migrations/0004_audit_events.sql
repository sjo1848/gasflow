CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    entity TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
