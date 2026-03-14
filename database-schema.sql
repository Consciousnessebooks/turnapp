-- ============================================================
-- TURNAPP v1.1 — Schema con mejoras de auditoría Sesión 1
-- ============================================================
-- MEJORAS APLICADAS:
-- [Arquitectura] Tabla configuracion_push para VAPID keys
-- [Arquitectura] Tabla configuracion_consultorio separada
-- [Modelo A] Campo motivo_activacion en profesionales
-- [Modelo A] Log de acciones del super admin
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SUPER ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS super_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PROFESIONALES (Modelo A: SOLO el Super Admin los crea)
-- ============================================================
CREATE TABLE IF NOT EXISTS profesionales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  especialidad TEXT DEFAULT 'Psicología',
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  matricula TEXT,
  
  -- Consultorio (visible en portal del paciente — fix auditoría)
  nombre_consultorio TEXT, -- ej: "Consultorio Lic. Vidal"
  direccion TEXT,
  
  -- Configuración de agenda
  dias_laborales INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  horario_inicio TIME DEFAULT '08:00',
  horario_fin TIME DEFAULT '18:00',
  duracion_sesion INTEGER DEFAULT 50,
  honorario_base NUMERIC(12,2) DEFAULT 15000.00,
  
  -- Plan
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','clinica')),
  max_pacientes INTEGER DEFAULT 15,
  plan_inicio DATE DEFAULT CURRENT_DATE,
  plan_vencimiento DATE,
  
  -- Modelo A: control total del Super Admin
  activo BOOLEAN DEFAULT FALSE,
  habilitado_por UUID REFERENCES super_admin(id),
  fecha_habilitacion TIMESTAMPTZ,
  motivo_activacion TEXT, -- fix auditoría: registrar por qué se activó
  motivo_suspension TEXT,
  
  onboarding_completado BOOLEAN DEFAULT FALSE,
  zona_horaria TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prof_user ON profesionales(user_id);
CREATE INDEX idx_prof_activo ON profesionales(activo);

-- ============================================================
-- 3. PACIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  
  numero SERIAL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  token_acceso TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  frecuencia TEXT NOT NULL CHECK (frecuencia IN ('semanal','quincenal','mensual')),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 5),
  hora_turno TIME NOT NULL,
  semana_paridad TEXT CHECK (semana_paridad IN ('par','impar')),
  honorario NUMERIC(12,2) NOT NULL DEFAULT 15000.00,
  
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
CREATE INDEX idx_pac_activo ON pacientes(profesional_id, activo);

-- ============================================================
-- 4. TURNOS
-- ============================================================
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
  push_recordatorio_enviado BOOLEAN DEFAULT FALSE,
  push_confirmacion_enviada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turno_prof_fecha ON turnos(profesional_id, fecha);
CREATE INDEX idx_turno_pac ON turnos(paciente_id);
CREATE UNIQUE INDEX idx_turno_slot_unico ON turnos(profesional_id, fecha, hora_inicio)
  WHERE estado NOT IN ('cancelado_paciente','cancelado_profesional');

-- ============================================================
-- 5. BLOQUEOS
-- ============================================================
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

