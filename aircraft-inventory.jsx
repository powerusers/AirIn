import { useState, useEffect, useMemo, createContext, useContext } from "react";

// ─── Data Seed ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Engine", "Avionics", "Airframe", "Hydraulic", "Electrical", "Landing Gear", "Consumable", "Hardware"];
const CONDITIONS = ["New", "Serviceable", "Unserviceable", "Quarantined"];
const LOCATIONS = ["Warehouse A", "Warehouse B", "Hangar 1", "Hangar 2", "Quarantine Bay", "Incoming Inspection"];
const ROLES = { ADMIN: "Admin", CONTROLLER: "Stock Controller", VIEWER: "Viewer" };


// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
function cls(...args) { return args.filter(Boolean).join(" "); }
function fmt(n) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n); }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
function fmtDateTime(d) { if (!d) return "—"; return new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function stockStatus(qty, reorder) { if (qty === 0) return "Out of Stock"; if (qty <= reorder) return "Low"; return "In Stock"; }
function statusColor(s) { if (s === "Out of Stock") return "#dc2626"; if (s === "Low") return "#f59e0b"; return "#16a34a"; }
function conditionColor(c) { if (c === "New") return "#2563eb"; if (c === "Serviceable") return "#16a34a"; if (c === "Unserviceable") return "#dc2626"; return "#9333ea"; }
function daysUntilExpiry(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); }

