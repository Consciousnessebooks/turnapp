-- Estructura de producción (proyecto hszobstcatbyzijbdnpv), solo estructura, sin datos.
-- Generado el 2026-11-16 desde la introspección de solo lectura (ESPECIFICACION §13.1). PostgreSQL 17.6.
-- No editar a mano: se regenera desde .verificacion/diagnostico/esquema-AAAA-MM-DD.json.
-- Las tablas no tienen grants para anon/authenticated/service_role (relacl nulo al 2026-11-16).

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

create sequence if not exists public.pacientes_numero_seq;

create table public.admin_log (
  id uuid default extensions.uuid_generate_v4() not null,
  admin_id uuid,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalle jsonb,
  created_at timestamp with time zone default now(),
  constraint admin_log_pkey PRIMARY KEY (id)
);

create table public.bloqueos (
  id uuid default extensions.uuid_generate_v4() not null,
  profesional_id uuid not null,
  fecha date not null,
  hora_inicio time without time zone,
  hora_fin time without time zone,
  motivo text,
  pacientes_notificados boolean default false,
  created_at timestamp with time zone default now(),
  constraint bloqueos_pkey PRIMARY KEY (id)
);

create table public.codigos_referido (
  id uuid default extensions.uuid_generate_v4() not null,
  codigo text not null,
  profesional_id uuid not null,
  descuento_porcentaje numeric default 75.00,
  usos integer default 0,
  usos_maximo integer default 10,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  constraint codigos_referido_pkey PRIMARY KEY (id),
  constraint codigos_referido_codigo_key UNIQUE (codigo)
);

create table public.configuracion_push (
  id uuid default extensions.uuid_generate_v4() not null,
  vapid_public_key text not null,
  vapid_private_key text not null,
  vapid_subject text default 'mailto:admin@turnapp.com'::text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  constraint configuracion_push_pkey PRIMARY KEY (id)
);

create table public.lista_espera (
  id uuid default extensions.uuid_generate_v4() not null,
  profesional_id uuid not null,
  nombre text not null,
  telefono text,
  dia_preferido integer,
  hora_preferida time without time zone,
  notas text,
  atendido boolean default false,
  created_at timestamp with time zone default now(),
  constraint lista_espera_pkey PRIMARY KEY (id)
);

create table public.pacientes (
  id uuid default extensions.uuid_generate_v4() not null,
  profesional_id uuid not null,
  numero integer default nextval('pacientes_numero_seq'::regclass) not null,
  nombre text not null,
  apellido text not null,
  telefono text,
  email text,
  nombre_tutor text,
  telefono_tutor text,
  token_acceso text default encode(extensions.gen_random_bytes(16), 'hex'::text),
  frecuencia text not null,
  dia_semana integer not null,
  hora_turno time without time zone not null,
  semana_paridad text,
  honorario numeric default 15000.00 not null,
  duracion_sesion integer,
  push_subscription jsonb,
  push_enabled boolean default false,
  notas_internas text,
  activo boolean default true,
  fecha_alta date default CURRENT_DATE,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint pacientes_pkey PRIMARY KEY (id),
  constraint pacientes_dia_semana_check CHECK (((dia_semana >= 1) AND (dia_semana <= 5))),
  constraint pacientes_frecuencia_check CHECK ((frecuencia = ANY (ARRAY['semanal'::text, 'quincenal'::text, 'mensual'::text, 'bimestral'::text, 'trimestral'::text]))),
  constraint pacientes_semana_paridad_check CHECK ((semana_paridad = ANY (ARRAY['par'::text, 'impar'::text]))),
  constraint pacientes_token_acceso_key UNIQUE (token_acceso)
);

create table public.pagos (
  id uuid default extensions.uuid_generate_v4() not null,
  profesional_id uuid not null,
  monto numeric not null,
  moneda text default 'ARS'::text,
  concepto text,
  metodo text,
  estado text default 'pendiente'::text,
  descuento_referido numeric default 0,
  periodo_inicio date,
  periodo_fin date,
  referencia_pago text,
  created_at timestamp with time zone default now(),
  constraint pagos_pkey PRIMARY KEY (id),
  constraint pagos_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'pagado'::text, 'vencido'::text, 'reembolsado'::text]))),
  constraint pagos_metodo_check CHECK ((metodo = ANY (ARRAY['mercadopago'::text, 'transferencia'::text, 'efectivo'::text])))
);

