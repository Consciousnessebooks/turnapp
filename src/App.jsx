import { useState, useMemo, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: "p1", name: "Ana García",      phone: "11-4521-8832", fee: 8500,  freq: "semanal",    day: 1, hour: "10:00", active: true,  token: "tok-ana-001" },
  { id: "p2", name: "Carlos Ruiz",     phone: "11-3345-7721", fee: 9000,  freq: "quincenal",  day: 3, hour: "11:00", active: true,  token: "tok-car-002" },
  { id: "p3", name: "María López",     phone: "11-5598-4430", fee: 7500,  freq: "semanal",    day: 2, hour: "14:00", active: true,  token: "tok-mar-003" },
  { id: "p4", name: "Roberto Sánchez", phone: "11-7712-9923", fee: 10000, freq: "mensual",    day: 4, hour: "16:00", active: true,  token: "tok-rob-004" },
  { id: "p5", name: "Laura Fernández", phone: "11-2234-6678", fee: 8500,  freq: "semanal",    day: 5, hour: "09:00", active: true,  token: "tok-lau-005" },
  { id: "p6", name: "Diego Torres",    phone: "11-8891-3344", fee: 9500,  freq: "quincenal",  day: 2, hour: "18:00", active: false, token: "tok-die-006" },
];

const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const FREQ_LABELS = { semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual" };
const FREQ_COLORS = { semanal: "#06b6d4", quincenal: "#8b5cf6", mensual: "#f59e0b" };

function genAppointments(patients, year, month) {
  const appts = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  patients.filter(p => p.active).forEach(p => {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === p.day) {
        const isWeekEven = Math.ceil(d / 7) % 2 === 0;
        if (p.freq === "mensual" && Math.ceil(d / 7) !== 1) continue;
        if (p.freq === "quincenal" && !isWeekEven) continue;
        appts.push({
          id: `${p.id}-${year}-${month}-${d}`,
          patientId: p.id,
          pname: p.name,
          date,
          hora: p.hour,
          fee: p.fee,
          freq: p.freq,
          estado: "confirmado",
        });
      }
    }
  });
  return appts;
}

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────
function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const bg = type === "success" ? "#059669" : type === "error" ? "#dc2626" : "#3b82f6";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, background: bg,
      color: "#fff", padding: "12px 20px", borderRadius: 12, zIndex: 9999,
      fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      animation: "slideUp .3s ease", maxWidth: 320
    }}>{msg}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// PUSH NOTIFICATION PILL