function generateId(arr) { return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1; }

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const theme = {
  bg: "#f8fafc",        // Slate 50
  surface: "#ffffff",   // White
  surfaceHover: "#f1f5f9", // Slate 100
  border: "#e2e8f0",    // Slate 200
  text: "#0f172a",      // Slate 900
  textMuted: "#64748b", // Slate 500
  textDim: "#94a3b8",   // Slate 400
  primary: "#2563eb",   // Blue 600
  primaryHover: "#1d4ed8", // Blue 700
  primaryLight: "#eff6ff", // Blue 50
  accent: "#f59e0b",    // Amber 500
  danger: "#ef4444",    // Red 500
  dangerHover: "#dc2626", // Red 600
  success: "#10b981",   // Emerald 500
  radius: "6px",        // Crisper radius
  shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  shadowLg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

const S = {
  app: {
    minHeight: "100vh",
    background: theme.bg,
    color: theme.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
  },
  loginWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#f1f5f9"
  },
  loginBox: {
    background: theme.surface,
    borderRadius: theme.radius,
    padding: 40,
    width: 380,
    boxShadow: theme.shadowLg,
    border: `1px solid ${theme.border}`
  },
  sidebar: {
    width: 240,
    background: "#0f172a", // Dark sidebar for contrast
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10,
    transition: "transform 0.3s ease"
  },
  mobileNav: {
    height: 60,
    background: theme.surface,
    borderBottom: `1px solid ${theme.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20
  },
  main: {
    transition: "margin-left 0.3s ease",
    padding: "32px 40px",
    minHeight: "100vh"
  },
  card: {
    background: theme.surface,
    borderRadius: theme.radius,
    border: `1px solid ${theme.border}`,
    padding: 24,
    marginBottom: 24,
    boxShadow: theme.shadow
  },
  input: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    color: theme.text,
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    transition: "border-color .15s",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    boxSizing: "border-box"
  },
  select: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    color: theme.text,
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    boxSizing: "border-box"
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: theme.radius,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all .15s",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
  },
  btnPrimary: {
    background: theme.primary,
    color: "#fff"
  },
  btnDanger: {
    background: theme.surface,
    color: theme.danger,
    border: `1px solid ${theme.border}`
  },
  btnGhost: {
    background: "transparent",
    color: theme.textMuted,
    boxShadow: "none"
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 13
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: `1px solid ${theme.border}`,
    background: theme.surfaceHover,
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    firstChild: { borderTopLeftRadius: theme.radius },
    lastChild: { borderTopRightRadius: theme.radius }
  },
  td: {
    padding: "12px 16px",
    borderBottom: `1px solid ${theme.border}`,
    color: theme.text,
    verticalAlign: "middle"
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    border: "1px solid transparent"
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100
  },
  modalContent: {
    background: theme.surface,
    borderRadius: theme.radius,
    padding: 32,
    width: 520,
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: theme.shadowLg,
    border: `1px solid ${theme.border}`
  },
  statCard: {
    background: theme.surface,
    borderRadius: theme.radius,
    border: `1px solid ${theme.border}`,
    padding: "24px",
    flex: 1,
    minWidth: 200,
    boxShadow: theme.shadow
  },
};

// ─── Icons (inline SVG) ──────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const Icons = {
  plane: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  box: (p) => <Icon {...p} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />,
  arrowDown: (p) => <Icon {...p} d="M12 5v14M19 12l-7 7-7-7" />,
  arrowUp: (p) => <Icon {...p} d="M12 19V5M5 12l7-7 7 7" />,
  alert: (p) => <Icon {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />,
  search: (p) => <Icon {...p} d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" />,
  chart: (p) => <Icon {...p} d="M18 20V10M12 20V4M6 20v-6" />,
  shield: (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  users: (p) => <Icon {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  log: (p) => <Icon {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  edit: (p) => <Icon {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />,
  x: (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />,
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  logout: (p) => <Icon {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
  clock: (p) => <Icon {...p} d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" />,
  menu: (p) => <Icon {...p} d="M3 12h18M3 6h18M3 18h18" />,
};

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  return <span style={{ ...S.badge, color, background: bg || `${color}22` }}>{label}</span>;
}

function StockBadge({ quantity, reorderPoint }) {
  const s = stockStatus(quantity, reorderPoint);
  const c = statusColor(s);
  return <Badge label={s} color={c} />;
}

function ConditionBadge({ condition }) {
  return <Badge label={condition} color={conditionColor(condition)} />;
}

function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: theme.textMuted, fontWeight: 500 }}>
        {label}{required && <span style={{ color: theme.danger }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function FormRow({ children }) {
  const isMobile = useIsMobile();
  return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Modal({ title, onClose, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalContent, width: isMobile ? "95%" : 520, padding: isMobile ? 20 : 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <button onClick={onClose} style={{ ...S.btn, padding: 4, background: "transparent", color: theme.textMuted }}>{Icons.x()}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: theme.textDim }}>
      <div style={{ marginBottom: 12, opacity: .5 }}>{icon}</div>
      <p style={{ fontSize: 15 }}>{message}</p>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error");
    }
  }

  return (
    <div style={S.loginWrap}>
      <div style={{ ...S.loginBox, width: "min(380px, 90%)", padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: theme.primaryLight, marginBottom: 12 }}>
            {Icons.plane({ size: 28, color: theme.primary })}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>AeroParts IMS</h1>
          <p style={{ color: theme.textMuted, margin: "6px 0 0", fontSize: 13 }}>Aircraft Parts Inventory Management</p>
        </div>
        <form onSubmit={handleSubmit}>
          <FormField label="Username"><input style={S.input} value={username} onChange={e => { setUsername(e.target.value); setError(""); }} placeholder="Enter username" /></FormField>
          <FormField label="Password"><input style={S.input} type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="Enter password" /></FormField>
          {error && <p style={{ color: theme.danger, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" style={{ ...S.btn, ...S.btnPrimary, width: "100%", justifyContent: "center", padding: "10px 0", marginTop: 4 }}>Sign In</button>
        </form>
        <div style={{ marginTop: 20, padding: 14, background: theme.bg, borderRadius: theme.radius, fontSize: 12, color: theme.textDim }}>
          <strong style={{ color: theme.textMuted }}>Demo accounts:</strong><br />
          admin / admin (Admin) &nbsp;·&nbsp; controller / ctrl1 (Stock Controller) &nbsp;·&nbsp; viewer / view1 (Viewer)
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Icons.chart },
  { key: "parts", label: "Parts Catalog", icon: Icons.box },
  { key: "movements", label: "Stock Movements", icon: Icons.arrowDown },
  { key: "alerts", label: "Alerts", icon: Icons.alert },
  { key: "reports", label: "Reports", icon: Icons.log },
  { key: "traceability", label: "Traceability", icon: Icons.shield },
  { key: "audit", label: "Audit Log", icon: Icons.clock },
];

function Sidebar({ active, onNav, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const sidebarStyle = {
    ...S.sidebar,
    transform: isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
    boxShadow: isMobile && isOpen ? "20px 0 50px rgba(0,0,0,0.5)" : "none",
  };

  const handleNav = (key) => {
    onNav(key);
    if (isMobile) onClose();
  };

  return (
    <>
      {isMobile && isOpen && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9 }} />}
      <div style={sidebarStyle}>
        <div style={{ padding: "24px 20px", borderBottom: `1px solid #1e293b` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {Icons.plane({ size: 18, color: "white" })}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#fff", letterSpacing: "-0.01em" }}>AeroParts</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Inventory System</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map(n => {
            const isActive = active === n.key;
            return (
              <button key={n.key} onClick={() => handleNav(n.key)} style={{
                ...S.btn, width: "100%", justifyContent: "flex-start", padding: "10px 12px", marginBottom: 4,
                background: isActive ? "#1e293b" : "transparent",
                color: isActive ? "#fff" : "#94a3b8",
                boxShadow: "none",
                fontSize: 14
              }}>
                {n.icon({ size: 18, color: isActive ? "#38bdf8" : "currentColor" })}
                <span style={{ marginLeft: 3 }}>{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: `1px solid #1e293b` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{user?.role || "Viewer"}</div>
            </div>
            <button onClick={logout} title="Log out" style={{ ...S.btn, padding: 6, background: "transparent", color: "#94a3b8", boxShadow: "none" }}>{Icons.logout({ size: 16 })}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileNav({ onMenuClick }) {
  return (
    <div style={S.mobileNav}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: theme.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {Icons.plane({ size: 16, color: theme.primary })}
        </div>
        <span style={{ fontWeight: 700 }}>AeroParts</span>
      </div>
      <button onClick={onMenuClick} style={{ ...S.btn, ...S.btnGhost, padding: 8 }}>
        {Icons.menu({ size: 24 })}
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ parts, transactions }) {
  const totalParts = parts.length;
  const totalQty = parts.reduce((s, p) => s + p.quantity, 0);
  const totalValue = parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);
  const lowStock = parts.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint).length;
  const outOfStock = parts.filter(p => p.quantity === 0).length;
  const expiringSoon = parts.filter(p => { const d = daysUntilExpiry(p.shelfLife); return d !== null && d <= 90 && d > 0; }).length;
  const expired = parts.filter(p => { const d = daysUntilExpiry(p.shelfLife); return d !== null && d <= 0; }).length;
  const quarantined = parts.filter(p => p.condition === "Quarantined").length;

  const recentTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const criticalParts = parts.filter(p => p.quantity === 0 || (p.quantity <= p.reorderPoint)).sort((a, b) => a.quantity - b.quantity);

  const stats = [
    { label: "Total SKUs", value: totalParts, color: theme.primary, icon: Icons.box },
    { label: "Total Units", value: totalQty.toLocaleString(), color: theme.success, icon: Icons.chart },
    { label: "Inventory Value", value: fmt(totalValue), color: theme.purple, icon: Icons.chart },
    { label: "Low Stock", value: lowStock, color: theme.accent, icon: Icons.alert },
    { label: "Out of Stock", value: outOfStock, color: theme.danger, icon: Icons.alert },
  ];

  const isMobile = useIsMobile();

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ ...S.statCard, borderLeft: `4px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: "-0.02em" }}>{s.value}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
              {s.icon({ size: 24 })}
            </div>
          </div>
        ))}
      </div>

      {(expiringSoon > 0 || expired > 0 || quarantined > 0) && (
        <div style={{ ...S.card, borderLeft: `3px solid ${theme.accent}`, marginBottom: 24, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 24 }}>
          {expired > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Icons.alert({ size: 18, color: theme.danger })}<span><strong style={{ color: theme.danger }}>{expired}</strong> expired part(s)</span></div>}
          {expiringSoon > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Icons.clock({ size: 18, color: theme.accent })}<span><strong style={{ color: theme.accent }}>{expiringSoon}</strong> expiring within 90 days</span></div>}
          {quarantined > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Icons.shield({ size: 18, color: theme.purple })}<span><strong style={{ color: theme.purple }}>{quarantined}</strong> quarantined</span></div>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Critical Stock Items</h3>
          {criticalParts.length === 0 ? <EmptyState icon={Icons.check({ size: 32, color: theme.success })} message="All parts above reorder points" /> : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Part #</th><th style={S.th}>Description</th><th style={S.th}>Qty</th><th style={S.th}>Status</th></tr></thead>
              <tbody>
                {criticalParts.map(p => (
                  <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{p.quantity}</td><td style={S.td}><StockBadge quantity={p.quantity} reorderPoint={p.reorderPoint} /></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Recent Transactions</h3>
          {recentTx.length === 0 ? <EmptyState icon={Icons.log({ size: 32 })} message="No transactions yet" /> : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Date</th><th style={S.th}>Part #</th><th style={S.th}>Type</th><th style={S.th}>Qty</th></tr></thead>
              <tbody>
                {recentTx.map(t => {
                  const part = parts.find(p => p.id === t.partId);
                  return (
                    <tr key={t.id}>
                      <td style={S.td}>{fmtDate(t.date)}</td>
                      <td style={S.td}><code style={{ color: theme.primary }}>{part?.partNumber || "—"}</code></td>
                      <td style={S.td}><Badge label={t.type} color={t.type === "IN" ? theme.success : theme.accent} /></td>
                      <td style={S.td}>{t.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Part Form ────────────────────────────────────────────────────────────────
function PartForm({ part, onSave, onCancel }) {
  const [form, setForm] = useState(part || {
    partNumber: "", description: "", category: CATEGORIES[0], manufacturer: "", serialNumber: "", batchNumber: "",
    quantity: 0, reorderPoint: 0, location: LOCATIONS[0], condition: CONDITIONS[0],
    certOfConformance: "", shelfLife: "", unitCost: 0,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <FormRow>
        <FormField label="Part Number" required><input style={S.input} required value={form.partNumber} onChange={e => set("partNumber", e.target.value)} /></FormField>
        <FormField label="Manufacturer" required><input style={S.input} required value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} /></FormField>
      </FormRow>
      <FormField label="Description" required><input style={S.input} required value={form.description} onChange={e => set("description", e.target.value)} /></FormField>
      <FormRow>
        <FormField label="Category"><select style={S.select} value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></FormField>
        <FormField label="Condition"><select style={S.select} value={form.condition} onChange={e => set("condition", e.target.value)}>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></FormField>
      </FormRow>
      <FormRow>
        <FormField label="Serial Number"><input style={S.input} value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} /></FormField>
        <FormField label="Batch / Lot Number"><input style={S.input} value={form.batchNumber} onChange={e => set("batchNumber", e.target.value)} /></FormField>
      </FormRow>
      <FormRow>
        <FormField label="Quantity" required><input style={S.input} type="number" min="0" required value={form.quantity} onChange={e => set("quantity", parseInt(e.target.value) || 0)} /></FormField>
        <FormField label="Reorder Point"><input style={S.input} type="number" min="0" value={form.reorderPoint} onChange={e => set("reorderPoint", parseInt(e.target.value) || 0)} /></FormField>
      </FormRow>
      <FormRow>
        <FormField label="Storage Location"><select style={S.select} value={form.location} onChange={e => set("location", e.target.value)}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select></FormField>
        <FormField label="Unit Cost ($)"><input style={S.input} type="number" min="0" step="0.01" value={form.unitCost} onChange={e => set("unitCost", parseFloat(e.target.value) || 0)} /></FormField>
      </FormRow>
      <FormField label="Certificate of Conformance"><input style={S.input} value={form.certOfConformance} onChange={e => set("certOfConformance", e.target.value)} placeholder="COC reference number" /></FormField>
      <FormField label="Shelf Life / Expiration Date"><input style={{ ...S.input, colorScheme: "dark" }} type="date" value={form.shelfLife} onChange={e => set("shelfLife", e.target.value)} /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <button type="button" onClick={onCancel} style={{ ...S.btn, ...S.btnGhost }}>Cancel</button>
        <button type="submit" style={{ ...S.btn, ...S.btnPrimary }}>{part ? "Update Part" : "Add Part"}</button>
      </div>
    </form>
  );
}

// ─── Parts Catalog ────────────────────────────────────────────────────────────
function PartsCatalog({ parts, setParts, addAudit, secureFetch }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const canEdit = user.role !== ROLES.VIEWER;
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterLoc, setFilterLoc] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => {
    return parts.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.partNumber.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.serialNumber.toLowerCase().includes(q) || p.manufacturer.toLowerCase().includes(q);
      const matchCat = !filterCat || p.category === filterCat;
      const matchLoc = !filterLoc || p.location === filterLoc;
      const ss = stockStatus(p.quantity, p.reorderPoint);
      const matchStatus = !filterStatus || ss === filterStatus;
      return matchSearch && matchCat && matchLoc && matchStatus;
    });
  }, [parts, search, filterCat, filterLoc, filterStatus]);

  async function handleSave(form) {
    const fetch = window.secureFetch || window.fetch;
    if (editing) {
      try {
        const res = await fetch(`/api/parts/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          const updatedPart = await res.json();
          setParts(prev => prev.map(p => p.id === updatedPart.id ? updatedPart : p));
          addAudit(`Updated part ${form.partNumber}`);
        }
      } catch (err) { console.error(err); }
    } else {
      try {
        const res = await secureFetch('/api/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          const newPart = await res.json();
          setParts(prev => [...prev, newPart]);
          addAudit(`Added new part ${form.partNumber}`);
        }
      } catch (err) { console.error(err); }
    }
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Parts Catalog</h1>
        {canEdit && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ ...S.btn, ...S.btnPrimary }}>
            {Icons.plus({ size: 16 })} Add Part
          </button>
        )}
      </div>

      <div style={{ ...S.card, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, padding: 24 }}>
        <div style={{ position: "relative", gridColumn: "1 / -1" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: theme.textDim }}>{Icons.search({ size: 16 })}</span>
          <input style={{ ...S.input, paddingLeft: 34, width: "100%" }} placeholder="Search part #, description, serial, manufacturer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...S.select, width: "100%" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select style={{ ...S.select, width: "100%" }} value={filterLoc} onChange={e => setFilterLoc(e.target.value)}>
          <option value="">All Locations</option>{LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select style={{ ...S.select, width: "100%" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option><option>In Stock</option><option>Low</option><option>Out of Stock</option>
        </select>
      </div>

      <div style={S.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Part #</th><th style={S.th}>Description</th><th style={S.th}>Category</th>
                <th style={S.th}>Qty</th><th style={S.th}>Location</th><th style={S.th}>Condition</th>
                <th style={S.th}>Status</th>{canEdit && <th style={S.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={canEdit ? 8 : 7} style={{ ...S.td, textAlign: "center", color: theme.textDim, padding: 32 }}>No parts found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setDetail(p)} onMouseEnter={e => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={S.td}><code style={{ color: theme.primary, fontWeight: 600 }}>{p.partNumber}</code></td>
                  <td style={S.td}>{p.description}</td>
                  <td style={S.td}><span style={{ color: theme.textMuted }}>{p.category}</span></td>
                  <td style={S.td}><strong>{p.quantity}</strong></td>
                  <td style={S.td}>{p.location}</td>
                  <td style={S.td}><ConditionBadge condition={p.condition} /></td>
                  <td style={S.td}><StockBadge quantity={p.quantity} reorderPoint={p.reorderPoint} /></td>
                  {canEdit && (
                    <td style={S.td} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ ...S.btn, ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}>{Icons.edit({ size: 14 })} Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: theme.textDim }}>{filtered.length} of {parts.length} parts shown</div>
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Part" : "Add New Part"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <PartForm part={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      {detail && (
        <Modal title="Part Details" onClose={() => setDetail(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {[
              ["Part Number", <code style={{ color: theme.primary }}>{detail.partNumber}</code>],
              ["Manufacturer", detail.manufacturer],
              ["Description", detail.description],
              ["Category", detail.category],
              ["Serial #", detail.serialNumber || "—"],
              ["Batch / Lot #", detail.batchNumber || "—"],
              ["Quantity", <strong>{detail.quantity}</strong>],
              ["Reorder Point", detail.reorderPoint],
              ["Location", detail.location],
              ["Condition", <ConditionBadge condition={detail.condition} />],
              ["Stock Status", <StockBadge quantity={detail.quantity} reorderPoint={detail.reorderPoint} />],
              ["Unit Cost", fmt(detail.unitCost)],
              ["Total Value", fmt(detail.quantity * detail.unitCost)],
              ["COC Reference", detail.certOfConformance || "—"],
              ["Shelf Life", detail.shelfLife ? `${fmtDate(detail.shelfLife)} (${daysUntilExpiry(detail.shelfLife)} days)` : "N/A"],
            ].map(([l, v], i) => (
              <div key={i}><div style={{ fontSize: 12, color: theme.textDim, marginBottom: 2, textTransform: "uppercase" }}>{l}</div><div>{v}</div></div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Stock Movements ──────────────────────────────────────────────────────────
function StockMovements({ parts, setParts, transactions, setTransactions, addAudit, secureFetch }) {
  const { user } = useAuth();
  const canEdit = user.role !== ROLES.VIEWER;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ partId: "", type: "IN", quantity: 1, reference: "", note: "" });
  const [filterType, setFilterType] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sorted = useMemo(() => {
    let list = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterType) list = list.filter(t => t.type === filterType);
    return list;
  }, [transactions, filterType]);

  async function handleSubmit(e) {
    e.preventDefault();
    const partId = parseInt(form.partId);
    const qty = parseInt(form.quantity);
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    if (form.type === "OUT" && qty > part.quantity) { alert("Insufficient stock"); return; }

    try {
      const res = await secureFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, type: form.type, quantity: qty, reference: form.reference, note: form.note, userId: user.id })
      });
      if (res.ok) {
        const tx = await res.json();
        setParts(prev => prev.map(p => p.id === partId ? { ...p, quantity: form.type === "IN" ? p.quantity + qty : p.quantity - qty } : p));
        setTransactions(prev => [tx, ...prev]);
        addAudit(`${form.type === "IN" ? "Received" : "Issued"} ${qty}× ${part.partNumber} — Ref: ${form.reference}`);
        setShowForm(false);
        setForm({ partId: "", type: "IN", quantity: 1, reference: "", note: "" });
      }
    } catch (err) { console.error(err); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Stock Movements</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...S.select, width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option><option value="IN">Receiving (IN)</option><option value="OUT">Issue (OUT)</option>
          </select>
          {canEdit && <button onClick={() => setShowForm(true)} style={{ ...S.btn, ...S.btnPrimary }}>{Icons.plus({ size: 16 })} Record Movement</button>}
        </div>
      </div>

      <div style={S.card}>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Date & Time</th><th style={S.th}>Part #</th><th style={S.th}>Type</th><th style={S.th}>Qty</th><th style={S.th}>Reference</th><th style={S.th}>Note</th><th style={S.th}>User</th></tr></thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: theme.textDim, padding: 32 }}>No movements recorded</td></tr>
            ) : sorted.map(t => {
              const part = parts.find(p => p.id === t.partId);
              return (
                <tr key={t.id}>
                  <td style={S.td}>{fmtDateTime(t.date)}</td>
                  <td style={S.td}><code style={{ color: theme.primary }}>{part?.partNumber || "?"}</code></td>
                  <td style={S.td}><Badge label={t.type} color={t.type === "IN" ? theme.success : theme.accent} /></td>
                  <td style={S.td}><strong>{t.quantity}</strong></td>
                  <td style={S.td}>{t.reference || "—"}</td>
                  <td style={S.td}><span style={{ color: theme.textMuted }}>{t.note || "—"}</span></td>
                  <td style={S.td}>{t.userName || "System"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Record Stock Movement" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormField label="Part" required>
                <select style={S.select} required value={form.partId} onChange={e => set("partId", e.target.value)}>
                  <option value="">Select part…</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.partNumber} — {p.description}</option>)}
                </select>
              </FormField>
              <FormField label="Type">
                <select style={S.select} value={form.type} onChange={e => set("type", e.target.value)}>
                  <option value="IN">Receiving (IN)</option><option value="OUT">Issue (OUT)</option>
                </select>
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Quantity" required><input style={S.input} type="number" min="1" required value={form.quantity} onChange={e => set("quantity", e.target.value)} /></FormField>
              <FormField label="Reference (PO/WO #)"><input style={S.input} value={form.reference} onChange={e => set("reference", e.target.value)} placeholder="e.g. PO-2025-015" /></FormField>
            </FormRow>
            <FormField label="Note"><input style={S.input} value={form.note} onChange={e => set("note", e.target.value)} placeholder="Reason or details" /></FormField>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...S.btn, ...S.btnGhost }}>Cancel</button>
              <button type="submit" style={{ ...S.btn, ...S.btnPrimary }}>Record</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
function Alerts({ parts }) {
  const lowStock = parts.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint);
  const outOfStock = parts.filter(p => p.quantity === 0);
  const expiring = parts.filter(p => { const d = daysUntilExpiry(p.shelfLife); return d !== null && d <= 90 && d > 0; }).sort((a, b) => daysUntilExpiry(a.shelfLife) - daysUntilExpiry(b.shelfLife));
  const expired = parts.filter(p => { const d = daysUntilExpiry(p.shelfLife); return d !== null && d <= 0; });
  const quarantined = parts.filter(p => p.condition === "Quarantined");

  const Section = ({ title, icon, color, items, columns, renderRow }) => (
    <div style={{ ...S.card, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {icon}<h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <Badge label={items.length} color={color} />
      </div>
      {items.length === 0 ? <p style={{ color: theme.textDim, margin: 0 }}>None — all clear.</p> : (
        <table style={S.table}>
          <thead><tr>{columns.map((c, i) => <th key={i} style={S.th}>{c}</th>)}</tr></thead>
          <tbody>{items.map(renderRow)}</tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>Alerts & Warnings</h1>
      <Section title="AOG Risk — Out of Stock" icon={Icons.alert({ size: 18, color: theme.danger })} color={theme.danger} items={outOfStock}
        columns={["Part #", "Description", "Reorder Point", "Location"]}
        renderRow={p => <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{p.reorderPoint}</td><td style={S.td}>{p.location}</td></tr>}
      />
      <Section title="Low Stock — Below Reorder Point" icon={Icons.alert({ size: 18, color: theme.accent })} color={theme.accent} items={lowStock}
        columns={["Part #", "Description", "Qty", "Reorder Pt", "Deficit"]}
        renderRow={p => <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{p.quantity}</td><td style={S.td}>{p.reorderPoint}</td><td style={S.td}><strong style={{ color: theme.danger }}>{p.reorderPoint - p.quantity}</strong></td></tr>}
      />
      <Section title="Expired Shelf Life" icon={Icons.clock({ size: 18, color: theme.danger })} color={theme.danger} items={expired}
        columns={["Part #", "Description", "Expired On", "Condition"]}
        renderRow={p => <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}><span style={{ color: theme.danger }}>{fmtDate(p.shelfLife)}</span></td><td style={S.td}><ConditionBadge condition={p.condition} /></td></tr>}
      />
      <Section title="Expiring Within 90 Days" icon={Icons.clock({ size: 18, color: theme.accent })} color={theme.accent} items={expiring}
        columns={["Part #", "Description", "Expires", "Days Left"]}
        renderRow={p => <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{fmtDate(p.shelfLife)}</td><td style={S.td}><strong style={{ color: theme.accent }}>{daysUntilExpiry(p.shelfLife)}</strong></td></tr>}
      />
      <Section title="Quarantined Parts" icon={Icons.shield({ size: 18, color: theme.purple })} color={theme.purple} items={quarantined}
        columns={["Part #", "Description", "Location", "Batch #"]}
        renderRow={p => <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{p.location}</td><td style={S.td}>{p.batchNumber || "—"}</td></tr>}
      />
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports({ parts, transactions }) {
  const [tab, setTab] = useState("snapshot");

  const snapshot = useMemo(() => {
    const byCategory = {};
    parts.forEach(p => {
      if (!byCategory[p.category]) byCategory[p.category] = { count: 0, qty: 0, value: 0 };
      byCategory[p.category].count++;
      byCategory[p.category].qty += p.quantity;
      byCategory[p.category].value += p.quantity * p.unitCost;
    });
    return byCategory;
  }, [parts]);

  const totalValue = parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>Reports</h1>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[["snapshot", "Inventory Snapshot"], ["movements", "Movement History"], ["lowstock", "Low Stock Report"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...S.btn, background: tab === k ? theme.primary : "transparent", color: tab === k ? "#fff" : theme.textMuted, border: tab === k ? "none" : `1px solid ${theme.border}` }}>{l}</button>
        ))}
      </div>

      {tab === "snapshot" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px" }}>Current Inventory by Category</h3>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Category</th><th style={S.th}>SKUs</th><th style={S.th}>Total Qty</th><th style={S.th}>Total Value</th><th style={S.th}>% of Value</th></tr></thead>
            <tbody>
              {Object.entries(snapshot).sort((a, b) => b[1].value - a[1].value).map(([cat, d]) => (
                <tr key={cat}><td style={S.td}>{cat}</td><td style={S.td}>{d.count}</td><td style={S.td}>{d.qty.toLocaleString()}</td><td style={S.td}>{fmt(d.value)}</td><td style={S.td}>{totalValue ? (d.value / totalValue * 100).toFixed(1) + "%" : "0%"}</td></tr>
              ))}
              <tr style={{ fontWeight: 700 }}><td style={S.td}>TOTAL</td><td style={S.td}>{parts.length}</td><td style={S.td}>{parts.reduce((s, p) => s + p.quantity, 0).toLocaleString()}</td><td style={S.td}>{fmt(totalValue)}</td><td style={S.td}>100%</td></tr>
            </tbody>
          </table>

          <h3 style={{ margin: "24px 0 16px" }}>Full Inventory Listing</h3>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Part #</th><th style={S.th}>Description</th><th style={S.th}>Qty</th><th style={S.th}>Unit Cost</th><th style={S.th}>Total Value</th><th style={S.th}>Location</th><th style={S.th}>Condition</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id}><td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{p.quantity}</td><td style={S.td}>{fmt(p.unitCost)}</td><td style={S.td}>{fmt(p.quantity * p.unitCost)}</td><td style={S.td}>{p.location}</td><td style={S.td}><ConditionBadge condition={p.condition} /></td><td style={S.td}><StockBadge quantity={p.quantity} reorderPoint={p.reorderPoint} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movements" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px" }}>Complete Movement History</h3>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Date</th><th style={S.th}>Part #</th><th style={S.th}>Description</th><th style={S.th}>Type</th><th style={S.th}>Qty</th><th style={S.th}>Reference</th><th style={S.th}>Note</th><th style={S.th}>By</th></tr></thead>
            <tbody>
              {[...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => {
                const part = parts.find(p => p.id === t.partId);
                const usr = USERS_DB.find(u => u.id === t.userId);
                return (
                  <tr key={t.id}><td style={S.td}>{fmtDateTime(t.date)}</td><td style={S.td}><code style={{ color: theme.primary }}>{part?.partNumber || "?"}</code></td><td style={S.td}>{part?.description || "—"}</td><td style={S.td}><Badge label={t.type} color={t.type === "IN" ? theme.success : theme.accent} /></td><td style={S.td}>{t.quantity}</td><td style={S.td}>{t.reference || "—"}</td><td style={S.td}>{t.note || "—"}</td><td style={S.td}>{usr?.name || "System"}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "lowstock" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px" }}>Low & Out of Stock Report</h3>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Priority</th><th style={S.th}>Part #</th><th style={S.th}>Description</th><th style={S.th}>Manufacturer</th><th style={S.th}>Current Qty</th><th style={S.th}>Reorder Point</th><th style={S.th}>Deficit</th><th style={S.th}>Est. Reorder Cost</th></tr></thead>
            <tbody>
              {parts.filter(p => p.quantity <= p.reorderPoint).sort((a, b) => a.quantity - b.quantity).map(p => {
                const deficit = Math.max(0, p.reorderPoint - p.quantity);
                return (
                  <tr key={p.id}>
                    <td style={S.td}>{p.quantity === 0 ? <Badge label="CRITICAL" color={theme.danger} /> : <Badge label="LOW" color={theme.accent} />}</td>
                    <td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td><td style={S.td}>{p.description}</td><td style={S.td}>{p.manufacturer}</td>
                    <td style={S.td}><strong>{p.quantity}</strong></td><td style={S.td}>{p.reorderPoint}</td><td style={S.td}><strong style={{ color: theme.danger }}>{deficit}</strong></td><td style={S.td}>{fmt(deficit * p.unitCost)}</td>
                  </tr>
                );
              })}
              {parts.filter(p => p.quantity <= p.reorderPoint).length === 0 && (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: theme.textDim, padding: 32 }}>All stock levels are healthy</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Traceability ─────────────────────────────────────────────────────────────
function Traceability({ parts }) {
  const [search, setSearch] = useState("");
  const filtered = parts.filter(p => {
    const q = search.toLowerCase();
    return !q || p.partNumber.toLowerCase().includes(q) || p.serialNumber.toLowerCase().includes(q) || p.batchNumber.toLowerCase().includes(q) || p.certOfConformance.toLowerCase().includes(q);
  });

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>Traceability</h1>
      <div style={{ ...S.card }}>
        <div style={{ position: "relative", width: "100%" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: theme.textDim }}>{Icons.search({ size: 16 })}</span>
          <input style={{ ...S.input, paddingLeft: 34, width: "100%" }} placeholder="Search by part #, serial #, batch #, or COC…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Part #</th><th style={S.th}>Serial #</th><th style={S.th}>Batch / Lot</th><th style={S.th}>COC Reference</th><th style={S.th}>Condition</th><th style={S.th}>Shelf Life</th><th style={S.th}>Days Left</th><th style={S.th}>Manufacturer</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const days = daysUntilExpiry(p.shelfLife);
              return (
                <tr key={p.id}>
                  <td style={S.td}><code style={{ color: theme.primary }}>{p.partNumber}</code></td>
                  <td style={S.td}>{p.serialNumber || <span style={{ color: theme.textDim }}>N/A</span>}</td>
                  <td style={S.td}>{p.batchNumber || "—"}</td>
                  <td style={S.td}>{p.certOfConformance ? <span style={{ color: theme.success }}>{p.certOfConformance}</span> : <Badge label="MISSING" color={theme.danger} />}</td>
                  <td style={S.td}><ConditionBadge condition={p.condition} /></td>
                  <td style={S.td}>{p.shelfLife ? fmtDate(p.shelfLife) : <span style={{ color: theme.textDim }}>N/A</span>}</td>
                  <td style={S.td}>{days !== null ? <span style={{ color: days <= 0 ? theme.danger : days <= 90 ? theme.accent : theme.success, fontWeight: 600 }}>{days}</span> : "—"}</td>
                  <td style={S.td}>{p.manufacturer}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditLog({ auditLog }) {
  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>Audit Log</h1>
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Timestamp</th><th style={S.th}>User</th><th style={S.th}>Role</th><th style={S.th}>Action</th></tr></thead>
          <tbody>
            {auditLog.length === 0 ? (
              <tr><td colSpan={4} style={{ ...S.td, textAlign: "center", color: theme.textDim, padding: 32 }}>No audit events recorded</td></tr>
            ) : [...auditLog].reverse().map((entry, i) => (
              <tr key={i}>
                <td style={S.td}>{fmtDateTime(entry.date)}</td>
                <td style={S.td}><strong>{entry.userName}</strong></td>
                <td style={S.td}><span style={{ color: theme.textMuted }}>{entry.userRole}</span></td>
                <td style={S.td}>{entry.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [parts, setParts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const secureFetch = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : undefined,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      return res;
    }
    return res;
  };
  window.secureFetch = secureFetch;

  async function loadData() {
    setLoading(true);
    try {
      const partsRes = await secureFetch('/api/parts');
      if (!partsRes.ok) return;
      const partsData = await partsRes.json();
      setParts(partsData);

      const txRes = await secureFetch('/api/transactions');
      const txData = await txRes.json();
      setTransactions(txData);

      const auditRes = await secureFetch('/api/audit');
      const auditData = await auditRes.json();
      setAuditLog(auditData);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }

  async function addAudit(action) {
    try {
      await secureFetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id })
      });
      // Refresh audit log
      const res = await secureFetch('/api/audit');
      const data = await res.json();
      setAuditLog(data);
    } catch (err) {
      console.error("Failed to add audit log", err);
    }
  }

  async function handleLogin(data) {
    const { token, user: userData } = data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);

    // addAudit depends on user being set, handleLogin sets it.
    // However, addAudit also uses fetch which now needs token.
    try {
      await secureFetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: "Logged in", userId: userData.id })
      });
    } catch (err) {
      console.error("Failed to log in audit", err);
    }
  }

  function handleLogout() {
    addAudit("Logged out");
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setPage("dashboard");
    setIsSidebarOpen(false);
    setParts([]);
    setTransactions([]);
    setAuditLog([]);
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const authValue = { user, logout: handleLogout };

  const pages = {
    dashboard: <Dashboard parts={parts} transactions={transactions} />,
    parts: <PartsCatalog parts={parts} setParts={setParts} addAudit={addAudit} secureFetch={secureFetch} />,
    movements: <StockMovements parts={parts} setParts={setParts} transactions={transactions} setTransactions={setTransactions} addAudit={addAudit} secureFetch={secureFetch} />,
    alerts: <Alerts parts={parts} />,
    reports: <Reports parts={parts} transactions={transactions} />,
    traceability: <Traceability parts={parts} />,
    audit: <AuditLog auditLog={auditLog} />,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div style={S.app}>
        {isMobile && <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />}
        <Sidebar
          active={page}
          onNav={setPage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div style={{
          ...S.main,
          marginLeft: isMobile ? 0 : 240,
          paddingTop: isMobile ? 84 : 24,
          paddingLeft: isMobile ? 12 : 32,
          paddingRight: isMobile ? 12 : 32,
        }}>
          {pages[page]}
        </div>
      </div>
    </AuthContext.Provider>
  );
}