create table public.profesionales (
  id uuid default extensions.uuid_generate_v4() not null,
  user_id uuid,
  nombre text not null,
  apellido text not null,
  especialidad text default 'Psicología'::text,
  email text not null,
  telefono text,
  matricula text,
  nombre_consultorio text,
  direccion text,
  link_videollamada text,
  dias_laborales integer[] default ARRAY[1, 2, 3, 4, 5],
  horario_inicio time without time zone default '08:00:00'::time without time zone,
  horario_fin time without time zone default '18:00:00'::time without time zone,
  duracion_sesion_default integer default 50,
  honorario_base numeric default 15000.00,
  minutos_pre_sesion integer default 30,
  plan text default 'starter'::text,
  max_pacientes integer default 15,
  plan_inicio date default CURRENT_DATE,
  plan_vencimiento date,
  codigo_referido text,
  referido_por uuid,
  activo boolean default false,
  habilitado_por uuid,
  fecha_habilitacion timestamp with time zone,
  motivo_activacion text,
  motivo_suspension text,
  onboarding_completado boolean default false,
  zona_horaria text default 'America/Argentina/Buenos_Aires'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint profesionales_pkey PRIMARY KEY (id),
  constraint profesionales_codigo_referido_key UNIQUE (codigo_referido),
  constraint profesionales_email_key UNIQUE (email),
  constraint profesionales_plan_check CHECK ((plan = ANY (ARRAY['starter'::text, 'profesional'::text, 'consultorio'::text, 'clinica'::text]))),
  constraint profesionales_user_id_key UNIQUE (user_id)
);

create table public.push_log (
  id uuid default extensions.uuid_generate_v4() not null,
  profesional_id uuid,
  paciente_id uuid,
  turno_id uuid,
  tipo text not null,
  titulo text not null,
  cuerpo text not null,
  estado text default 'enviado'::text,
  created_at timestamp with time zone default now(),
  constraint push_log_pkey PRIMARY KEY (id),
  constraint push_log_tipo_check CHECK ((tipo = ANY (ARRAY['recordatorio_mensual'::text, 'recordatorio_sesion'::text, 'pre_sesion'::text, 'cancelacion_paciente'::text, 'cancelacion_profesional'::text, 'cambio_horario'::text, 'bienvenida'::text, 'custom'::text])))
);

create table public.super_admin (
  id uuid default extensions.uuid_generate_v4() not null,
  user_id uuid not null,
  nombre text not null,
  email text not null,
  created_at timestamp with time zone default now(),
  constraint super_admin_pkey PRIMARY KEY (id),
  constraint super_admin_email_key UNIQUE (email),
  constraint super_admin_user_id_key UNIQUE (user_id)
);

create table public.turnos (
  id uuid default extensions.uuid_generate_v4() not null,
  profesional_id uuid not null,
  paciente_id uuid not null,
  fecha date not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  estado text default 'confirmado'::text,
  honorario numeric not null,
  motivo_cancelacion text,
  asistio boolean,
  nota_sesion text,
  push_recordatorio_enviado boolean default false,
  push_pre_sesion_enviado boolean default false,
  cancelacion_tardia boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint turnos_pkey PRIMARY KEY (id),
  constraint turnos_estado_check CHECK ((estado = ANY (ARRAY['confirmado'::text, 'cancelado_paciente'::text, 'cancelado_profesional'::text, 'realizado'::text, 'ausente'::text])))
);
alter table public.admin_log add constraint admin_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES super_admin(id);
alter table public.bloqueos add constraint bloqueos_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE;
alter table public.codigos_referido add constraint codigos_referido_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id);
alter table public.lista_espera add constraint lista_espera_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id);
alter table public.pacientes add constraint pacientes_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE;
alter table public.pagos add constraint pagos_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id);
alter table public.push_log add constraint push_log_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
alter table public.push_log add constraint push_log_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id);
alter table public.push_log add constraint push_log_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES turnos(id);
alter table public.turnos add constraint turnos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE;
alter table public.turnos add constraint turnos_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE;

