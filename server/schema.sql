DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL
);

CREATE TABLE parts (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  batch_number VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  cert_of_conformance VARCHAR(100),
  shelf_life DATE,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  part_id INTEGER REFERENCES parts(id),
  type VARCHAR(10) NOT NULL, -- 'IN' or 'OUT'
  quantity INTEGER NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference VARCHAR(100),
  note TEXT,
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id)
);

-- Seed Data

-- Users
INSERT INTO users (username, password, name, role) VALUES
('admin', '$2b$10$Nn65IZCmR/yGhD861b/uF.YmTGEY4vKtrZgK7iXhgmnfRzzqniCx6', 'Admin User', 'Admin'),
('controller', '$2b$10$ujcytau579Z10lSalVYfPOemteM6ymtjr/gR/.rvZAnGzmmp.bm6C', 'Jane Martinez', 'Stock Controller'),
('viewer', '$2b$10$ih8ae2TgsNAnisiEecydYeHJ/as4wWKb4JBCcfy6zsifAnojDcQmy', 'Tom Chen', 'Viewer');

-- Parts
INSERT INTO parts (part_number, description, category, manufacturer, serial_number, batch_number, quantity, reorder_point, location, condition, cert_of_conformance, shelf_life, unit_cost) VALUES
('PN-7201-A', 'Turbine Blade Assembly', 'Engine', 'Rolls-Royce', 'SN-TR-90412', 'BT-2025-001', 12, 5, 'Warehouse A', 'New', 'COC-RR-2025-0412', '2028-06-15', 14500.00),
('PN-3305-C', 'EFIS Display Unit', 'Avionics', 'Honeywell', 'SN-EF-77231', 'BT-2025-002', 3, 4, 'Warehouse B', 'Serviceable', 'COC-HW-2025-0098', '2027-12-01', 32000.00),
('PN-1150-B', 'Hydraulic Pump Assy', 'Hydraulic', 'Parker Hannifin', 'SN-HP-55102', 'BT-2024-088', 8, 3, 'Hangar 1', 'New', 'COC-PH-2024-0088', '2029-03-20', 8700.00),
('PN-6600-D', 'Main Landing Gear Actuator', 'Landing Gear', 'Safran', 'SN-LG-34201', 'BT-2025-015', 2, 2, 'Warehouse A', 'Serviceable', 'COC-SF-2025-0015', '2030-01-10', 45000.00),
('PN-8820-E', 'Generator Control Unit', 'Electrical', 'GE Aviation', 'SN-GC-61023', 'BT-2025-022', 0, 2, 'Warehouse B', 'Unserviceable', 'COC-GE-2025-0022', '2026-08-30', 18500.00),
('PN-4410-F', 'Fuel Filter Element', 'Consumable', 'Pall Aerospace', '', 'BT-2025-040', 45, 20, 'Warehouse A', 'New', 'COC-PA-2025-0040', '2026-04-01', 320.00),
('PN-9901-G', 'Wing Skin Panel (Repair)', 'Airframe', 'Boeing', 'SN-WS-11002', 'BT-2024-100', 1, 1, 'Quarantine Bay', 'Quarantined', '', NULL, 67000.00),
('PN-2255-H', 'AN3-5A Bolt', 'Hardware', 'SPS Technologies', '', 'BT-2025-060', 500, 200, 'Warehouse A', 'New', 'COC-SPS-2025-0060', NULL, 1.50);

-- Transactions (Assuming IDs match insertion order)
INSERT INTO transactions (part_id, type, quantity, date, reference, note, user_id) VALUES
(1, 'IN', 12, '2025-01-15 09:30:00', 'PO-2025-001', 'Initial stock receipt', 2),
(2, 'IN', 5, '2025-01-20 14:00:00', 'PO-2025-003', 'Replenishment order', 2),
(2, 'OUT', 2, '2025-02-05 10:15:00', 'WO-A320-044', 'Issued to A320 C-Check', 2),
(6, 'IN', 50, '2025-02-10 08:00:00', 'PO-2025-010', 'Bulk consumable receipt', 2),
(6, 'OUT', 5, '2025-02-14 16:30:00', 'WO-B737-012', 'Issued to 737 A-Check', 2),
(5, 'OUT', 3, '2025-02-01 11:00:00', 'WO-A330-007', 'Issued — found unserviceable', 1);
