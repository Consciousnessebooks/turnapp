import { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, Users, DollarSign, XCircle, Clock, Bell, Search, Filter, ChevronLeft, ChevronRight, Settings, LogOut, Shield, Plus, Edit3, Trash2, Phone, Mail, AlertTriangle, CheckCircle, Send, Eye, ArrowLeft, Home, UserPlus, TrendingUp, X, Check, LayoutList, CalendarDays, RefreshCw, Star } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE CLIENT ───
const supabaseUrl = 'https://hszobstcatbyzijbdnpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzem9ic3RjYXRieXppamJkbnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzY0NDQsImV4cCI6MjA4OTAxMjQ0NH0.Jl0KNbT40lS3ybc8sPPfZVkhnPdTZPNXXpG9xlP5Ybc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


const FREQ_L = { semanal:"Semanal",quincenal:"Quincenal",mensual:"Mensual",bimestral:"Bimestral",trimestral:"Trimestral" };
const FREQ_C = { semanal:"#0891b2",quincenal:"#7c3aed",mensual:"#d97706",bimestral:"#059669",trimestral:"#dc2626" };
const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAYS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];


// ─── STYLES ───
const theme = {
  bg: "#f8fafc", card: "#ffffff", dark: "#0f172a", text: "#334155", muted: "#94a3b8",
  border: "#e2e8f0", primary: "#0891b2", primaryBg: "#ecfeff", accent: "#7c3aed",
  success: "#059669", successBg: "#ecfdf5", danger: "#dc2626", dangerBg: "#fef2f2",
  warning: "#d97706", warningBg: "#fffbeb",
};

// ─── COMPONENTS ───
function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type==="success"?"#059669":type==="error"?"#dc2626":"#0891b2";
  return <div style={{ position:"fixed",bottom:20,right:20,background:bg,color:"#fff",padding:"12px 20px",borderRadius:12,zIndex:9999,fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,.2)",maxWidth:340,animation:"slideUp .3s ease" }}>{msg}</div>;
}