CREATE INDEX idx_admin_log_fecha ON public.admin_log USING btree (created_at);
CREATE INDEX idx_bloq_prof_fecha ON public.bloqueos USING btree (profesional_id, fecha);
CREATE INDEX idx_pac_apellido ON public.pacientes USING btree (profesional_id, apellido, nombre);
CREATE INDEX idx_pac_prof ON public.pacientes USING btree (profesional_id);
CREATE INDEX idx_pac_token ON public.pacientes USING btree (token_acceso);
CREATE INDEX idx_prof_referido ON public.profesionales USING btree (codigo_referido);
CREATE INDEX idx_prof_user ON public.profesionales USING btree (user_id);
CREATE INDEX idx_push_prof ON public.push_log USING btree (profesional_id);
CREATE INDEX idx_turno_pac ON public.turnos USING btree (paciente_id);
CREATE INDEX idx_turno_prof_fecha ON public.turnos USING btree (profesional_id, fecha);
CREATE UNIQUE INDEX idx_turno_slot ON public.turnos USING btree (profesional_id, fecha, hora_inicio) WHERE (estado <> ALL (ARRAY['cancelado_paciente'::text, 'cancelado_profesional'::text]));

alter table public.admin_log enable row level security;
alter table public.bloqueos enable row level security;
alter table public.codigos_referido enable row level security;
alter table public.lista_espera enable row level security;
alter table public.pacientes enable row level security;
alter table public.pagos enable row level security;
alter table public.profesionales enable row level security;
alter table public.push_log enable row level security;
alter table public.turnos enable row level security;

create policy bloq_all on public.bloqueos as permissive for all to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));
create policy ref_all on public.codigos_referido as permissive for all to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));
create policy espera_all on public.lista_espera as permissive for all to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));
create policy pac_all on public.pacientes as permissive for all to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));
create policy pago_select on public.pagos as permissive for select to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));
create policy prof_select on public.profesionales as permissive for select to public using ((user_id = auth.uid()));
create policy prof_update on public.profesionales as permissive for update to public using ((user_id = auth.uid()));
create policy push_all on public.push_log as permissive for all to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));
create policy turno_all on public.turnos as permissive for all to public using ((profesional_id IN ( SELECT profesionales.id
   FROM profesionales
  WHERE (profesionales.user_id = auth.uid()))));