// ─────────────────────────────────────────────────────────────
function PushPill({ push, onDismiss }) {
  if (!push) return null;
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9998,
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: 16, padding: "12px 16px", maxWidth: 300,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", display: "flex", gap: 12, alignItems: "flex-start",
      animation: "slideDown .3s ease"
    }}>
      <div style={{ fontSize: 28 }}>{push.icon || "🔔"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>TURNAPP · Notificación Push</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{push.title}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{push.body}</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");       // landing | login | professional | admin | patient
  const [loginRole, setLoginRole] = useState("professional");
  const [toast, setToast] = useState(null);
  const [push, setPush] = useState(null);
  const [patientPortalId, setPatientPortalId] = useState(null);
  const [patients, setPatients] = useState(MOCK_PATIENTS);

  const now = new Date();
  const [appts, setAppts] = useState(() => genAppointments(MOCK_PATIENTS, now.getFullYear(), now.getMonth()));

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const pushNotify = useCallback((title, body, icon = "📲") => {
    setPush({ title, body, icon });
    setTimeout(() => setPush(null), 5000);
  }, []);

  const goPatientPortal = (patientId) => {
    setPatientPortalId(patientId);
    setScreen("patient");
  };

  const goBack = () => {
    if (screen === "patient") { setScreen("professional"); setPatientPortalId(null); }
    else { setScreen("landing"); }
  };

  const screens = {
    landing: <LandingPage onLogin={(role) => { setLoginRole(role); setScreen("login"); }} />,
    login: <LoginScreen role={loginRole} onSuccess={() => setScreen(loginRole === "admin" ? "admin" : "professional")} onBack={() => setScreen("landing")} />,
    professional: <ProfessionalPanel appts={appts} setAppts={setAppts} patients={patients} setPatients={setPatients} notify={notify} pushNotify={pushNotify} onPatientPortal={goPatientPortal} onLogout={() => setScreen("landing")} />,
    admin: <AdminPanel onLogout={() => setScreen("landing")} notify={notify} />,
    patient: <PatientPortal patientId={patientPortalId} patients={patients} appts={appts} setAppts={setAppts} notify={notify} pushNotify={pushNotify} onBack={goBack} />,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0a0f1e", minHeight: "100vh", color: "#f1f5f9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#0f172a; } ::-webkit-scrollbar-thumb { background:#334155; border-radius:3px; }
        button:hover { opacity:.9; transform: scale(1.01); transition: all .15s ease; }
      `}</style>
      {screens[screen]}
      <Toast msg={toast?.msg} type={toast?.type} />
      <PushPill push={push} onDismiss={() => setPush(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────
function LandingPage({ onLogin }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b33 50%, #0a0f1e 100%)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(10,15,30,0.9)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #06b6d4, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>TURNAPP</span>
          <span style={{ fontSize: 11, background: "rgba(6,182,212,0.15)", color: "#06b6d4", padding: "2px 8px", borderRadius: 20, fontWeight: 700, border: "1px solid rgba(6,182,212,0.3)" }}>BETA</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onLogin("admin")} style={{ padding: "9px 16px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Panel Admin</button>
          <button onClick={() => onLogin("professional")} style={{ padding: "9px 16px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Iniciar sesión</button>
          <button onClick={() => onLogin("professional")} style={{ padding: "9px 16px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Empezar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px 60px", textAlign: "center", animation: "fadeUp .6s ease" }}>
        <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", fontSize: 12, fontWeight: 700, color: "#06b6d4", marginBottom: 24 }}>
          🚀 Costo operativo: $0/mes · Push Notifications nativas
        </div>
        <h1 style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 20 }}>
          Tu agenda clínica<br/>
          <span style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>en piloto automático</span>
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
          Turnos recurrentes, recordatorios directo al celular de tus pacientes, cancelaciones con un toque. Sin WhatsApp Business, sin costos mensuales.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => onLogin("professional")} style={{ padding: "14px 32px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 16, boxShadow: "0 8px 32px rgba(6,182,212,0.3)" }}>
            → Ver demo del profesional
          </button>
          <button onClick={() => onLogin("admin")} style={{ padding: "14px 32px", background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 16 }}>
            → Panel Super Admin
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ maxWidth: 900, margin: "0 auto 60px", padding: "0 40px", display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {[["$0/mes","costo operativo total"],["Web Push","notificaciones nativas"],["3 niveles","Super Admin · Pro · Paciente"],["5 min","para agregar un profesional"]].map(([val, label]) => (
          <div key={val} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 28px", textAlign: "center", minWidth: 160 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-1px" }}>{val}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* PRICING */}
      <div style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 40px" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 32, letterSpacing: "-1px" }}>Planes para profesionales</h2>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { name: "Starter", price: "Gratis", limit: "Hasta 15 pacientes", color: "#334155", highlight: false },
            { name: "Pro", price: "$4.999 ARS/mes", limit: "Hasta 100 pacientes", color: "#06b6d4", highlight: true },
            { name: "Clínica", price: "$9.999 ARS/mes", limit: "Ilimitados", color: "#8b5cf6", highlight: false },
          ].map(p => (
            <div key={p.name} style={{ background: p.highlight ? "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(59,130,246,0.1))" : "rgba(255,255,255,0.04)", border: `1px solid ${p.highlight ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "28px 32px", minWidth: 220, textAlign: "center", position: "relative" }}>
              {p.highlight && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#06b6d4", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>MÁS POPULAR</div>}
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: p.color, marginBottom: 6 }}>{p.price}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{p.limit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────
function LoginScreen({ role, onSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const isAdmin = role === "admin";

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center, #0d1b33 0%, #0a0f1e 70%)", padding: 24 }}>
      <button onClick={onBack} style={{ position: "fixed", top: 24, left: 24, background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Volver</button>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp .4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: isAdmin ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "linear-gradient(135deg, #06b6d4, #3b82f6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>{isAdmin ? "🛡️" : "👨‍⚕️"}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>{isAdmin ? "Panel Super Admin" : "Acceso Profesional"}</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>{isAdmin ? "Control total de la plataforma" : "Ingresá a tu consultorio digital"}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>EMAIL</label>
            <input defaultValue={isAdmin ? "admin@turnapp.ar" : "dra.garcia@turnapp.ar"} style={{ width: "100%", padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>CONTRASEÑA</label>
            <input type="password" defaultValue="••••••••" style={{ width: "100%", padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          </div>
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px", background: isAdmin ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Verificando..." : `Ingresar como ${isAdmin ? "Super Admin" : "Profesional"}`}
          </button>
        </div>
        <p style={{ textAlign: "center", color: "#334155", fontSize: 12, marginTop: 16 }}>Demo — no se requiere registro real</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFESSIONAL PANEL
// ─────────────────────────────────────────────────────────────
function ProfessionalPanel({ appts, setAppts, patients, setPatients, notify, pushNotify, onPatientPortal, onLogout }) {
  const [tab, setTab] = useState("hoy");
  const [selDay, setSelDay] = useState(new Date());
  const [search, setSearch] = useState("");
  const [alertas] = useState([
    { id: 1, icon: "🔴", msg: "Carlos Ruiz canceló su turno del Miércoles 12/03", time: "hace 2h", read: false },
    { id: 2, icon: "🟢", msg: "5 pacientes confirmaron turnos de marzo", time: "hace 4h", read: true },
    { id: 3, icon: "🔵", msg: "Recordatorio enviado a 6 pacientes para la próxima semana", time: "ayer", read: true },
  ]);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const today = useMemo(() => new Date(), []);
  const todayAppts = useMemo(() => appts.filter(a => a.date.toDateString() === today.toDateString() && a.estado !== "cancelado").sort((a, b) => a.hora.localeCompare(b.hora)), [appts, today]);
  const dayAppts = useMemo(() => appts.filter(a => a.date.toDateString() === selDay.toDateString() && a.estado !== "cancelado").sort((a, b) => a.hora.localeCompare(b.hora)), [appts, selDay]);
  const filteredPatients = useMemo(() => patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [patients, search]);
  const activeCount = patients.filter(p => p.active).length;
  const monthTotal = appts.filter(a => a.estado !== "cancelado").reduce((s, a) => s + a.fee, 0);

  const cancelAppt = (appt) => {
    setAppts(prev => prev.map(a => a.id === appt.id ? { ...a, estado: "cancelado" } : a));
    pushNotify("Turno cancelado", `${appt.pname} · ${appt.hora}`, "❌");
    notify(`Turno de ${appt.pname} cancelado. Push enviado.`);
    setConfirmModal(null);
  };

  const sendReminders = () => {
    pushNotify("Recordatorios enviados", `${activeCount} pacientes notificados`, "📲");
    notify(`Recordatorio enviado a ${activeCount} pacientes`);
  };

  // Days strip for agenda
  const stripDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  const tabs = [
    { key: "hoy", label: "Hoy", icon: "🏠" },
    { key: "agenda", label: "Agenda", icon: "📅" },
    { key: "pacientes", label: "Pacientes", icon: "👥" },
    { key: "alertas", label: "Alertas", icon: "🔔", badge: alertas.filter(a => !a.read).length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "#0f172a", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #06b6d4, #3b82f6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📅</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>TURNAPP</span>
          <span style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Profesional</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Dra. García</div>
          <button onClick={onLogout} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Salir</button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e293b", background: "#0f172a", flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "14px 8px", background: "none", border: "none", borderBottom: tab === t.key ? "2px solid #06b6d4" : "2px solid transparent", color: tab === t.key ? "#06b6d4" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .2s ease", position: "relative" }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
            {t.badge > 0 && <span style={{ position: "absolute", top: 8, right: "calc(50% - 18px)", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>

        {/* ─── HOY ─── */}
        {tab === "hoy" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Buenos días 👋</h2>
                <p style={{ color: "#64748b", fontSize: 14 }}>{DAYS_ES[today.getDay()]} {today.getDate()} de {MONTHS_ES[today.getMonth()]} · {todayAppts.length} turnos hoy</p>
              </div>
              <button onClick={sendReminders} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                📲 Enviar recordatorios
              </button>
            </div>

            {/* STATS */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                { label: "Turnos hoy", val: todayAppts.length, color: "#06b6d4", icon: "📅" },
                { label: "Pacientes activos", val: activeCount, color: "#10b981", icon: "👥" },
                { label: "Total del mes", val: `$${monthTotal.toLocaleString("es-AR")}`, color: "#f59e0b", icon: "💰" },
                { label: "Cancelados", val: appts.filter(a => a.estado === "cancelado").length, color: "#ef4444", icon: "❌" },
              ].map(s => (
                <div key={s.label} style={{ flex: "1 1 130px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* TODAY APPOINTMENTS */}
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Turnos de hoy</h3>
            {todayAppts.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "32px", textAlign: "center", color: "#475569" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700 }}>No tenés turnos hoy</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {todayAppts.map(a => <ApptCard key={a.id} appt={a} onCancel={() => setConfirmModal(a)} onPortal={() => onPatientPortal(a.patientId)} />)}
              </div>
            )}
          </div>
        )}

        {/* ─── AGENDA ─── */}
        {tab === "agenda" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px" }}>📅 Agenda</h2>

            {/* Day strip */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
              {stripDays.map(d => {
                const isToday = d.toDateString() === today.toDateString();
                const isSel = d.toDateString() === selDay.toDateString();
                const cnt = appts.filter(a => a.date.toDateString() === d.toDateString() && a.estado !== "cancelado").length;
                return (
                  <button key={d.toISOString()} onClick={() => setSelDay(new Date(d))} style={{ flexShrink: 0, width: 52, padding: "10px 6px", background: isSel ? "linear-gradient(135deg, #06b6d4, #3b82f6)" : isToday ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.04)", border: isSel ? "none" : `1px solid ${isToday ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, color: isSel ? "#fff" : isToday ? "#06b6d4" : "#94a3b8", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{DAYS_ES[d.getDay()]}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</div>
                    {cnt > 0 && <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700, opacity: 0.8 }}>{cnt}t</div>}
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>
              {DAYS_ES[selDay.getDay()]} {selDay.getDate()} de {MONTHS_ES[selDay.getMonth()]} — {dayAppts.length} turno{dayAppts.length !== 1 ? "s" : ""}
            </div>
            {dayAppts.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "40px", textAlign: "center", color: "#475569" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontWeight: 700 }}>Sin turnos este día</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayAppts.map(a => <ApptCard key={a.id} appt={a} onCancel={() => setConfirmModal(a)} onPortal={() => onPatientPortal(a.patientId)} />)}
              </div>
            )}
          </div>
        )}

        {/* ─── PACIENTES ─── */}
        {tab === "pacientes" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>👥 Pacientes ({patients.filter(p => p.active).length} activos)</h2>
              <button onClick={() => setShowAddPatient(true)} style={{ padding: "9px 16px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Agregar paciente</button>
            </div>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#475569" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." style={{ width: "100%", padding: "10px 12px 10px 34px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredPatients.map(p => (
                <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${p.active ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.2)"}`, borderRadius: 14, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${FREQ_COLORS[p.freq]}20`, color: FREQ_COLORS[p.freq], fontWeight: 700, border: `1px solid ${FREQ_COLORS[p.freq]}40` }}>{FREQ_LABELS[p.freq]}</span>
                      {!p.active && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 700 }}>Inactivo</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>📞 {p.phone} · 💰 ${p.fee.toLocaleString("es-AR")} · {DAYS_ES[p.day]}s {p.hour}</div>
                  </div>
                  <button
                    onClick={() => onPatientPortal(p.id)}
                    style={{ padding: "8px 14px", background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
                  >
                    👁 Ver portal
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ALERTAS ─── */}
        {tab === "alertas" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.5px" }}>🔔 Alertas</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alertas.map(a => (
                <div key={a.id} style={{ background: a.read ? "rgba(255,255,255,0.03)" : "rgba(6,182,212,0.06)", border: `1px solid ${a.read ? "rgba(255,255,255,0.06)" : "rgba(6,182,212,0.2)"}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: a.read ? 500 : 700, color: a.read ? "#94a3b8" : "#f1f5f9" }}>{a.msg}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{a.time}</div>
                  </div>
                  {!a.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4", flexShrink: 0, marginTop: 5 }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000, padding: 24 }}>
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%", animation: "fadeUp .2s ease" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Cancelar turno</h3>
            <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: 24, fontSize: 14 }}>
              ¿Confirmás cancelar el turno de <strong style={{ color: "#f1f5f9" }}>{confirmModal.pname}</strong> el {DAYS_ES[confirmModal.date.getDay()]} {confirmModal.date.getDate()}/{confirmModal.date.getMonth()+1} a las {confirmModal.hora}?<br />
              Se enviará una push notification al paciente.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#94a3b8", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancelar</button>
              <button onClick={() => cancelAppt(confirmModal)} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Sí, cancelar turno</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PATIENT MODAL */}
      {showAddPatient && <AddPatientModal onClose={() => setShowAddPatient(false)} onAdd={(np) => { setPatients(prev => [...prev, np]); setShowAddPatient(false); notify(`Paciente ${np.name} agregado correctamente`); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APPOINTMENT CARD
// ─────────────────────────────────────────────────────────────
function ApptCard({ appt, onCancel, onPortal }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{appt.pname}</span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: `${FREQ_COLORS[appt.freq]}20`, color: FREQ_COLORS[appt.freq], fontWeight: 700 }}>{FREQ_LABELS[appt.freq]}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>🕐 {appt.hora} · 💰 ${appt.fee.toLocaleString("es-AR")}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onPortal} style={{ padding: "7px 12px", background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>👁 Portal</button>
        <button onClick={onCancel} style={{ padding: "7px 12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADD PATIENT MODAL
// ─────────────────────────────────────────────────────────────
function AddPatientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", fee: "8500", freq: "semanal", day: "1", hour: "10:00" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.name || !form.phone) return;
    const id = `p${Date.now()}`;
    onAdd({ id, name: form.name, phone: form.phone, fee: parseInt(form.fee), freq: form.freq, day: parseInt(form.day), hour: form.hour, active: true, token: `tok-${id}` });
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000, padding: 24 }}>
      <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", animation: "fadeUp .2s ease" }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>➕ Nuevo paciente</h3>
        {[["name","Nombre completo","text"],["phone","Teléfono","text"],["fee","Honorario (ARS)","number"],["hour","Hora","time"]].map(([k,label,type]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
            <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Frecuencia</label>
            <select value={form.freq} onChange={e => set("freq", e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }}>
              <option value="semanal">Semanal</option><option value="quincenal">Quincenal</option><option value="mensual">Mensual</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Día</label>
            <select value={form.day} onChange={e => set("day", e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }}>
              {DAYS_ES.slice(1).map((d, i) => <option key={i+1} value={i+1}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#94a3b8", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancelar</button>
          <button onClick={submit} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Agregar paciente</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PATIENT PORTAL  ← BUG PRINCIPAL CORREGIDO ACÁ
// ─────────────────────────────────────────────────────────────
function PatientPortal({ patientId, patients, appts, setAppts, notify, pushNotify, onBack }) {
  const patient = patients.find(p => p.id === patientId);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // CORREGIDO: filtra correctamente por patientId
  const patientAppts = useMemo(() =>
    appts
      .filter(a => a.patientId === patientId && a.estado !== "cancelado")
      .sort((a, b) => a.date - b.date)
      .slice(0, 8),
    [appts, patientId]
  );

  const cancelOne = (appt) => {
    setAppts(prev => prev.map(a => a.id === appt.id ? { ...a, estado: "cancelado" } : a));
    pushNotify("Turno cancelado", `Tu turno del ${DAYS_ES[appt.date.getDay()]} ${appt.date.getDate()}/${appt.date.getMonth()+1} fue cancelado`, "❌");
    notify("Turno cancelado. El profesional fue notificado.");
    setCancelConfirm(null);
  };

  const confirmAll = () => {
    setConfirmed(true);
    pushNotify("Turnos confirmados", `Confirmaste ${patientAppts.length} turnos para este mes`, "✅");
    notify(`${patientAppts.length} turnos confirmados. ¡Gracias!`);
  };

  if (!patient) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Paciente no encontrado</div>
        <button onClick={onBack} style={{ padding: "10px 20px", background: "#06b6d4", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>← Volver</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 100%)" }}>
      {/* PORTAL HEADER */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Volver al panel</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #06b6d4, #3b82f6)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📅</div>
          <span style={{ fontWeight: 800, fontSize: 15 }}>TURNAPP</span>
          <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>Portal Paciente</span>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>

        {/* PATIENT CARD */}
        <div style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(59,130,246,0.05))", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 20, padding: "24px", marginBottom: 20, animation: "fadeUp .4s ease" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #06b6d4, #3b82f6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🧑‍💼</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{patient.name}</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Dra. García · Honorario: <strong style={{ color: "#f59e0b" }}>${patient.fee.toLocaleString("es-AR")} c/sesión</strong></div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Frecuencia: <span style={{ color: FREQ_COLORS[patient.freq], fontWeight: 700 }}>{FREQ_LABELS[patient.freq]}</span></div>
            </div>
          </div>
        </div>

        {/* CONFIRM ALL */}
        {!confirmed && patientAppts.length > 0 && (
          <button onClick={confirmAll} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 16, marginBottom: 16, boxShadow: "0 8px 24px rgba(16,185,129,0.25)" }}>
            ✅ CONFIRMAR TODOS MIS TURNOS ({patientAppts.length})
          </button>
        )}
        {confirmed && (
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: "16px", textAlign: "center", marginBottom: 16, animation: "fadeUp .3s ease" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#10b981" }}>¡Turnos confirmados! Gracias.</div>
          </div>
        )}

        {/* APPOINTMENTS LIST */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Próximos turnos</h3>
        {patientAppts.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "32px", textAlign: "center", color: "#475569" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div>No hay turnos próximos</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {patientAppts.map(a => (
              <div key={a.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                    {DAYS_ES[a.date.getDay()]} {a.date.getDate()} de {MONTHS_ES[a.date.getMonth()]}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>🕐 {a.hora} · 💰 ${a.fee.toLocaleString("es-AR")}</div>
                </div>
                <button onClick={() => setCancelConfirm(a)} style={{ padding: "7px 12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>¿Necesitás hablar con el consultorio?</div>
          <button style={{ padding: "8px 18px", background: "rgba(37,211,102,0.1)", color: "#25d366", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 20, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>💬 Escribir por WhatsApp</button>
        </div>
      </div>

      {/* CANCEL MODAL */}
      {cancelConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, padding: 20 }}>
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", animation: "fadeUp .2s ease", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>¿Cancelar este turno?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              <strong style={{ color: "#f1f5f9" }}>{DAYS_ES[cancelConfirm.date.getDay()]} {cancelConfirm.date.getDate()}/{cancelConfirm.date.getMonth()+1}</strong> a las <strong style={{ color: "#f1f5f9" }}>{cancelConfirm.hora}</strong>.<br/>
              El consultorio será notificado automáticamente.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCancelConfirm(null)} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#94a3b8", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>No, volver</button>
              <button onClick={() => cancelOne(cancelConfirm)} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUPER ADMIN PANEL
// ─────────────────────────────────────────────────────────────
function AdminPanel({ onLogout, notify }) {
  const [tab, setTab] = useState("dashboard");
  const [professionals] = useState([
    { id: 1, name: "Dra. Ana García", specialty: "Psicología", patients: 23, plan: "Pro", status: "activo", since: "Ene 2025" },
    { id: 2, name: "Dr. Luis Martínez", specialty: "Psicología", patients: 8, plan: "Starter", status: "activo", since: "Feb 2025" },
    { id: 3, name: "Lic. Paula Rodríguez", specialty: "Psiquiatría", patients: 45, plan: "Clínica", status: "activo", since: "Dic 2024" },
    { id: 4, name: "Dr. Marcos Pérez", specialty: "Psicología", patients: 3, plan: "Starter", status: "pendiente", since: "Mar 2025" },
  ]);

  const totalPatients = professionals.reduce((s, p) => s + p.patients, 0);
  const mrr = professionals.filter(p => p.plan === "Pro").length * 4999 + professionals.filter(p => p.plan === "Clínica").length * 9999;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "#150b2e", borderBottom: "1px solid #2d1b69", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>TURNAPP</span>
          <span style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Super Admin</span>
        </div>
        <button onClick={onLogout} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #4c1d95", color: "#a78bfa", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Salir</button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid #2d1b69", background: "#150b2e", flexShrink: 0 }}>
        {[["dashboard","📊 Dashboard"],["profesionales","👨‍⚕️ Profesionales"],["plataforma","⚙️ Plataforma"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "13px 8px", background: "none", border: "none", borderBottom: tab === k ? "2px solid #8b5cf6" : "2px solid transparent", color: tab === k ? "#a78bfa" : "#6d28d9", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20, background: "#0d0820" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.5px" }}>Resumen de plataforma</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              {[
                { label: "Profesionales", val: professionals.length, icon: "👨‍⚕️", color: "#8b5cf6" },
                { label: "Pacientes totales", val: totalPatients, icon: "👥", color: "#06b6d4" },
                { label: "MRR estimado", val: `$${mrr.toLocaleString("es-AR")}`, icon: "💰", color: "#10b981" },
                { label: "Costo infra/mes", val: "$0", icon: "☁️", color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ flex: "1 1 140px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>📋 Arquitectura de control</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                <strong style={{ color: "#c4b5fd" }}>Modelo A — Control Total:</strong> Martín crea manualmente todas las cuentas de profesionales. No existe auto-registro.<br/>
                Jerarquía: <strong style={{ color: "#c4b5fd" }}>Super Admin</strong> → Profesional → Paciente · Stack: PWA + Supabase + Vercel + Web Push ($0/mes)
              </div>
            </div>
          </div>
        )}

        {/* PROFESIONALES */}
        {tab === "profesionales" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>Profesionales registrados</h2>
              <button onClick={() => notify("Cuenta creada (demo)")} style={{ padding: "9px 16px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Crear cuenta</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {professionals.map(p => (
                <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: p.plan === "Clínica" ? "rgba(139,92,246,0.15)" : p.plan === "Pro" ? "rgba(6,182,212,0.12)" : "rgba(100,116,139,0.15)", color: p.plan === "Clínica" ? "#a78bfa" : p.plan === "Pro" ? "#06b6d4" : "#94a3b8", fontWeight: 700, border: `1px solid ${p.plan === "Clínica" ? "rgba(139,92,246,0.3)" : p.plan === "Pro" ? "rgba(6,182,212,0.25)" : "rgba(100,116,139,0.25)"}` }}>{p.plan}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: p.status === "activo" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: p.status === "activo" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{p.specialty} · {p.patients} pacientes · desde {p.since}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => notify(`Accediendo a ${p.name} (demo)`)} style={{ padding: "6px 12px", background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Ver panel</button>
                    <button onClick={() => notify(`Plan actualizado (demo)`)} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Editar plan</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLATAFORMA */}
        {tab === "plataforma" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Configuración de plataforma</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Supabase", desc: "Base de datos · RLS activado · 100% free tier", status: "✅ Conectado", color: "#10b981" },
                { label: "Vercel", desc: "Hosting PWA · Auto-deploy desde GitHub", status: "✅ Activo", color: "#10b981" },
                { label: "Web Push (VAPID)", desc: "Notificaciones nativas · $0 · Ilimitadas", status: "✅ Configurado", color: "#10b981" },
                { label: "MercadoPago", desc: "Cobro de suscripciones a profesionales", status: "⚙️ Pendiente", color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{s.desc}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color, whiteSpace: "nowrap" }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