function PushPill({ push, onDismiss }) {
  if (!push) return null;
  return (
    <div style={{ position:"fixed",top:16,right:16,zIndex:9998,background:"#0f172a",border:"1px solid #1e293b",borderRadius:14,padding:"14px 16px",maxWidth:320,boxShadow:"0 8px 32px rgba(0,0,0,.4)",display:"flex",gap:12,animation:"slideDown .3s ease" }}>
      <div style={{ width:40,height:40,borderRadius:10,background:"rgba(8,145,178,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <Bell size={18} color="#0891b2" />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#64748b",marginBottom:2 }}>TURNAPP</div>
        <div style={{ fontSize:13,fontWeight:700,color:"#f1f5f9" }}>{push.title}</div>
        <div style={{ fontSize:12,color:"#94a3b8" }}>{push.body}</div>
      </div>
      <button onClick={onDismiss} style={{ background:"none",border:"none",color:"#475569",cursor:"pointer",padding:0 }}><X size={16}/></button>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:20,padding:"24px 22px",maxWidth:420,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)",animation:"scaleIn .2s ease" }} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  return <span style={{ display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:`${color}18`,color,border:`1px solid ${color}30` }}>{children}</span>;
}

function Btn({ children, variant="primary", onClick, full, small, disabled }) {
  const styles = {
    primary: { background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none" },
    danger: { background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca" },
    ghost: { background:"transparent",color:"#64748b",border:"1px solid #e2e8f0" },
    accent: { background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none" },
  };
  const s = styles[variant] || styles.primary;
  return <button disabled={disabled} onClick={onClick} style={{ ...s, padding:small?"8px 12px":"11px 18px", borderRadius:10, fontWeight:700, fontSize:small?12:13, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", width:full?"100%":undefined, opacity:disabled?.5:1, display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>{children}</button>;
}

function StatCard({ icon:Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} style={{ flex:"1 1 140px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px 18px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s",borderLeft:`4px solid ${color}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
        <Icon size={18} color={color} />
        <span style={{ fontSize:12,color:"#64748b",fontWeight:600 }}>{label}</span>
      </div>
      <div style={{ fontSize:22,fontWeight:800,color }}>{value}</div>
    </button>
  );
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [professionalId, setProfessionalId] = useState(null);
  const [loginRole, setLoginRole] = useState("professional");
  const [toast, setToast] = useState(null);
  const [push, setPush] = useState(null);
  const [patientPortalId, setPatientPortalId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  const notify = useCallback((msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }, []);
  const pushNotify = useCallback((title, body) => { setPush({title,body}); setTimeout(()=>setPush(null),5000); }, []);

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        checkUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setUserRole(null);
        setProfessionalId(null);
        setScreen('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId) => {
    try {
      const { data: adminData } = await supabase
        .from('super_admin')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (adminData) {
        setUserRole('admin');
        setScreen('admin');
        return;
      }

      const { data: profData } = await supabase
        .from('profesionales')
        .select('id, user_id')
        .eq('user_id', userId)
        .single();

      if (profData) {
        setUserRole('professional');
        setProfessionalId(profData.id);
        setScreen('professional');
        loadProfessionalData(profData.id);
        return;
      }
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const loadProfessionalData = async (profId) => {
    setLoading(true);
    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('profesional_id', profId)
        .order('apellido', { ascending: true });

      if (patientsError) throw patientsError;

      const transformedPatients = (patientsData || []).map(p => ({
        id: p.id,
        name: `${p.apellido}, ${p.nombre}`,
        phone: p.telefono,
        fee: p.honorario,
        freq: p.frecuencia,
        day: p.dia_semana,
        hour: p.hora_habitual,
        active: p.activo,
        token: p.push_token || '',
        tutor: p.tutor || '',
        duracion: p.duracion_sesion,
        notes: p.notas_internas || ''
      }));

      setPatients(transformedPatients);

      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
      
      const { data: apptsData, error: apptsError } = await supabase
        .from('turnos')
        .select('*, pacientes(nombre, apellido)')
        .eq('profesional_id', profId)
        .gte('fecha_hora', startDate)
        .lte('fecha_hora', endDate)
        .order('fecha_hora', { ascending: true });

      if (apptsError) throw apptsError;

      const transformedAppts = (apptsData || []).map(a => ({
        id: a.id,
        pid: a.paciente_id,
        pname: a.pacientes ? `${a.pacientes.apellido}, ${a.pacientes.nombre}` : 'Desconocido',
        date: new Date(a.fecha_hora),
        hora: a.fecha_hora.split('T')[1].substring(0, 5),
        fee: a.honorario,
        freq: a.frecuencia,
        estado: a.estado
      }));

      setAppts(transformedAppts);
    } catch (error) {
      notify(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      notify('Sesión iniciada');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScreen('landing');
    setUserRole(null);
    setProfessionalId(null);
    setPatients([]);
    setAppts([]);
    notify('Sesión cerrada');
  };

  const handleAddPatient = async (patientData) => {
    if (!professionalId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([{
          profesional_id: professionalId,
          nombre: patientData.nombre,
          apellido: patientData.apellido,
          telefono: patientData.telefono,
          honorario: patientData.honorario,
          frecuencia: patientData.frecuencia,
          dia_semana: patientData.dia_semana,
          hora_habitual: patientData.hora_habitual,
          activo: true,
          tutor: patientData.tutor || null,
          duracion_sesion: patientData.duracion_sesion || 50,
          notas_internas: patientData.notas_internas || ''
        }])
        .select()
        .single();

      if (error) throw error;
      await loadProfessionalData(professionalId);
      notify('Paciente agregado');
      return data;
    } catch (error) {
      notify(error.message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = async (patientId, updates) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pacientes')
        .update(updates)
        .eq('id', patientId);

      if (error) throw error;
      await loadProfessionalData(professionalId);
      notify('Paciente actualizado');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pacientes')
        .update({ activo: false })
        .eq('id', patientId);

      if (error) throw error;
      await loadProfessionalData(professionalId);
      notify('Paciente desactivado');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAppointments = async (patientId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generar_turnos_paciente', {
        p_paciente_id: patientId,
        p_meses_adelante: 3
      });

      if (error) throw error;
      await loadProfessionalData(professionalId);
      notify(`${data} turnos generados`);
    } catch (error) {
      notify(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',system-ui,sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  button:active { transform:scale(.98); }
  input:focus,select:focus { outline:none; border-color:#0891b2!important; box-shadow:0 0 0 3px rgba(8,145,178,.1); }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}`;

  const goPatient = (id) => { setPatientPortalId(id); setScreen("patient"); };
  const goBack = () => { setScreen(screen==="patient"?"professional":"landing"); setPatientPortalId(null); };

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif",background:screen==="landing"||screen==="login"||screen==="admin"?"#0a0f1e":"#f8fafc",minHeight:"100vh",color:screen==="landing"||screen==="login"||screen==="admin"?"#f1f5f9":"#0f172a" }}>
      <style>{CSS}</style>
      {screen==="landing" && <Landing onLogin={(r)=>{setLoginRole(r);setScreen("login");}} />}
      {screen==="login" && <Login role={loginRole} onLogin={handleLogin} onBack={()=>setScreen("landing")} loading={loading} />}
      {screen==="professional" && (
        <Professional 
          appts={appts}
          patients={patients}
          onLogout={handleLogout}
          notify={notify}
          pushNotify={pushNotify}
          onAddPatient={handleAddPatient}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
          onGenerateAppointments={handleGenerateAppointments}
          loading={loading}
        />
      )}
      {screen==="admin" && <Admin onLogout={()=>setScreen("landing")} notify={notify} />}
      {screen==="patient" && <Patient pid={patientPortalId} patients={patients} setPatients={setPatients} appts={appts} setAppts={setAppts} notify={notify} pushNotify={pushNotify} onBack={goBack} />}
      <Toast msg={toast?.msg} type={toast?.type} />
      <PushPill push={push} onDismiss={()=>setPush(null)} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════
function Landing({ onLogin }) {
  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e,#0d1b33)" }}>
      <nav style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px",maxWidth:1100,margin:"0 auto",borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ width:32,height:32,background:"linear-gradient(135deg,#0891b2,#0e7490)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}><Calendar size={16} color="#fff"/></div>
          <span style={{ fontSize:18,fontWeight:900,letterSpacing:"-.5px" }}>TURNAPP</span>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          <button onClick={()=>onLogin("admin")} style={{ padding:"8px 14px",background:"transparent",color:"#64748b",border:"1px solid #1e293b",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Admin</button>
          <button onClick={()=>onLogin("professional")} style={{ padding:"8px 14px",background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Ver demo</button>
        </div>
      </nav>
      <div style={{ maxWidth:1100,margin:"0 auto",padding:"60px 24px",textAlign:"center",animation:"fadeUp .5s ease" }}>
        <div style={{ display:"inline-flex",padding:"5px 14px",borderRadius:20,background:"rgba(8,145,178,.08)",border:"1px solid rgba(8,145,178,.2)",fontSize:12,fontWeight:700,color:"#0891b2",marginBottom:24,alignItems:"center",gap:6 }}>
          <TrendingUp size={14}/> Costo operativo: $0/mes
        </div>
        <h1 style={{ fontSize:"clamp(32px,5vw,56px)",fontWeight:900,lineHeight:1.05,letterSpacing:"-2px",marginBottom:20 }}>
          Tu agenda clínica<br/><span style={{ background:"linear-gradient(135deg,#0891b2,#06b6d4,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>en piloto automático</span>
        </h1>
        <p style={{ fontSize:17,color:"#64748b",lineHeight:1.7,maxWidth:520,margin:"0 auto 36px" }}>
          Turnos recurrentes, recordatorios push al celular, cancelaciones con un toque. Sin WhatsApp Business. Sin costos mensuales.
        </p>
        <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
          <button onClick={()=>onLogin("professional")} style={{ padding:"14px 28px",background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:12,fontWeight:700,cursor:"pointer",fontSize:15,fontFamily:"inherit",boxShadow:"0 6px 24px rgba(8,145,178,.3)",display:"flex",alignItems:"center",gap:8 }}>
            <Eye size={18}/> Demo profesional
          </button>
          <button onClick={()=>onLogin("admin")} style={{ padding:"14px 28px",background:"rgba(124,58,237,.12)",color:"#a78bfa",border:"1px solid rgba(124,58,237,.3)",borderRadius:12,fontWeight:700,cursor:"pointer",fontSize:15,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8 }}>
            <Shield size={18}/> Super Admin
          </button>
        </div>
      </div>
      <div style={{ maxWidth:900,margin:"0 auto",padding:"20px 24px 60px",display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap" }}>
        {[
          { icon:Bell, t:"Push Gratis",d:"Sin WhatsApp, sin costo" },
          { icon:RefreshCw, t:"Auto-Recurrente",d:"Se genera solo cada mes" },
          { icon:Calendar, t:"PC + Celular",d:"PWA instalable sin tiendas" },
          { icon:DollarSign, t:"Honorarios",d:"Individual por paciente" },
          { icon:Users, t:"Ultra Simple",d:"Paciente solo cancela" },
          { icon:Shield, t:"Seguro",d:"Cada uno ve solo lo suyo" },
        ].map((f,i) => (
          <div key={i} style={{ flex:"1 1 140px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"18px 16px" }}>
            <f.icon size={20} color="#0891b2" style={{ marginBottom:8 }} />
            <div style={{ fontSize:14,fontWeight:800,marginBottom:3 }}>{f.t}</div>
            <div style={{ fontSize:12,color:"#64748b" }}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════
function Login({ role, onSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const isAdmin = role==="admin";
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ width:"100%",maxWidth:400,animation:"fadeUp .4s ease" }}>
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:24,fontFamily:"inherit" }}><ArrowLeft size={16}/> Volver</button>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:52,height:52,background:isAdmin?"linear-gradient(135deg,#7c3aed,#6d28d9)":"linear-gradient(135deg,#0891b2,#0e7490)",borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}>
            {isAdmin ? <Shield size={24} color="#fff"/> : <Calendar size={24} color="#fff"/>}
          </div>
          <h2 style={{ fontSize:22,fontWeight:800 }}>{isAdmin?"Super Admin":"Panel Profesional"}</h2>
          <p style={{ color:"#64748b",fontSize:13,marginTop:4 }}>Demo — ingreso sin registro</p>
        </div>
        <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:18,padding:24 }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5 }}>Email</label>
            <input defaultValue={isAdmin?"admin@turnapp.ar":"dra.garcia@turnapp.ar"} style={{ width:"100%",padding:"11px 14px",background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5 }}>Contraseña</label>
            <input type="password" defaultValue="demo1234" style={{ width:"100%",padding:"11px 14px",background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",boxSizing:"border-box" }} />
          </div>
          <button onClick={()=>{setLoading(true);setTimeout(()=>{setLoading(false);onSuccess();},600);}} disabled={loading} style={{ width:"100%",padding:"12px",background:isAdmin?"linear-gradient(135deg,#7c3aed,#6d28d9)":"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit",opacity:loading?.7:1 }}>
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PROFESSIONAL PANEL
// ═══════════════════════════════════════════════
function Professional({ appts, patients, onLogout, notify, pushNotify, onAddPatient, onEditPatient, onDeletePatient, onGenerateAppointments, loading }) {
  const [tab, setTab] = useState("hoy");
  const [selDay, setSelDay] = useState(new Date());
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [editPat, setEditPat] = useState(null);
  const [newPat, setNewPat] = useState(null);
  const [drilldown, setDrilldown] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [alertas] = useState([
    { id:1, type:"cancel", msg:"Pérez, Carlos canceló turno Mié 12/03 11:00", detail:"Frecuencia: Quincenal · Honorario: $9.000 · Cancelado con +24h de anticipación", time:"hace 2h", read:false },
    { id:2, type:"confirm", msg:"5 pacientes confirmaron turnos de marzo", detail:"García Ana, López María, Martínez Laura, Torres Valentina, Vidal Sofía", time:"hace 4h", read:true },
    { id:3, type:"reminder", msg:"Recordatorio enviado a 8 pacientes", detail:"Entregados: 7 · Pendientes: 1 · Mes: Abril 2026", time:"ayer", read:true },
  ]);
  const [expandedAlert, setExpandedAlert] = useState(null);

  const today = useMemo(() => new Date(), []);
  const todayAppts = useMemo(() => appts.filter(a => a.date.toDateString()===today.toDateString() && a.estado!=="cancelado").sort((a,b) => a.hora.localeCompare(b.hora)), [appts,today]);
  const dayAppts = useMemo(() => appts.filter(a => a.date.toDateString()===selDay.toDateString() && a.estado!=="cancelado").sort((a,b) => a.hora.localeCompare(b.hora)), [appts,selDay]);
  const activeAppts = useMemo(() => appts.filter(a => a.estado!=="cancelado"), [appts]);
  const cancelledAppts = useMemo(() => appts.filter(a => a.estado==="cancelado"), [appts]);
  const activePatients = patients.filter(p => p.active);
  const monthTotal = activeAppts.reduce((s,a) => s+a.fee, 0);

  const filteredPatients = useMemo(() => {
    let list = [...patients];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (freqFilter !== "all") list = list.filter(p => p.freq === freqFilter);
    if (sortBy === "name") list.sort((a,b) => a.name.localeCompare(b.name));
    else if (sortBy === "fee_asc") list.sort((a,b) => a.fee - b.fee);
    else if (sortBy === "fee_desc") list.sort((a,b) => b.fee - a.fee);
    return list;
  }, [patients, search, freqFilter, sortBy]);

  const cancelAppt = (appt) => {
    setAppts(prev => prev.map(a => a.id===appt.id ? {...a, estado:"cancelado"} : a));
    pushNotify("Turno cancelado", `${appt.pname} · ${appt.hora}`);
    notify(`Turno de ${appt.pname} cancelado. Push enviado.`);
    setConfirmCancel(null);
  };

  const blockDay = (date) => {
    const aff = appts.filter(a => a.date.toDateString()===date.toDateString() && a.estado!=="cancelado");
    setAppts(prev => prev.map(a => aff.find(x=>x.id===a.id) ? {...a,estado:"cancelado"} : a));
    pushNotify("Día bloqueado", `${aff.length} pacientes notificados`);
    notify(`${aff.length} turnos cancelados. Push enviado a cada paciente.`, "info");
    setBlockConfirm(null);
  };

  const savePatient = (updated) => {
    setPatients(prev => prev.map(p => p.id===updated.id ? updated : p));
    setEditPat(null);
    notify(`${updated.name} actualizado`);
  };

  const addPatient = (pat) => {
    if (!pat.name || !pat.phone) { notify("Completá al menos apellido/nombre y teléfono", "error"); return; }
    const newId = `p${Date.now()}`;
    const token = `tok-${Math.random().toString(36).slice(2,10)}`;
    const created = { ...pat, id: newId, token, active: true };
    setPatients(prev => [...prev, created]);
    // Regenerate appointments including the new patient
    const now = new Date();
    setAppts(genAppts([...patients, created], now.getFullYear(), now.getMonth()));
    setNewPat(null);
    pushNotify("Paciente agregado", `${pat.name} — ${FREQ_L[pat.freq]} · ${DAYS[pat.day]} ${pat.hour}`);
    notify(`${pat.name} agregado. Turnos generados automáticamente.`);
  };

  const sendReminders = () => {
    pushNotify("Recordatorios enviados", `${activePatients.length} pacientes notificados con fechas + honorarios`);
    notify(`Push mensual enviado a ${activePatients.length} pacientes`);
  };

  const stripDays = useMemo(() => {
    const days = [];
    for (let i=-2; i<=8; i++) { const d=new Date(today); d.setDate(today.getDate()+i); days.push(d); }
    return days;
  }, [today]);

  const ApptRow = ({ appt, showActions=true }) => (
    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,borderLeft:`4px solid ${FREQ_C[appt.freq]}`,animation:"fadeUp .2s ease" }}>
      <div style={{ width:44,height:44,borderRadius:10,background:`${FREQ_C[appt.freq]}10`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <Clock size={18} color={FREQ_C[appt.freq]} />
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#0f172a" }}>{appt.pname}</div>
        <div style={{ display:"flex",gap:6,marginTop:3,alignItems:"center",flexWrap:"wrap" }}>
          <span style={{ fontSize:12,fontWeight:700,color:"#475569" }}>{appt.hora}</span>
          <Badge color={FREQ_C[appt.freq]}>{FREQ_L[appt.freq]}</Badge>
          <span style={{ fontSize:12,fontWeight:700,color:"#059669" }}>${appt.fee.toLocaleString("es-AR")}</span>
        </div>
      </div>
      {showActions && (
        <div style={{ display:"flex",gap:4 }}>
          <button onClick={()=>onPatient(appt.pid)} style={{ padding:8,background:"#ecfeff",border:"none",borderRadius:8,cursor:"pointer" }}><Eye size={16} color="#0891b2"/></button>
          <button onClick={()=>setConfirmCancel(appt)} style={{ padding:8,background:"#fef2f2",border:"none",borderRadius:8,cursor:"pointer" }}><X size={16} color="#dc2626"/></button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"#f8fafc" }}>
      {/* HEADER */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",background:"#fff",borderBottom:"1px solid #e2e8f0",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ width:30,height:30,background:"linear-gradient(135deg,#0891b2,#0e7490)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}><Calendar size={14} color="#fff"/></div>
          <span style={{ fontWeight:800,fontSize:15,color:"#0f172a",letterSpacing:"-.3px" }}>TURNAPP</span>
          <span style={{ fontSize:11,padding:"2px 8px",borderRadius:6,background:"#ecfeff",color:"#0891b2",fontWeight:700 }}>Profesional</span>
        </div>
        <button onClick={onLogout} style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 12px",background:"transparent",border:"1px solid #e2e8f0",borderRadius:8,color:"#64748b",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}><LogOut size={14}/> Salir</button>
      </div>

      {/* TABS */}
      <div style={{ display:"flex",background:"#fff",borderBottom:"1px solid #e2e8f0",position:"sticky",top:54,zIndex:99 }}>
        {[
          { k:"hoy",l:"Hoy",Icon:Home },
          { k:"agenda",l:"Agenda",Icon:Calendar },
          { k:"pacientes",l:"Pacientes",Icon:Users },
          { k:"alertas",l:"Alertas",Icon:Bell,badge:alertas.filter(a=>!a.read).length },
        ].map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} style={{ flex:1,padding:"12px 6px",border:"none",cursor:"pointer",background:"transparent",borderBottom:tab===t.k?"2px solid #0891b2":"2px solid transparent",color:tab===t.k?"#0891b2":"#94a3b8",fontSize:11,fontWeight:700,fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative" }}>
            <t.Icon size={18}/>
            {t.l}
            {t.badge>0 && <span style={{ position:"absolute",top:6,right:"calc(50% - 16px)",background:"#dc2626",color:"#fff",fontSize:9,fontWeight:800,width:16,height:16,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:800,margin:"0 auto",padding:"16px 16px 80px" }}>

        {/* ─── HOY ─── */}
        {tab==="hoy" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10 }}>
              <div>
                <h2 style={{ fontSize:20,fontWeight:800,letterSpacing:"-.5px" }}>Buenos días</h2>
                <p style={{ color:"#64748b",fontSize:13 }}>{DAYS_FULL[today.getDay()]} {today.getDate()} de {MONTHS[today.getMonth()]} · {todayAppts.length} turnos hoy</p>
              </div>
              <Btn onClick={sendReminders} small><Send size={14}/> Recordatorios</Btn>
            </div>

            {/* INTERACTIVE STAT CARDS */}
            <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
              <StatCard icon={Calendar} label="Turnos hoy" value={todayAppts.length} color="#0891b2" onClick={()=>setDrilldown("turnos")} />
              <StatCard icon={Users} label="Pacientes activos" value={activePatients.length} color="#059669" onClick={()=>setDrilldown("pacientes")} />
              <StatCard icon={DollarSign} label="Total del mes" value={`$${monthTotal.toLocaleString("es-AR")}`} color="#d97706" onClick={()=>setDrilldown("facturacion")} />
              <StatCard icon={XCircle} label="Cancelados" value={cancelledAppts.length} color="#dc2626" onClick={()=>setDrilldown("cancelados")} />
            </div>

            {/* TODAY LIST */}
            <h3 style={{ fontSize:13,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:".5px" }}>Turnos de hoy</h3>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {todayAppts.length===0 ? (
                <div style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:32,textAlign:"center" }}>
                  <CheckCircle size={32} color="#059669" style={{ marginBottom:8 }} />
                  <div style={{ fontWeight:700,color:"#475569" }}>No tenés turnos hoy</div>
                </div>
              ) : todayAppts.map(a => <ApptRow key={a.id} appt={a} />)}
            </div>
          </div>
        )}

        {/* ─── AGENDA ─── */}
        {tab==="agenda" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <h2 style={{ fontSize:20,fontWeight:800 }}>Agenda</h2>
              <Btn variant="danger" small onClick={()=>setBlockConfirm(selDay)}>
                <AlertTriangle size={14}/> Bloquear día
              </Btn>
            </div>

            {/* DAY STRIP */}
            <div style={{ display:"flex",gap:5,overflowX:"auto",paddingBottom:8,marginBottom:16 }}>
              {stripDays.map(d => {
                const isSel = d.toDateString()===selDay.toDateString();
                const isToday = d.toDateString()===today.toDateString();
                const cnt = appts.filter(a=>a.date.toDateString()===d.toDateString()&&a.estado!=="cancelado").length;
                return (
                  <button key={d.toISOString()} onClick={()=>setSelDay(new Date(d))} style={{ flexShrink:0,width:50,padding:"10px 4px",background:isSel?"linear-gradient(135deg,#0891b2,#0e7490)":isToday?"#ecfeff":"#fff",border:isSel?"none":`1px solid ${isToday?"#0891b2":"#e2e8f0"}`,borderRadius:10,color:isSel?"#fff":isToday?"#0891b2":"#64748b",cursor:"pointer",textAlign:"center",fontFamily:"inherit" }}>
                    <div style={{ fontSize:10,fontWeight:700,marginBottom:3 }}>{DAYS[d.getDay()]}</div>
                    <div style={{ fontSize:17,fontWeight:800 }}>{d.getDate()}</div>
                    {cnt>0 && <div style={{ width:5,height:5,borderRadius:3,background:isSel?"#fff":"#0891b2",margin:"3px auto 0" }}/>}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize:14,fontWeight:700,color:"#475569",marginBottom:10 }}>
              {DAYS_FULL[selDay.getDay()]} {selDay.getDate()} de {MONTHS[selDay.getMonth()]} — {dayAppts.length} turnos
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {dayAppts.length===0 ? (
                <div style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:32,textAlign:"center",color:"#94a3b8" }}>
                  <Calendar size={32} style={{ marginBottom:8,opacity:.4 }} />
                  <div style={{ fontWeight:600 }}>Sin turnos este día</div>
                </div>
              ) : dayAppts.map(a => <ApptRow key={a.id} appt={a} />)}
            </div>
          </div>
        )}

        {/* ─── PACIENTES ─── */}
        {tab==="pacientes" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <h2 style={{ fontSize:20,fontWeight:800 }}>Pacientes</h2>
              <Btn small onClick={()=>setNewPat({name:"",phone:"",email:"",fee:8500,freq:"semanal",day:1,hour:"10:00",tutor:"",duracion:null,notes:""})}><UserPlus size={14}/> Nuevo</Btn>
            </div>
            {/* SEARCH + FILTERS */}
            <div style={{ display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"0 12px" }}>
                <Search size={16} color="#94a3b8"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por apellido..." style={{ border:"none",padding:"10px 0",fontSize:13,width:"100%",fontFamily:"inherit",background:"transparent" }} />
              </div>
              <select value={freqFilter} onChange={e=>setFreqFilter(e.target.value)} style={{ padding:"10px 12px",borderRadius:10,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",background:"#fff",cursor:"pointer",color:"#475569",fontWeight:600 }}>
                <option value="all">Todas las frecuencias</option>
                <option value="semanal">Semanales</option>
                <option value="quincenal">Quincenales</option>
                <option value="mensual">Mensuales</option>
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"10px 12px",borderRadius:10,border:"1px solid #e2e8f0",fontSize:12,fontFamily:"inherit",background:"#fff",cursor:"pointer",color:"#475569",fontWeight:600 }}>
                <option value="name">Apellido A-Z</option>
                <option value="fee_desc">Mayor honorario</option>
                <option value="fee_asc">Menor honorario</option>
              </select>
            </div>
            <div style={{ fontSize:12,color:"#64748b",marginBottom:10 }}>{filteredPatients.length} pacientes</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {filteredPatients.map(pt => {
                const paCount = activeAppts.filter(a=>a.pid===pt.id).length;
                return (
                  <div key={pt.id} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden" }}>
                    <div style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ width:42,height:42,borderRadius:10,background:`${FREQ_C[pt.freq]}10`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <Users size={18} color={FREQ_C[pt.freq]} />
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:14,color:"#0f172a" }}>{pt.name}</div>
                        <div style={{ fontSize:11,color:"#64748b",marginTop:2,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                          <span>{DAYS[pt.day]} {pt.hour}</span>
                          <Badge color={FREQ_C[pt.freq]}>{FREQ_L[pt.freq]}</Badge>
                          {pt.tutor && <Badge color="#d97706">Tutor</Badge>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        <div style={{ fontSize:15,fontWeight:800,color:"#059669" }}>${pt.fee.toLocaleString("es-AR")}</div>
                        <div style={{ fontSize:10,color:"#94a3b8" }}>{paCount} turnos · {pt.push?"Push ON":"Push OFF"}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex",borderTop:"1px solid #f1f5f9" }}>
                      <button onClick={()=>onPatient(pt.id)} style={{ flex:1,padding:9,background:"transparent",border:"none",borderRight:"1px solid #f1f5f9",cursor:"pointer",fontSize:11,fontWeight:600,color:"#0891b2",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}><Eye size={13}/> Portal</button>
                      <button onClick={()=>setEditPat({...pt})} style={{ flex:1,padding:9,background:"transparent",border:"none",borderRight:"1px solid #f1f5f9",cursor:"pointer",fontSize:11,fontWeight:600,color:"#7c3aed",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}><Edit3 size={13}/> Editar</button>
                      <button onClick={()=>{pushNotify("Push enviado",pt.name);notify(`Push a ${pt.name}`);}} style={{ flex:1,padding:9,background:"transparent",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,color:"#059669",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}><Bell size={13}/> Push</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ALERTAS ─── */}
        {tab==="alertas" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <h2 style={{ fontSize:20,fontWeight:800,marginBottom:4 }}>Notificaciones</h2>
            <p style={{ fontSize:13,color:"#64748b",marginBottom:16 }}>Push gratis e ilimitadas. Toca cada alerta para ver el detalle.</p>
            <div style={{ display:"flex",gap:8,marginBottom:16 }}>
              <Btn onClick={sendReminders} full><Send size={14}/> Enviar recordatorio mensual</Btn>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {alertas.map(a => (
                <button key={a.id} onClick={()=>setExpandedAlert(expandedAlert===a.id?null:a.id)} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",textAlign:"left",cursor:"pointer",fontFamily:"inherit",width:"100%",borderLeft:`4px solid ${a.type==="cancel"?"#dc2626":a.type==="confirm"?"#059669":"#0891b2"}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:a.read?500:700,color:"#0f172a" }}>{a.msg}</div>
                      <div style={{ fontSize:11,color:"#94a3b8",marginTop:3 }}>{a.time}</div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" style={{ transform:expandedAlert===a.id?"rotate(90deg)":"none",transition:"transform .2s" }} />
                  </div>
                  {expandedAlert===a.id && (
                    <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9",fontSize:12,color:"#475569",lineHeight:1.6 }}>
                      {a.detail}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {confirmCancel && (
        <Modal onClose={()=>setConfirmCancel(null)}>
          <div style={{ textAlign:"center",marginBottom:16 }}><AlertTriangle size={40} color="#dc2626"/></div>
          <h3 style={{ fontSize:17,fontWeight:800,textAlign:"center",marginBottom:6 }}>Cancelar turno</h3>
          <p style={{ textAlign:"center",color:"#64748b",fontSize:14,marginBottom:20 }}>¿Cancelar el turno de <strong>{confirmCancel.pname}</strong> a las {confirmCancel.hora}? Se enviará push al paciente.</p>
          <div style={{ display:"flex",gap:8 }}>
            <Btn variant="ghost" full onClick={()=>setConfirmCancel(null)}>No</Btn>
            <Btn variant="danger" full onClick={()=>cancelAppt(confirmCancel)}>Sí, cancelar</Btn>
          </div>
        </Modal>
      )}

      {blockConfirm && (
        <Modal onClose={()=>setBlockConfirm(null)}>
          <div style={{ textAlign:"center",marginBottom:16 }}><AlertTriangle size={40} color="#dc2626"/></div>
          <h3 style={{ fontSize:17,fontWeight:800,textAlign:"center",marginBottom:6 }}>Bloquear día completo</h3>
          <p style={{ textAlign:"center",color:"#64748b",fontSize:14,marginBottom:6 }}>{DAYS_FULL[blockConfirm.getDay()]} {blockConfirm.getDate()}/{blockConfirm.getMonth()+1}</p>
          <p style={{ textAlign:"center",color:"#64748b",fontSize:13,marginBottom:20 }}>Se cancelarán {dayAppts.length} turnos y cada paciente recibirá un push con alternativas.</p>
          <div style={{ display:"flex",gap:8 }}>
            <Btn variant="ghost" full onClick={()=>setBlockConfirm(null)}>No</Btn>
            <Btn variant="danger" full onClick={()=>blockDay(blockConfirm)}>Bloquear</Btn>
          </div>
        </Modal>
      )}

      {editPat && (
        <Modal onClose={()=>setEditPat(null)}>
          <h3 style={{ fontSize:17,fontWeight:800,marginBottom:16,display:"flex",alignItems:"center",gap:8 }}><Edit3 size={20} color="#7c3aed"/> Editar paciente</h3>
          {[
            { label:"Apellido, Nombre",key:"name",type:"text" },
            { label:"Teléfono",key:"phone",type:"tel" },
            { label:"Email",key:"email",type:"email" },
            { label:"Tutor/Responsable",key:"tutor",type:"text" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:10 }}>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>{f.label}</label>
              <input value={editPat[f.key]||""} onChange={e=>setEditPat({...editPat,[f.key]:e.target.value})} type={f.type} style={{ width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
            </div>
          ))}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Frecuencia</label>
              <select value={editPat.freq} onChange={e=>setEditPat({...editPat,freq:e.target.value})} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }}>
                {Object.entries(FREQ_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Honorario ($)</label>
              <input type="number" value={editPat.fee} onChange={e=>setEditPat({...editPat,fee:parseInt(e.target.value)||0})} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Notas internas</label>
            <textarea value={editPat.notes||""} onChange={e=>setEditPat({...editPat,notes:e.target.value})} rows={2} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",resize:"vertical" }} />
          </div>
          <div style={{ display:"flex",gap:8,marginTop:16 }}>
            <Btn variant="ghost" full onClick={()=>setEditPat(null)}>Cancelar</Btn>
            <Btn full onClick={()=>savePatient(editPat)}>Guardar cambios</Btn>
          </div>
        </Modal>
      )}

      {/* NEW PATIENT MODAL */}
      {newPat && (
        <Modal onClose={()=>setNewPat(null)}>
          <h3 style={{ fontSize:17,fontWeight:800,marginBottom:16,display:"flex",alignItems:"center",gap:8 }}><UserPlus size={20} color="#0891b2"/> Nuevo paciente</h3>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Apellido, Nombre *</label>
            <input value={newPat.name} onChange={e=>setNewPat({...newPat,name:e.target.value})} placeholder="García, Ana" style={{ width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Teléfono *</label>
              <input value={newPat.phone} onChange={e=>setNewPat({...newPat,phone:e.target.value})} placeholder="11-1234-5678" style={{ width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Email</label>
              <input value={newPat.email||""} onChange={e=>setNewPat({...newPat,email:e.target.value})} placeholder="email@mail.com" style={{ width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Frecuencia</label>
              <select value={newPat.freq} onChange={e=>setNewPat({...newPat,freq:e.target.value})} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }}>
                {Object.entries(FREQ_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Honorario ($)</label>
              <input type="number" value={newPat.fee} onChange={e=>setNewPat({...newPat,fee:parseInt(e.target.value)||0})} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Día</label>
              <select value={newPat.day} onChange={e=>setNewPat({...newPat,day:parseInt(e.target.value)})} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }}>
                <option value={1}>Lunes</option><option value={2}>Martes</option><option value={3}>Miércoles</option><option value={4}>Jueves</option><option value={5}>Viernes</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Hora</label>
              <select value={newPat.hour} onChange={e=>setNewPat({...newPat,hour:e.target.value})} style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }}>
                {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Tutor / Responsable (opcional)</label>
            <input value={newPat.tutor||""} onChange={e=>setNewPat({...newPat,tutor:e.target.value})} placeholder="Nombre del tutor (para menores)" style={{ width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4 }}>Notas internas</label>
            <textarea value={newPat.notes||""} onChange={e=>setNewPat({...newPat,notes:e.target.value})} rows={2} placeholder="Solo visible para el profesional" style={{ width:"100%",padding:"10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",resize:"vertical" }} />
          </div>
          <div style={{ display:"flex",gap:8,marginTop:16 }}>
            <Btn variant="ghost" full onClick={()=>setNewPat(null)}>Cancelar</Btn>
            <Btn full onClick={()=>addPatient(newPat)}>Agregar paciente</Btn>
          </div>
        </Modal>
      )}

      {drilldown && (
        <Modal onClose={()=>setDrilldown(null)}>
          {drilldown==="turnos" && <>
            <h3 style={{ fontSize:17,fontWeight:800,marginBottom:12,display:"flex",alignItems:"center",gap:8 }}><Calendar size={20} color="#0891b2"/> Turnos de hoy</h3>
            {todayAppts.length===0 ? <p style={{ color:"#64748b" }}>No hay turnos hoy</p> :
            todayAppts.map(a => <div key={a.id} style={{ padding:"10px 0",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between" }}>
              <div><div style={{ fontWeight:700,fontSize:13 }}>{a.pname}</div><div style={{ fontSize:12,color:"#64748b" }}>{a.hora}</div></div>
              <span style={{ fontWeight:700,color:"#059669" }}>${a.fee.toLocaleString("es-AR")}</span>
            </div>)}
          </>}
          {drilldown==="pacientes" && <>
            <h3 style={{ fontSize:17,fontWeight:800,marginBottom:12,display:"flex",alignItems:"center",gap:8 }}><Users size={20} color="#059669"/> Pacientes activos ({activePatients.length})</h3>
            {activePatients.sort((a,b)=>a.name.localeCompare(b.name)).map(p => <div key={p.id} style={{ padding:"8px 0",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between" }}>
              <div><div style={{ fontWeight:600,fontSize:13 }}>{p.name}</div><div style={{ fontSize:11,color:"#64748b" }}>{FREQ_L[p.freq]} · {DAYS[p.day]} {p.hour}</div></div>
              <span style={{ fontWeight:700,color:"#059669",fontSize:13 }}>${p.fee.toLocaleString("es-AR")}</span>
            </div>)}
          </>}
          {drilldown==="facturacion" && <>
            <h3 style={{ fontSize:17,fontWeight:800,marginBottom:12,display:"flex",alignItems:"center",gap:8 }}><DollarSign size={20} color="#d97706"/> Facturación</h3>
            <div style={{ fontSize:28,fontWeight:900,color:"#d97706",marginBottom:16 }}>${monthTotal.toLocaleString("es-AR")}</div>
            <div style={{ fontSize:13,color:"#64748b" }}>{activeAppts.length} sesiones programadas · {MONTHS[today.getMonth()]} {today.getFullYear()}</div>
          </>}
          {drilldown==="cancelados" && <>
            <h3 style={{ fontSize:17,fontWeight:800,marginBottom:12,display:"flex",alignItems:"center",gap:8 }}><XCircle size={20} color="#dc2626"/> Cancelados ({cancelledAppts.length})</h3>
            {cancelledAppts.length===0 ? <p style={{ color:"#64748b" }}>Sin cancelaciones este mes</p> :
            cancelledAppts.slice(0,10).map(a => <div key={a.id} style={{ padding:"8px 0",borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ fontWeight:600,fontSize:13 }}>{a.pname}</div>
              <div style={{ fontSize:11,color:"#94a3b8" }}>{a.date.getDate()}/{a.date.getMonth()+1} · {a.hora}</div>
            </div>)}
          </>}
          <Btn variant="ghost" full onClick={()=>setDrilldown(null)} style={{ marginTop:16 }}>Cerrar</Btn>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PATIENT PORTAL
// ═══════════════════════════════════════════════
function Patient({ pid, patients, setPatients, appts, setAppts, notify, pushNotify, onBack }) {
  const pt = patients.find(p => p.id === pid) || patients[0];
  const [viewMode, setViewMode] = useState("list");
  const [editPhone, setEditPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(pt?.phone || "");
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const today = new Date();
  const myAppts = useMemo(() => appts.filter(a => a.pid===pt?.id && a.estado!=="cancelado").sort((a,b)=>a.date-b.date), [appts,pt]);
  const totalMes = myAppts.reduce((s,a) => s+a.fee, 0);

  const cancelOne = (appt) => {
    const hoursLeft = (appt.date.getTime() - Date.now()) / 3600000;
    if (hoursLeft < 24) { notify("Las cancelaciones deben realizarse con al menos 24 horas de antelación.", "error"); setCancelConfirm(null); return; }
    setAppts(prev => prev.map(a => a.id===appt.id ? {...a,estado:"cancelado"} : a));
    pushNotify("Cancelación", `${pt.name} canceló ${appt.date.getDate()}/${appt.date.getMonth()+1} ${appt.hora}`);
    notify("Turno cancelado. El profesional fue notificado.");
    setCancelConfirm(null);
  };

  const savePhone = () => {
    setPatients(prev => prev.map(p => p.id===pt.id ? {...p, phone:newPhone} : p));
    setEditPhone(false);
    notify("Teléfono actualizado");
  };

  return (
    <div style={{ minHeight:"100vh",background:"#f8fafc" }}>
      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)",padding:"24px 20px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
          <Calendar size={16} color="rgba(255,255,255,.6)"/>
          <span style={{ fontSize:11,color:"rgba(255,255,255,.5)",fontWeight:700 }}>TURNAPP</span>
        </div>
        <div style={{ fontSize:11,color:"rgba(255,255,255,.5)" }}>Consultorio Dra. García</div>
        <div style={{ fontSize:9,color:"rgba(255,255,255,.3)",marginBottom:8 }}>Av. Santa Fe 2145, CABA</div>
        <div style={{ fontSize:22,fontWeight:800,color:"#fff" }}>{pt?.name}</div>
        <div style={{ display:"flex",gap:6,marginTop:4,alignItems:"center" }}>
          <span style={{ fontSize:12,color:"rgba(255,255,255,.6)" }}>{pt?.phone}</span>
          <button onClick={()=>{setEditPhone(true);setNewPhone(pt?.phone||"");}} style={{ background:"rgba(255,255,255,.15)",border:"none",borderRadius:6,padding:"2px 8px",color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3 }}><Edit3 size={10}/> Editar</button>
        </div>
        <div style={{ display:"flex",gap:8,marginTop:14 }}>
          {[{v:myAppts.length,l:"Turnos"},{v:`$${pt?.fee.toLocaleString("es-AR")}`,l:"Sesión"},{v:`$${totalMes.toLocaleString("es-AR")}`,l:"Total mes"}].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 10px",flex:1,textAlign:"center" }}>
              <div style={{ color:"#fff",fontSize:16,fontWeight:800 }}>{s.v}</div>
              <div style={{ color:"rgba(255,255,255,.45)",fontSize:9 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:440,margin:"0 auto",padding:"16px 16px 24px" }}>
        {/* VIEW MODE TOGGLE */}
        <div style={{ display:"flex",gap:4,marginBottom:14,background:"#f1f5f9",borderRadius:10,padding:3 }}>
          {[{k:"list",l:"Lista",I:LayoutList},{k:"cal",l:"Calendario",I:CalendarDays}].map(m=>(
            <button key={m.k} onClick={()=>setViewMode(m.k)} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",background:viewMode===m.k?"#fff":"transparent",color:viewMode===m.k?"#0891b2":"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4,boxShadow:viewMode===m.k?"0 1px 3px rgba(0,0,0,.08)":"none" }}>
              <m.I size={14}/>{m.l}
            </button>
          ))}
        </div>

        <div style={{ fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:12 }}>{MONTHS[today.getMonth()]} {today.getFullYear()}</div>

        {/* LIST VIEW */}
        {viewMode==="list" && myAppts.map((a,i) => {
          const dn = DAYS_FULL[a.date.getDay()];
          const hoursLeft = (a.date.getTime()-Date.now())/3600000;
          const canCancel = hoursLeft >= 24;
          return (
            <div key={a.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,marginBottom:6,animation:`fadeUp .2s ease ${i*.03}s both` }}>
              <div style={{ width:48,height:48,borderRadius:12,background:"#ecfeff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <div style={{ fontSize:18,fontWeight:800,color:"#0891b2",lineHeight:1 }}>{a.date.getDate()}</div>
                <div style={{ fontSize:8,fontWeight:700,color:"#0e7490",textTransform:"uppercase" }}>{dn.slice(0,3)}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14 }}>{dn}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>{a.hora} hs · ${a.fee.toLocaleString("es-AR")}</div>
              </div>
              <button onClick={()=>canCancel?setCancelConfirm(a):notify("Cancelaciones con al menos 24h de antelación","error")} style={{ padding:"8px 12px",background:canCancel?"#fef2f2":"#f8fafc",color:canCancel?"#dc2626":"#cbd5e1",border:`1px solid ${canCancel?"#fecaca":"#e2e8f0"}`,borderRadius:8,fontSize:11,fontWeight:700,cursor:canCancel?"pointer":"not-allowed",fontFamily:"inherit" }}>
                Cancelar
              </button>
            </div>
          );
        })}

        {/* CALENDAR VIEW */}
        {viewMode==="cal" && (()=>{
          const yr=today.getFullYear(), mn=today.getMonth();
          const dim=new Date(yr,mn+1,0).getDate();
          const firstDow=new Date(yr,mn,1).getDay();
          const cells=[];
          for(let i=0;i<firstDow;i++) cells.push(null);
          for(let d=1;d<=dim;d++) cells.push(d);
          const apptDays = new Set(myAppts.map(a=>a.date.getDate()));
          return (
            <div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4 }}>
                {["D","L","M","X","J","V","S"].map(d=><div key={d} style={{ textAlign:"center",fontSize:10,fontWeight:700,color:"#94a3b8",padding:"6px 0" }}>{d}</div>)}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2 }}>
                {cells.map((d,i)=>{
                  if(!d) return <div key={i}/>;
                  const has=apptDays.has(d);
                  const isToday=d===today.getDate();
                  return <div key={i} style={{ textAlign:"center",padding:"10px 0",borderRadius:8,background:has?"#ecfeff":isToday?"#f1f5f9":"transparent",border:has?`2px solid #0891b2`:isToday?"2px solid #e2e8f0":"2px solid transparent",fontWeight:has?800:500,fontSize:14,color:has?"#0891b2":"#475569" }}>{d}</div>;
                })}
              </div>
            </div>
          );
        })()}

        <div style={{ fontSize:10,color:"#94a3b8",textAlign:"center",margin:"14px 0",fontStyle:"italic" }}>
          Tus turnos están confirmados automáticamente. Solo cancelá si no podés asistir (mínimo 24h antes).
        </div>
        <button onClick={onBack} style={{ width:"100%",padding:11,background:"transparent",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}>
          <ArrowLeft size={14}/> Volver al panel
        </button>
      </div>

      {/* CANCEL CONFIRM */}
      {cancelConfirm && (
        <Modal onClose={()=>setCancelConfirm(null)}>
          <div style={{ textAlign:"center",marginBottom:12 }}><AlertTriangle size={36} color="#dc2626"/></div>
          <h3 style={{ textAlign:"center",fontSize:16,fontWeight:800,marginBottom:8 }}>Cancelar turno</h3>
          <p style={{ textAlign:"center",color:"#64748b",fontSize:14,marginBottom:20 }}>
            ¿Cancelar el {DAYS_FULL[cancelConfirm.date.getDay()]} {cancelConfirm.date.getDate()}/{cancelConfirm.date.getMonth()+1} a las {cancelConfirm.hora}?
          </p>
          <div style={{ display:"flex",gap:8 }}>
            <Btn variant="ghost" full onClick={()=>setCancelConfirm(null)}>No</Btn>
            <Btn variant="danger" full onClick={()=>cancelOne(cancelConfirm)}>Sí, cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* EDIT PHONE */}
      {editPhone && (
        <Modal onClose={()=>setEditPhone(false)}>
          <h3 style={{ fontSize:16,fontWeight:800,marginBottom:12,display:"flex",alignItems:"center",gap:8 }}><Phone size={18}/> Editar teléfono</h3>
          <input value={newPhone} onChange={e=>setNewPhone(e.target.value)} style={{ width:"100%",padding:"12px",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",marginBottom:12 }} />
          <p style={{ fontSize:12,color:"#64748b",marginBottom:16 }}>Las notificaciones se enviarán al nuevo número.</p>
          <div style={{ display:"flex",gap:8 }}>
            <Btn variant="ghost" full onClick={()=>setEditPhone(false)}>Cancelar</Btn>
            <Btn full onClick={savePhone}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════
function Admin({ onLogout, notify }) {
  const [tab, setTab] = useState("dashboard");
  const [profs] = useState([
    { id:1,name:"Dra. Ana García",spec:"Psicología",patients:23,plan:"Profesional",status:"activo",since:"Ene 2025",code:"TURNAPP-GARCIA" },
    { id:2,name:"Dr. Luis Martínez",spec:"Psicología",patients:8,plan:"Starter",status:"activo",since:"Feb 2025",code:"TURNAPP-MARTINEZ" },
    { id:3,name:"Lic. Paula Rodríguez",spec:"Psiquiatría",patients:45,plan:"Consultorio",status:"activo",since:"Dic 2024",code:"TURNAPP-RODRIGUEZ" },
    { id:4,name:"Dr. Marcos Pérez",spec:"Psicología",patients:3,plan:"Starter",status:"pendiente",since:"Mar 2025",code:null },
  ]);
  const totalPat = profs.reduce((s,p)=>s+p.patients,0);

  return (
    <div style={{ minHeight:"100vh",background:"#0d0820",color:"#f1f5f9" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",background:"#150b2e",borderBottom:"1px solid #2d1b69" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <Shield size={20} color="#a78bfa"/>
          <span style={{ fontWeight:800,fontSize:15 }}>TURNAPP</span>
          <span style={{ fontSize:11,padding:"2px 8px",borderRadius:6,background:"rgba(139,92,246,.15)",color:"#a78bfa",fontWeight:700 }}>Super Admin</span>
        </div>
        <button onClick={onLogout} style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 12px",background:"transparent",border:"1px solid #4c1d95",color:"#a78bfa",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}><LogOut size={14}/> Salir</button>
      </div>

      <div style={{ display:"flex",borderBottom:"1px solid #2d1b69",background:"#150b2e" }}>
        {[{k:"dashboard",l:"Dashboard",I:Home},{k:"profs",l:"Profesionales",I:Users},{k:"platform",l:"Plataforma",I:Settings}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{ flex:1,padding:"12px",border:"none",background:"transparent",borderBottom:tab===t.k?"2px solid #8b5cf6":"2px solid transparent",color:tab===t.k?"#a78bfa":"#4c1d95",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            <t.I size={16}/>{t.l}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:860,margin:"0 auto",padding:"20px 16px" }}>
        {tab==="dashboard" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <h2 style={{ fontSize:20,fontWeight:800,marginBottom:16 }}>Resumen</h2>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:20 }}>
              {[
                { label:"Profesionales",val:profs.length,Icon:Users,color:"#a78bfa" },
                { label:"Pacientes",val:totalPat,Icon:Users,color:"#06b6d4" },
                { label:"Costo infra",val:"$0",Icon:TrendingUp,color:"#10b981" },
              ].map(s=>(
                <div key={s.label} style={{ flex:"1 1 140px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"16px 18px" }}>
                  <s.Icon size={20} color={s.color} style={{ marginBottom:8 }}/>
                  <div style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:12,color:"#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:14,padding:"16px 20px" }}>
              <div style={{ fontWeight:700,color:"#a78bfa",marginBottom:6,display:"flex",alignItems:"center",gap:6 }}><Shield size={16}/> Modelo A — Control Total</div>
              <div style={{ fontSize:13,color:"#94a3b8",lineHeight:1.7 }}>
                Martín crea manualmente todas las cuentas. No existe auto-registro. Jerarquía: Super Admin → Profesional → Paciente.
              </div>
            </div>
          </div>
        )}

        {tab==="profs" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <h2 style={{ fontSize:20,fontWeight:800 }}>Profesionales</h2>
              <button onClick={()=>notify("Cuenta creada (demo)")} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}><UserPlus size={16}/> Crear cuenta</button>
            </div>
            {profs.map(p => (
              <div key={p.id} style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
                <div>
                  <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:4 }}>
                    <span style={{ fontWeight:700 }}>{p.name}</span>
                    <Badge color={p.plan==="Consultorio"?"#a78bfa":p.plan==="Profesional"?"#06b6d4":"#64748b"}>{p.plan}</Badge>
                    <Badge color={p.status==="activo"?"#10b981":"#f59e0b"}>{p.status}</Badge>
                  </div>
                  <div style={{ fontSize:12,color:"#64748b" }}>{p.spec} · {p.patients} pac. · desde {p.since}</div>
                  {p.code && <div style={{ fontSize:11,color:"#a78bfa",marginTop:3 }}>Código referido: {p.code}</div>}
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  <button onClick={()=>notify(`Panel de ${p.name} (demo)`)} style={{ padding:"6px 12px",background:"rgba(139,92,246,.1)",color:"#a78bfa",border:"1px solid rgba(139,92,246,.25)",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Ver panel</button>
                  <button onClick={()=>notify("Plan actualizado (demo)")} style={{ padding:"6px 12px",background:"rgba(255,255,255,.05)",color:"#94a3b8",border:"1px solid #334155",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Editar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="platform" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <h2 style={{ fontSize:20,fontWeight:800,marginBottom:16 }}>Plataforma</h2>
            {[
              { label:"Supabase",desc:"Base de datos · RLS activado",status:"Conectado",Icon:CheckCircle,color:"#10b981" },
              { label:"Vercel",desc:"Hosting PWA · Auto-deploy",status:"Activo",Icon:CheckCircle,color:"#10b981" },
              { label:"Web Push",desc:"Notificaciones nativas · $0",status:"Configurado",Icon:Bell,color:"#10b981" },
              { label:"MercadoPago",desc:"Cobro de suscripciones",status:"Pendiente",Icon:AlertTriangle,color:"#f59e0b" },
              { label:"Códigos referido",desc:"Descuentos por invitación",status:"Activo",Icon:Star,color:"#10b981" },
            ].map(s=>(
              <div key={s.label} style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <s.Icon size={18} color={s.color}/>
                  <div><div style={{ fontWeight:700,marginBottom:2 }}>{s.label}</div><div style={{ fontSize:12,color:"#64748b" }}>{s.desc}</div></div>
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:s.color }}>{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
