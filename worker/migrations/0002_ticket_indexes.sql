CREATE INDEX IF NOT EXISTS idx_tickets_person_category ON tickets(person, category);
CREATE INDEX IF NOT EXISTS idx_ticket_sessions_active ON ticket_sessions(revoked, last_seen);