CREATE OR REPLACE FUNCTION public.cancelar_turno_paciente(p_turno_id uuid, p_token text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_turno RECORD;
BEGIN
  SELECT t.*, p.nombre || ' ' || p.apellido AS pnombre, p.token_acceso
  INTO v_turno
  FROM turnos t
  JOIN pacientes p ON p.id = t.paciente_id
  WHERE t.id = p_turno_id AND p.token_acceso = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Acceso denegado');
  END IF;

  IF v_turno.estado LIKE 'cancelado%' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ya fue cancelado');
  END IF;

  UPDATE turnos
  SET estado = 'cancelado_paciente',
      motivo_cancelacion = COALESCE(p_motivo, 'Cancelado por paciente')
  WHERE id = p_turno_id;

  RETURN jsonb_build_object(
    'ok', true,
    'paciente', v_turno.pnombre,
    'fecha', v_turno.fecha,
    'hora', v_turno.hora_inicio
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generar_turnos_paciente(p_paciente_id uuid, p_mes integer, p_anio integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_pac RECORD;
  v_prof RECORD;
  v_fecha DATE;
  v_fin DATE;
  v_semana INTEGER;
  v_incluir BOOLEAN;
  v_count INTEGER := 0;
  v_hora_fin TIME;
  v_duracion INTEGER;
BEGIN
  SELECT * INTO v_pac FROM pacientes WHERE id = p_paciente_id AND activo = TRUE;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT * INTO v_prof FROM profesionales WHERE id = v_pac.profesional_id;

  v_duracion := COALESCE(v_pac.duracion_sesion, v_prof.duracion_sesion_default, 50);
  v_hora_fin := v_pac.hora_turno + make_interval(mins => v_duracion);

  v_fecha := make_date(p_anio, p_mes, 1);
  v_fin := (v_fecha + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  WHILE v_fecha <= v_fin LOOP
    IF EXTRACT(ISODOW FROM v_fecha)::INTEGER = v_pac.dia_semana THEN
      v_semana := CEIL(EXTRACT(DAY FROM v_fecha) / 7.0)::INTEGER;
      v_incluir := TRUE;

      IF v_pac.frecuencia = 'quincenal' THEN
        IF v_pac.semana_paridad = 'par' THEN
          v_incluir := (v_semana % 2 = 0);
        ELSE
          v_incluir := (v_semana % 2 = 1);
        END IF;
      ELSIF v_pac.frecuencia = 'mensual' THEN
        v_incluir := (v_semana = 1);
      ELSIF v_pac.frecuencia = 'bimestral' THEN
        v_incluir := (v_semana = 1) AND (p_mes % 2 = 0);
      ELSIF v_pac.frecuencia = 'trimestral' THEN
        v_incluir := (v_semana = 1) AND (p_mes % 3 = 0);
      END IF;

      IF v_incluir THEN
        IF NOT EXISTS (
          SELECT 1 FROM bloqueos b
          WHERE b.profesional_id = v_pac.profesional_id
          AND b.fecha = v_fecha
          AND (b.hora_inicio IS NULL OR (b.hora_inicio <= v_pac.hora_turno AND b.hora_fin > v_pac.hora_turno))
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM turnos t
            WHERE t.paciente_id = p_paciente_id
            AND t.fecha = v_fecha
            AND t.hora_inicio = v_pac.hora_turno
          ) THEN
            INSERT INTO turnos (profesional_id, paciente_id, fecha, hora_inicio, hora_fin, estado, honorario)
            VALUES (v_pac.profesional_id, p_paciente_id, v_fecha, v_pac.hora_turno, v_hora_fin, 'confirmado', v_pac.honorario);
            v_count := v_count + 1;
          END IF;
        END IF;
      END IF;
    END IF;

    v_fecha := v_fecha + INTERVAL '1 day';
  END LOOP;

  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generar_turnos_profesional(p_prof_id uuid, p_mes integer, p_anio integer)
 RETURNS TABLE(paciente_nombre text, turnos_creados integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_pac RECORD;
  v_count INTEGER;
BEGIN
  FOR v_pac IN
    SELECT id, nombre, apellido
    FROM pacientes
    WHERE profesional_id = p_prof_id AND activo = TRUE
  LOOP
    v_count := generar_turnos_paciente(v_pac.id, p_mes, p_anio);
    IF v_count > 0 THEN
      paciente_nombre := v_pac.nombre || ' ' || v_pac.apellido;
      turnos_creados := v_count;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resumen_mensual(p_pac_id uuid, p_mes integer, p_anio integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_pac RECORD;
  v_turnos JSONB;
  v_total NUMERIC;
  v_cantidad INTEGER;
BEGIN
  SELECT * INTO v_pac FROM pacientes WHERE id = p_pac_id;

  SELECT
    jsonb_agg(
      jsonb_build_object(
        'fecha', t.fecha,
        'hora', t.hora_inicio,
        'dia', TO_CHAR(t.fecha, 'TMDay')
      ) ORDER BY t.fecha
    ),
    COALESCE(SUM(t.honorario), 0),
    COUNT(*)
  INTO v_turnos, v_total, v_cantidad
  FROM turnos t
  WHERE t.paciente_id = p_pac_id
    AND EXTRACT(MONTH FROM t.fecha) = p_mes
    AND EXTRACT(YEAR FROM t.fecha) = p_anio
    AND t.estado NOT LIKE 'cancelado%';

  RETURN jsonb_build_object(
    'paciente', v_pac.nombre || ' ' || v_pac.apellido,
    'honorario_sesion', v_pac.honorario,
    'total_mes', v_total,
    'cantidad', v_cantidad,
    'turnos', COALESCE(v_turnos, '[]'::jsonb)
  );
END;
$function$;

create view public.v_admin_dashboard as
SELECT ( SELECT count(*) AS count
           FROM profesionales
          WHERE profesionales.activo = true) AS prof_activos,
    ( SELECT count(*) AS count
           FROM profesionales) AS prof_total,
    ( SELECT count(*) AS count
           FROM pacientes
          WHERE pacientes.activo = true) AS pac_total,
    ( SELECT count(*) AS count
           FROM turnos
          WHERE turnos.fecha >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND turnos.estado !~~ 'cancelado%'::text) AS turnos_mes,
    ( SELECT COALESCE(sum(pagos.monto), 0::numeric) AS "coalesce"
           FROM pagos
          WHERE pagos.estado = 'pagado'::text AND pagos.periodo_inicio >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS ingreso_mes;

create view public.v_turnos_hoy as
SELECT t.id,
    t.fecha,
    t.hora_inicio,
    t.hora_fin,
    t.estado,
    t.honorario,
    p.id AS paciente_id,
    (p.nombre || ' '::text) || p.apellido AS paciente_nombre,
    p.frecuencia,
    p.telefono,
    t.profesional_id
   FROM turnos t
     JOIN pacientes p ON p.id = t.paciente_id
  WHERE t.fecha = CURRENT_DATE
  ORDER BY t.hora_inicio;
