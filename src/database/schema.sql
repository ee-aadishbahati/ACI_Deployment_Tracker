
CREATE TABLE IF NOT EXISTS fabrics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    site TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    fabric_specific BOOLEAN DEFAULT 1,
    ndo_centralized BOOLEAN DEFAULT 0,
    section_id TEXT NOT NULL,
    subsection_title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    fabric_id TEXT NOT NULL,
    checked BOOLEAN DEFAULT 0,
    notes TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
    UNIQUE(task_id, fabric_id)
);

CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    tc_id TEXT NOT NULL,
    lead TEXT NOT NULL,
    witness TEXT,
    priority TEXT NOT NULL,
    risk TEXT NOT NULL,
    effort INTEGER NOT NULL,
    status TEXT DEFAULT 'T.B.E.',
    rtm_id TEXT,
    pre_conditions TEXT,
    expected_results TEXT,
    actual_results TEXT,
    evidence_required BOOLEAN DEFAULT 0,
    vendor_dependencies TEXT,
    dependencies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS sub_checklists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fabric_id TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fabric_id) REFERENCES fabrics(id)
);

CREATE TABLE IF NOT EXISTS sub_checklist_items (
    id TEXT PRIMARY KEY,
    sub_checklist_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    checked BOOLEAN DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sub_checklist_id) REFERENCES sub_checklists(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    stack_trace TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_states_fabric ON task_states(fabric_id);
CREATE INDEX IF NOT EXISTS idx_task_states_task ON task_states(task_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_task ON test_cases(task_id);
CREATE INDEX IF NOT EXISTS idx_sub_checklist_items_checklist ON sub_checklist_items(sub_checklist_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_tasks_section ON tasks(section_id);
