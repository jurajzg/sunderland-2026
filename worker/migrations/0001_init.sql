CREATE TABLE IF NOT EXISTS ticket_sessions (
 id TEXT PRIMARY KEY,
 pin_fingerprint TEXT NOT NULL,
 last_seen INTEGER NOT NULL,
 revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ticket_unlock_attempts (
 ip TEXT PRIMARY KEY,
 failures INTEGER NOT NULL DEFAULT 0,
 locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tickets (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 person TEXT NOT NULL CHECK(person IN ('Juraj','Buco')),
 category TEXT NOT NULL CHECK(category IN ('flight','train','match')),
 object_key TEXT NOT NULL UNIQUE,
 filename TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_person_category ON tickets(person, category);
CREATE INDEX IF NOT EXISTS idx_ticket_sessions_active ON ticket_sessions(revoked, last_seen);
