-- ============================================================
-- TURNAPP Schema v2.0 — Todas las mejoras de Hoja de Ruta v2
-- ============================================================
-- NUEVAS FEATURES:
-- + Notas por sesión (privadas del profesional)
-- + Códigos de referido
-- + Tasa de asistencia tracking
-- + Campo tutor/responsable en paciente
-- + Duración sesión por paciente
-- + Link videollamada en config profesional
-- + Pre-sesión configurable (15/30/60 min)
-- + Regla 24h cancelación
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SUPER ADMIN
CREATE TABLE IF NOT EXISTS super_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFESIONALES
CREATE TABLE IF NOT EXISTS profesionales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  especialidad TEXT DEFAULT 'Psicología',
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  matricula TEXT,
  nombre_consultorio TEXT,
  direccion TEXT,
  -- v2: Link videollamada para profesionales online
  link_videollamada TEXT,
  dias_laborales INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  horario_inicio TIME DEFAULT '08:00',
  horario_fin TIME DEFAULT '18:00',
  duracion_sesion_default INTEGER DEFAULT 50,
  honorario_base NUMERIC(12,2) DEFAULT 15000.00,
  -- v2: Pre-sesión configurable
  minutos_pre_sesion INTEGER DEFAULT 30, -- 15, 30, o 60
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','profesional','consultorio','clinica')),
  max_pacientes INTEGER DEFAULT 15,
  plan_inicio DATE DEFAULT CURRENT_DATE,
  plan_vencimiento DATE,
  -- v2: Código de referido
  codigo_referido TEXT UNIQUE,
  referido_por UUID REFERENCES profesionales(id),
  activo BOOLEAN DEFAULT FALSE,
  habilitado_por UUID REFERENCES super_admin(id),
  fecha_habilitacion TIMESTAMPTZ,
  motivo_activacion TEXT,
  motivo_suspension TEXT,
  onboarding_completado BOOLEAN DEFAULT FALSE,
  zona_horaria TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prof_user ON profesionales(user_id);
CREATE INDEX idx_prof_referido ON profesionales(codigo_referido);

-- 3. PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  numero SERIAL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  -- v2: Campo tutor/responsable (psicología infantil)
  nombre_tutor TEXT,
  telefono_tutor TEXT,
  token_acceso TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  frecuencia TEXT NOT NULL CHECK (frecuencia IN ('semanal','quincenal','mensual','bimestral','trimestral')),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 5),
  hora_turno TIME NOT NULL,
  semana_paridad TEXT CHECK (semana_paridad IN ('par','impar')),
  honorario NUMERIC(12,2) NOT NULL DEFAULT 15000.00,
  -- v2: Duración por paciente (override del default del profesional)
  duracion_sesion INTEGER, -- NULL = usa el default del profesional
  push_subscription JSONB,
  push_enabled BOOLEAN DEFAULT FALSE,
  notas_internas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_alta DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pac_prof ON pacientes(profesional_id);
CREATE INDEX idx_pac_token ON pacientes(token_acceso);
CREATE INDEX idx_pac_apellido ON pacientes(profesional_id, apellido, nombre);

-- 4. TURNOS
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado TEXT DEFAULT 'confirmado' CHECK (estado IN (
    'confirmado','cancelado_paciente','cancelado_profesional','realizado','ausente'
  )),
  honorario NUMERIC(12,2) NOT NULL,
  motivo_cancelacion TEXT,
  -- v2: Tracking de asistencia
  asistio BOOLEAN, -- NULL=pendiente, TRUE=presente, FALSE=ausente
  -- v2: Nota de sesión (privada del profesional)
  nota_sesion TEXT,
  push_recordatorio_enviado BOOLEAN DEFAULT FALSE,
  push_pre_sesion_enviado BOOLEAN DEFAULT FALSE,
  -- v2: Registrar si canceló dentro de las 24h
  cancelacion_tardia BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turno_prof_fecha ON turnos(profesional_id, fecha);
CREATE INDEX idx_turno_pac ON turnos(paciente_id);
CREATE UNIQUE INDEX idx_turno_slot ON turnos(profesional_id, fecha, hora_inicio)
  WHERE estado NOT IN ('cancelado_paciente','cancelado_profesional');

-- 5. BLOQUEOS
CREATE TABLE IF NOT EXISTS bloqueos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  motivo TEXT,
  pacientes_notificados BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PUSH LOG
CREATE TABLE IF NOT EXISTS push_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID REFERENCES profesionales(id),
  paciente_id UUID REFERENCES pacientes(id),
  turno_id UUID REFERENCES turnos(id),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'recordatorio_mensual','recordatorio_sesion','pre_sesion',
    'cancelacion_paciente','cancelacion_profesional',
    'cambio_horario','bienvenida','custom'
  )),
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  estado TEXT DEFAULT 'enviado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONFIG PUSH (VAPID)
CREATE TABLE IF NOT EXISTS configuracion_push (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vapid_public_key TEXT NOT NULL,
  vapid_private_key TEXT NOT NULL,
  vapid_subject TEXT DEFAULT 'mailto:admin@turnapp.com',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAGOS
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id),
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'ARS',
  concepto TEXT,
  metodo TEXT CHECK (metodo IN ('mercadopago','transferencia','efectivo')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','vencido','reembolsado')),
  -- v2: Descuento por referido
  descuento_referido NUMERIC(5,2) DEFAULT 0,
  periodo_inicio DATE,
  periodo_fin DATE,
  referencia_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ADMIN LOG
CREATE TABLE IF NOT EXISTS admin_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES super_admin(id),
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id UUID,
  detalle JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. v2: CÓDIGOS DE REFERIDO
CREATE TABLE IF NOT EXISTS codigos_referido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  profesional_id UUID NOT NULL REFERENCES profesionales(id),
  descuento_porcentaje NUMERIC(5,2) DEFAULT 75.00,
  usos INTEGER DEFAULT 0,
  usos_maximo INTEGER DEFAULT 10,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. v2: LISTA DE ESPERA
CREATE TABLE IF NOT EXISTS lista_espera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id),
  nombre TEXT NOT NULL,
  telefono TEXT,
  dia_preferido INTEGER,
  hora_preferida TIME,
  notas TEXT,
  atendido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGERS
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prof_ts BEFORE UPDATE ON profesionales FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER tr_pac_ts BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER tr_turno_ts BEFORE UPDATE ON turnos FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- FUNCIONES (mismas que v1.1 — ya las tenés ejecutadas)
-- generar_turnos_paciente, generar_turnos_profesional, cancelar_turno_paciente, resumen_mensual
-- Si ya ejecutaste el schema v1.1, solo ejecutá las líneas nuevas de v2

-- RLS
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_referido ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof_own" ON profesionales FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "prof_update" ON profesionales FOR UPDATE USING (user_id=auth.uid());
CREATE POLICY "pac_prof" ON pacientes FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "turno_prof" ON turnos FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "bloq_prof" ON bloqueos FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "push_prof" ON push_log FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "pago_prof" ON pagos FOR SELECT USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "ref_prof" ON codigos_referido FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "espera_prof" ON lista_espera FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));

-- ============================================================
-- FIN — TURNAPP Schema v2.0
-- ============================================================