-- ============================================================
-- 6. PUSH LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS push_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID REFERENCES profesionales(id),
  paciente_id UUID REFERENCES pacientes(id),
  turno_id UUID REFERENCES turnos(id),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'recordatorio_mensual','recordatorio_sesion','cancelacion_paciente',
    'cancelacion_profesional','cambio_horario','bienvenida','custom'
  )),
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  estado TEXT DEFAULT 'enviado' CHECK (estado IN ('enviado','entregado','fallido','click')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. CONFIGURACIÓN PUSH (VAPID keys) — FIX AUDITORÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_push (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vapid_public_key TEXT NOT NULL,
  vapid_private_key TEXT NOT NULL, -- encriptado en producción
  vapid_subject TEXT DEFAULT 'mailto:admin@turnapp.com',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. PAGOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesional_id UUID NOT NULL REFERENCES profesionales(id),
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'ARS',
  concepto TEXT,
  metodo TEXT CHECK (metodo IN ('mercadopago','transferencia','efectivo')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','vencido','reembolsado')),
  periodo_inicio DATE,
  periodo_fin DATE,
  referencia_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. LOG DE ACCIONES DEL SUPER ADMIN — FIX AUDITORÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES super_admin(id),
  accion TEXT NOT NULL, -- 'crear_profesional','activar','suspender','cambiar_plan','eliminar'
  entidad TEXT NOT NULL, -- 'profesional','plan','sistema'
  entidad_id UUID,
  detalle JSONB, -- datos adicionales de la acción
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_log_fecha ON admin_log(created_at);

-- ============================================================
-- 10. TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prof_ts BEFORE UPDATE ON profesionales FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER tr_pac_ts BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER tr_turno_ts BEFORE UPDATE ON turnos FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
-- 11. FUNCIONES
-- ============================================================

-- Generar turnos para un paciente
CREATE OR REPLACE FUNCTION generar_turnos_paciente(
  p_paciente_id UUID, p_mes INTEGER, p_anio INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_pac RECORD; v_prof RECORD; v_fecha DATE; v_fin DATE;
  v_wn INTEGER; v_ok BOOLEAN; v_count INTEGER := 0; v_hfin TIME;
BEGIN
  SELECT * INTO v_pac FROM pacientes WHERE id = p_paciente_id AND activo = TRUE;
  IF NOT FOUND THEN RETURN 0; END IF;
  SELECT * INTO v_prof FROM profesionales WHERE id = v_pac.profesional_id;
  v_hfin := v_pac.hora_turno + (v_prof.duracion_sesion || ' min')::INTERVAL;
  v_fecha := make_date(p_anio, p_mes, 1);
  v_fin := (v_fecha + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  WHILE v_fecha <= v_fin LOOP
    IF EXTRACT(ISODOW FROM v_fecha) = v_pac.dia_semana THEN
      v_wn := CEIL(EXTRACT(DAY FROM v_fecha)/7.0)::INTEGER;
      v_ok := TRUE;
      IF v_pac.frecuencia='quincenal' THEN v_ok:=CASE WHEN v_pac.semana_paridad='par' THEN v_wn%2=0 ELSE v_wn%2=1 END;
      ELSIF v_pac.frecuencia='mensual' THEN v_ok:=(v_wn=1); END IF;
      IF v_ok
        AND NOT EXISTS (SELECT 1 FROM bloqueos b WHERE b.profesional_id=v_pac.profesional_id AND b.fecha=v_fecha AND (b.hora_inicio IS NULL OR (b.hora_inicio<=v_pac.hora_turno AND b.hora_fin>v_pac.hora_turno)))
        AND NOT EXISTS (SELECT 1 FROM turnos t WHERE t.paciente_id=p_paciente_id AND t.fecha=v_fecha AND t.hora_inicio=v_pac.hora_turno)
      THEN
        INSERT INTO turnos(profesional_id,paciente_id,fecha,hora_inicio,hora_fin,estado,honorario)
        VALUES(v_pac.profesional_id,p_paciente_id,v_fecha,v_pac.hora_turno,v_hfin,'confirmado',v_pac.honorario);
        v_count:=v_count+1;
      END IF;
    END IF;
    v_fecha:=v_fecha+INTERVAL '1 day';
  END LOOP;
  RETURN v_count;
END; $$ LANGUAGE plpgsql;

-- Generar turnos para todos los pacientes de un profesional
CREATE OR REPLACE FUNCTION generar_turnos_profesional(p_prof_id UUID, p_mes INTEGER, p_anio INTEGER)
RETURNS TABLE(paciente_nombre TEXT, turnos_creados INTEGER) AS $$
DECLARE v_p RECORD; v_c INTEGER;
BEGIN
  FOR v_p IN SELECT id,nombre,apellido FROM pacientes WHERE profesional_id=p_prof_id AND activo=TRUE LOOP
    v_c:=generar_turnos_paciente(v_p.id,p_mes,p_anio);
    IF v_c>0 THEN paciente_nombre:=v_p.nombre||' '||v_p.apellido; turnos_creados:=v_c; RETURN NEXT; END IF;
  END LOOP;
END; $$ LANGUAGE plpgsql;

-- Cancelar turno validado por token
CREATE OR REPLACE FUNCTION cancelar_turno_paciente(p_turno_id UUID, p_token TEXT, p_motivo TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE v RECORD;
BEGIN
  SELECT t.*,p.nombre||' '||p.apellido AS pn,p.token_acceso INTO v
  FROM turnos t JOIN pacientes p ON p.id=t.paciente_id WHERE t.id=p_turno_id AND p.token_acceso=p_token;
  IF NOT FOUND THEN RETURN '{"ok":false,"error":"Acceso denegado"}'::jsonb; END IF;
  IF v.estado LIKE 'cancelado%' THEN RETURN '{"ok":false,"error":"Ya cancelado"}'::jsonb; END IF;
  UPDATE turnos SET estado='cancelado_paciente',motivo_cancelacion=COALESCE(p_motivo,'Cancelado por paciente') WHERE id=p_turno_id;
  RETURN jsonb_build_object('ok',true,'paciente',v.pn,'fecha',v.fecha,'hora',v.hora_inicio);
END; $$ LANGUAGE plpgsql;

-- Resumen mensual para push
CREATE OR REPLACE FUNCTION resumen_mensual(p_pac_id UUID, p_mes INTEGER, p_anio INTEGER)
RETURNS JSONB AS $$
DECLARE v_pac RECORD; v_t JSONB; v_tot NUMERIC; v_cnt INTEGER;
BEGIN
  SELECT * INTO v_pac FROM pacientes WHERE id=p_pac_id;
  SELECT jsonb_agg(jsonb_build_object('fecha',t.fecha,'hora',t.hora_inicio,'dia',TO_CHAR(t.fecha,'TMDay')) ORDER BY t.fecha),
    COALESCE(SUM(t.honorario),0),COUNT(*)
  INTO v_t,v_tot,v_cnt FROM turnos t
  WHERE t.paciente_id=p_pac_id AND EXTRACT(MONTH FROM t.fecha)=p_mes AND EXTRACT(YEAR FROM t.fecha)=p_anio AND t.estado NOT LIKE 'cancelado%';
  RETURN jsonb_build_object('paciente',v_pac.nombre||' '||v_pac.apellido,'honorario_sesion',v_pac.honorario,'total_mes',v_tot,'cantidad',v_cnt,'turnos',COALESCE(v_t,'[]'::jsonb));
END; $$ LANGUAGE plpgsql;

-- ============================================================
-- 12. VISTAS
-- ============================================================
CREATE OR REPLACE VIEW v_admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM profesionales WHERE activo=TRUE) AS prof_activos,
  (SELECT COUNT(*) FROM profesionales) AS prof_total,
  (SELECT COUNT(*) FROM pacientes WHERE activo=TRUE) AS pac_total,
  (SELECT COUNT(*) FROM turnos WHERE fecha>=date_trunc('month',CURRENT_DATE) AND estado NOT LIKE 'cancelado%') AS turnos_mes,
  (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE estado='pagado' AND periodo_inicio>=date_trunc('month',CURRENT_DATE)) AS ingreso_mes;

CREATE OR REPLACE VIEW v_turnos_hoy AS
SELECT t.id,t.fecha,t.hora_inicio,t.hora_fin,t.estado,t.honorario,
  p.id AS paciente_id,p.nombre||' '||p.apellido AS paciente_nombre,
  p.frecuencia,p.telefono,t.profesional_id
FROM turnos t JOIN pacientes p ON p.id=t.paciente_id
WHERE t.fecha=CURRENT_DATE ORDER BY t.hora_inicio;

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_push ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof_own" ON profesionales FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "prof_update" ON profesionales FOR UPDATE USING (user_id=auth.uid());
CREATE POLICY "pac_prof" ON pacientes FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "turno_prof" ON turnos FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "bloq_prof" ON bloqueos FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "push_prof" ON push_log FOR ALL USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));
CREATE POLICY "pago_prof" ON pagos FOR SELECT USING (profesional_id IN (SELECT id FROM profesionales WHERE user_id=auth.uid()));

-- Super Admin usa service_role key → bypasea RLS automáticamente

-- ============================================================
-- FIN — TURNAPP Schema v1.1
-- ============================================================
