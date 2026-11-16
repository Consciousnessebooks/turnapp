# TURNAPP — Especificación completa

Versión del kit: 13/11/2026 (decisiones de Martín incluidas). Reglas de trabajo, prohibiciones, reanudación y verificación: `CLAUDE.md`. Decisiones y su porqué: `docs/DECISIONES.md`. Estado: `docs/PROGRESO.md`.

## 0. Cómo usar este documento

- No lo leas entero en cada sesión. Índice: `grep -n '^## \|^### ' docs/ESPECIFICACION.md`. Leé la fase actual (§9) y las secciones que cita.
- `[VERIFICAR]` = dato que puede haber cambiado: verificalo antes de usarlo (CLAUDE.md).
- Si algo de acá contradice `CLAUDE.md` o una decisión de Martín en DECISIONES.md, mandan ellos. Si encontrás una contradicción interna, elegí lo más seguro que no frene el piloto y registrala en DECISIONES.md.
- Lo que dice "Piloto" entra antes del Piloto 1; "v1.1" después del piloto; "Final" en el endurecimiento.

## 1. Contexto y estado real (al 13/11/2026; verificá todo)

- Repo `github.com/Consciousnessebooks/turnapp`, hoy conectado a Vercel con auto-deploy (`https://turnapp-4typ.vercel.app/`). Vercel es el hosting PROVISORIO: el definitivo se decide en Fase 0 (§5.1).
- Stack actual: React + Vite, todo en un `src/App.jsx` de ~960–1180 líneas con estilos inline, `lucide-react`, `@supabase/supabase-js`; `index.html`, `src/main.jsx`, `public/manifest.json`, `vite.config.js`.
- Producción muestra `Uncaught TypeError: e is not a function` y el login no anda. Causa probable: el último commit cambió las props de `Professional` y el cuerpo sigue llamando a `setAppts`, `setPatients`, `onPatient`. Puede haber un `App-MINIMAL.jsx` sin probar. Leé el repo real.
- La consola mostró "Content Security Policy blocks the use of eval" (probablemente una extensión de Chrome). Verificalo con Playwright, que no tiene extensiones.
- Supabase `hszobstcatbyzijbdnpv` (`https://hszobstcatbyzijbdnpv.supabase.co`). Documentación vieja, sin verificar: 11 tablas (`super_admin`, `profesionales`, `pacientes`, `turnos`, `bloqueos`, `push_log`, `configuracion_push`, `pagos`, `admin_log`, `codigos_referido`, `lista_espera`), 4 funciones (`generar_turnos_paciente`, `generar_turnos_profesional`, `cancelar_turno_paciente`, `resumen_mensual`), 2 vistas (`v_admin_dashboard`, `v_turnos_hoy`), RLS activo, quizás funciones de portal por token. Columnas observadas en `profesionales`: `id, user_id, nombre, apellido, especialidad, email (NOT NULL), dias_atencion int[] default {1,2,3,4,5}, hora_inicio 08:00, hora_fin 18:00, duracion 50, honorario 15000.00, plan 'starter', limite 15, activo, zona horaria 'America/Argentina/Buenos_Aires', created_at, updated_at` y otras.
- Usuarios de Auth: Super Admin `turnapp.org@gmail.com` (user_id `49d02705-9df3-4690-8ab5-5dbe6183fff9`; Martín no sabe la contraseña y el link de reset falla, probablemente porque Site URL/Redirect URLs apuntan a localhost). Profesional de prueba `profesional@test.com` (`29070354-48f5-41af-b413-72241422a30c`) con contraseña débil: se elimina de producción por defecto y se le avisa a Martín en el PR.
- La `service_role` se filtró en un chat. Martín la invalida antes de la primera sesión siguiendo la guía (incluye revocar el secreto JWT legacy). Vos verificás que quedó hecho (§5.5).
- Errores que ya pasaron y las reglas que los evitan: dependencias faltantes (regla 11), archivos reescritos de memoria (regla 2), esquema asumido (regla 7), "funciona" sin evidencia (regla 1), pasos ambiguos para Martín (regla 13), mock mezclado con real (regla 10), secretos en el chat (regla 6).

## 2. Producto

### 2.1 Roles (Modelo A: control total, sin auto-registro)
- **Super Admin (Martín).** Crea, suspende y reactiva profesionales; cambia el plan; reenvía invitaciones; ve métricas agregadas. Nunca nombres ni datos de pacientes. Crear un profesional = formulario de 3 campos obligatorios (Nombre, Apellido, Email), Especialidad opcional, plan "Fundador" preseleccionado; el sistema manda la invitación solo.
- **Profesional.** Administrador de su consultorio: pacientes, turnos, honorarios, bloqueos, avisos. No ve otros consultorios. Máximas herramientas.
- **Paciente.** Sin contraseña. Ve sus turnos, cancela con la anticipación mínima, edita su teléfono, activa avisos. Ultra simple.
- No existe auto-registro: el registro público de Supabase Auth queda deshabilitado.

### 2.2 Las 8 reglas fundacionales (obligatorias para el MVP final; cada una con tests en docs/TESTS.md)
1. **Reserva automática recurrente por "sesiones por mes".** Cada paciente tiene 1, 2, 3, 4 o "Más" sesiones por mes con un día y una hora habitual; el sistema genera los turnos hacia adelante (horizonte rodante), sin duplicados ni choques. El profesional agrega sesiones extra en cualquier momento sin tocar el patrón (§3).
2. **Aislamiento de datos.** Un paciente nunca ve ni toca turnos de otro; solo el profesional modifica todo. Garantizado por RLS, FKs de tenant y funciones validadas, no por la UI.
3. **Resumen mensual (día 25).** Aviso a cada paciente activo con todas las fechas del mes siguiente (patrón y extras), honorario por sesión y total del mes. Turnos confirmados por defecto (§3.11).
4. **Cancelación por el paciente.** Desde su portal; aviso al profesional con los datos completos en Alertas. No puede cancelar con menos de la anticipación mínima (24 h por defecto; configurable 12/24/48/72 h), validado en el servidor. Si falta menos, el portal ofrece "Escribirle por WhatsApp".
5. **Multiplataforma.** PC y celular; PWA responsive e instalable.
6. **Bloqueo por el profesional.** Día, franja o varios días; cancela los turnos afectados y avisa a cada paciente con un mensaje (y alternativas cuando corresponde). Piloto: mensaje "Tu profesional te va a escribir para reprogramar" o fecha de regreso; v1.1: alternativas aceptables desde el portal.
7. **Cambio de sesiones por mes sin huecos.** Al cambiar el plan de un paciente (por ejemplo, de 4 a 2), se proponen opciones que no dejan huecos ni choques; no toca el pasado (§3.7). Piloto: desde una fecha, eligiendo qué semanas quedan, con detección de choques y lista de horarios liberados; v1.1: propuestas cruzadas a otros pacientes y lista de espera.
8. **Honorarios individuales.** Cada paciente tiene el suyo, editable; aparece en todos los avisos que hablan de turnos y montos. Un cambio afecta solo turnos futuros no cancelados desde la fecha elegida; los pasados conservan su valor (§3.10).

### 2.3 Planes
Planes por pacientes activos: Fundador (gratis, sin límite, sin vencimiento hasta que Martín decida), Starter (15), Pro (100), Clínica (sin límite); precios de referencia Pro ~$4.999 y Clínica ~$9.999 ARS/mes, sin cobro en el MVP. Todo profesional nuevo nace en "Fundador". El límite se hace cumplir en la base (`limite null` = sin límite); al 80 % el panel avisa ("Te quedan 3 lugares en tu plan"). El plan lo cambia solo el Super Admin. MercadoPago y códigos de referido: backlog.

### 2.4 Avisos
Sin WhatsApp Business API. Canal principal: Web Push desde la PWA (en la UI se dice "avisos"). Canal in-app: pestaña Alertas del profesional y avisos en el portal. Plan B gratuito y regla de cobertura obligatoria: §7.6.

### 2.5 Alcance por etapa
| Área | Piloto 1 | v1.1 (2–4 semanas después) | Final |
|---|---|---|---|
| Super Admin | Login con MFA, "Crear profesional" (3 campos), invitación con link copiable y "Enviar por WhatsApp", lista con estado, suspender/reactivar | Dashboard agregado, Plataforma con chequeos, cambiar plan desde la UI, "Ver resumen", feriados desde la UI | — |
| Profesional | Onboarding de una pantalla con aceptación de Términos; Hoy con 4 StatCards y drilldown; Agenda semanal con extras, mover, cancelar, bloquear, realizado/ausente; Pacientes con alta rápida por sesiones por mes, "Guardar y cargar otro", "Pegar lista", estado del acceso, "Enviar accesos pendientes", editar, cambiar plan desde una fecha, baja; Alertas; Configuración mínima; preguntas de feriados | Filtros día/semana/quincena/mes en drilldowns, ajuste de honorarios en bloque, feed `.ics` del profesional, alternativas de la regla 6, propuestas cruzadas de la regla 7 | Exportaciones |
| Paciente | Link → aviso de privacidad → lista y calendario → cancelar → editar teléfono → activar avisos → agregar al calendario → "Escribirle a mi profesional" | Aceptar alternativas, varios profesionales en el mismo dispositivo con selector | — |
| Avisos | Cancelaciones (ambos sentidos), bloqueo, día anterior, pre-sesión, día 25, preguntas de feriados, plan B por WhatsApp | Confirmación de recepción visible, embudo de instalación | — |
| Calidad | CI: lint, typecheck, unit, build, test:db con catálogo y matriz RLS, e2e Chromium 360/1280, axe, gitleaks, audit; backtesting del piloto | Lighthouse CI, e2e WebKit | Backtesting completo con horario de verano, presupuestos de rendimiento |
| Legal y origen | Borradores de Términos y Privacidad publicados, aceptación registrada, aviso al paciente, dominio propio en uso | Revisión de un abogado | Registro de la base ante la AAIP si corresponde |
La seguridad no se recorta en ninguna etapa.

## 3. Modelo de agenda (sesiones por mes)

### 3.1 Conceptos
- **Serie (`recurrencias`):** un horario fijo de un paciente (día de la semana, hora local, patrón, vigencia). Un paciente puede tener varias series activas ("Más").
- **Ocurrencia:** fecha local que le corresponde a una serie según su patrón (`fecha_ocurrencia`). Cada turno generado guarda `recurrencia_id` y `fecha_ocurrencia`.
- **Semana del mes de una fecha:** `ordinal = ceil(día_del_mes / 7)` (1 a 5) = "es el n-ésimo martes del mes". En la UI se dice "1er martes", "2º martes"; nunca "semana calendario".
- **Sesión extra:** turno suelto de un paciente (`origen = 'extra'`, `recurrencia_id null`), no cambia ninguna serie.
- **Sesión movida:** el mismo turno con otro `inicio`/`fin`; conserva `recurrencia_id` y `fecha_ocurrencia` (así el generador nunca la recrea) y guarda `movido_desde`.

### 3.2 Alta de paciente (pantalla que Martín valida en la preview antes de cerrar la Fase 4)
Campos visibles, en este orden (máximo 7 visibles, 8 interacciones desde "Nuevo" hasta "Guardar"):
1. Apellido · 2. Nombre · 3. Celular (normalizado, §6.2)
4. **Sesiones por mes:** control segmentado `1 · 2 · 3 · 4 · Más` (por defecto 4).
5. **Día y hora habitual:** arriba, 3 chips con los próximos horarios libres dentro del horario de atención ("Mar 10:00"), elegibles con un toque; si no, selector de día y hora cada 15 minutos.
6. **Primera sesión:** fecha precargada con la próxima fecha de ese día que encaja en el patrón; editable.
7. Honorario (precargado con el del profesional).
Debajo del bloque, siempre: "Próximas: martes 2, martes 16 y martes 30 de diciembre a las 10:00" y, si corresponde, la nota de meses irregulares (§3.3). "Más opciones" (colapsado) muestra las alternativas del patrón elegido. "Más datos" (colapsado): email, tutor o responsable, duración distinta, modalidad y link de videollamada, notas administrativas.
Botones: "Guardar" y "Guardar y cargar otro" (mantiene plan y honorario). Al guardar, hoja "Compartir acceso" con "Después". La primera sesión siempre se agenda en la fecha elegida: si no coincide con el patrón, queda como sesión extra y la serie arranca en la próxima ocurrencia (la UI lo dice: "La primera sesión queda como extra; el patrón arranca el martes 9").

### 3.3 Patrón por opción (por defecto y alternativas en "Más opciones")
| Opción | Patrón por defecto (tipo) | Detalle exacto | Alternativas en "Más opciones" |
|---|---|---|---|
| 1 | `mensual_ordinal` | Mismo ordinal del día de la semana que la primera sesión ("2º martes de cada mes"). Si la primera sesión es un 5º día de la semana del mes, el ordinal es `-1` = "el último martes de cada mes", sin preguntar, y la línea de confirmación lo dice. | "Cada 4 semanas" (`cada_n_semanas`, N = 4; aviso: "algunos meses tienen 2") |
| 2 | `cada_n_semanas`, N = 2 | Cada 14 días desde la primera sesión (paridad anclada). Nota cuando un mes del horizonte tiene 3: "En marzo hay 3 sesiones (cada 2 semanas). Si preferís siempre 2, elegí 1ª y 3ª semana." | "1ª y 3ª semana" (`semanas_del_mes` = {1,3}); también {2,4} o cualquier par elegido |
| 3 | `semanas_del_mes` | Tres semanas elegidas del mes, siempre 3. Por defecto {1,2,3}; si la primera sesión es un 4º día de la semana, {2,3,4}; si es un 5º, {1,2,3} y la primera sesión queda como extra. Se eligen con 4 casillas "1ª 2ª 3ª 4ª". | Cualquier trío de {1,2,3,4} |
| 4 | `cada_n_semanas`, N = 1 | Todas las semanas. En meses con 5 de ese día de la semana, incluye la 5ª (5 sesiones) y la línea de confirmación lo avisa. | "Máximo 4 por mes" (`semanas_del_mes` = {1,2,3,4}: nunca la 5ª) |
| Más | varias series | Ver §3.4 | — |
Colores por opción (borde izquierdo de 4 px, ícono al ~6 % y badge, §4.1): 4 `#0891b2`, 3 `#059669`, 2 `#7c3aed`, 1 `#d97706`, Más `#475569`, sin horario fijo `#64748b`. Badge: "4 por mes", "1 por mes", "Mar y Jue", "Cada 8 semanas", "Sin horario fijo".

### 3.4 "Más"
"Más" abre la lista "Horarios fijos": una fila por serie con día, hora y patrón (cada fila elige 1, 2, 3, 4 por mes o "Cada N semanas", N de 1 a 12), con "Agregar otro horario". Así se cubren "martes y jueves" (dos series de 4) y más de 4 por mes. También en "Más": "Sin horario fijo (solo sesiones extra)". El total estimado del mes se muestra en vivo ("Unas 8 sesiones por mes").

### 3.5 Sesiones extra, mover y cancelar
- **Extra:** desde la ficha ("Agregar sesión extra"), desde "Agregar turno" en la Agenda o tocando un hueco libre ("Libre 15:00"). Hereda el honorario del paciente (editable). Cuenta en el total del mes y en el resumen del día 25; si el resumen ya salió, genera el aviso "Cambió tu turno".
- **Mover esta sesión:** sugiere huecos libres; aviso al paciente "Tu turno cambió de día".
- **Cancelar (profesional):** aviso al paciente y regla de cobertura (§7.6).
- Detección de choques antes de guardar en todos los casos, con el próximo horario libre sugerido.

### 3.6 Motor de generación (SQL, fuente única de verdad)
- Tabla `recurrencias(id, profesional_id, paciente_id, tipo, dia_semana smallint /*ISO 1=lunes..7*/, hora_local time, duracion_min smallint null, ancla date, intervalo_semanas smallint null, ordinal smallint null /*1..4 o -1*/, semanas smallint[] null /*subconjunto de {1,2,3,4}*/, vigente_desde date, vigente_hasta date null, creada timestamptz)`, con CHECKs por tipo y FK compuesta `(paciente_id, profesional_id)`.
- Ocurrencias de una serie entre `greatest(vigente_desde, ancla)` y el horizonte: las fechas locales `d` con `isodow(d) = dia_semana` y `d <= coalesce(vigente_hasta, horizonte)` que cumplan: `cada_n_semanas` → `((d - ancla) / 7) % intervalo_semanas = 0`; `mensual_ordinal` → `ceil(día/7) = ordinal`, o `ordinal = -1` y `d + 7` cae en el mes siguiente; `semanas_del_mes` → `ceil(día/7) = any(semanas)`.
- Cálculo DST-seguro: `inicio = (d + hora_local) at time zone zona_profesional`; nunca intervalos sumados a `timestamptz`. Hora inexistente: primera hora válida posterior con `ajustado_dst = true`; hora ambigua: la primera.
- Idempotencia: `unique (recurrencia_id, fecha_ocurrencia)`; correr el generador dos veces da lo mismo. Sin `unique (paciente_id, inicio)`.
- Sin choques: exclusión `btree_gist` por profesional sobre `tstzrange(inicio, fin, '[)')` para turnos activos. Inserción fila por fila con `exception when exclusion_violation` → `conflictos_agenda(profesional_id, paciente_id, fecha_ocurrencia, motivo)` y alerta al profesional; nunca se pierde una sesión en silencio.
- Bloqueos: el generador saltea ocurrencias dentro de un bloqueo. Feriados: nunca los saltea solo (§3.8).
- Serialización: toda función que crea, mueve o cancela turnos o bloqueos empieza con `perform pg_advisory_xact_lock(hashtextextended(p_profesional_id::text, 0))`.
- Horizonte rodante: siempre hasta el último día del mes siguiente + 14 días. Job diario (§7.5), profesional por profesional con su propio bloque de excepción.
- Duración: la de la serie, si no la del paciente, si no la del profesional.

### 3.7 Cambio de sesiones por mes (regla 7)
- `proponer_cambio_plan(paciente_id, nuevo_plan jsonb, desde date)` devuelve: fechas que se dan de baja, fechas nuevas, choques con nombre "ocupado" (sin datos del otro paciente) y opciones sin huecos: al bajar (4 → 2, 2 → 1) elegir qué ocurrencias quedan ("martes 2 y 16" o "martes 9 y 23") y la lista de horarios que se liberan; al subir (2 → 4, 1 → 2) los choques en las semanas nuevas con el hueco libre más cercano para cada uno.
- `aplicar_cambio_plan(...)` en una transacción con el lock: cierra la serie (`vigente_hasta = desde - 1`), marca `cancelado_cambio_plan` los turnos futuros de la serie vieja desde `desde`, crea la serie nueva y genera. Un solo aviso al paciente ("Cambió tu turno"), nunca uno por turno. No toca el pasado.
- Cambio a mitad de mes: se aplica desde la fecha elegida (por defecto, la próxima sesión). Si el resumen del día 25 ya salió, va un aviso de cambios con las fechas nuevas.
- v1.1: ofrecer los horarios liberados a pacientes de paridad complementaria y a la lista de espera.

### 3.8 Feriados (decisión de Martín: preguntar antes)
- Tabla `feriados(fecha, nombre, tipo /*inamovible|trasladable|puente|no_laborable*/, fuente_url, cargado)` con el año en curso y el siguiente, cargada por migración desde la fuente oficial `[VERIFICAR]` (argentina.gob.ar; los días puente y no laborables salen por decreto: citá el decreto). Job el día 1 de cada mes: si falta el año siguiente desde el 1 de noviembre, o si la fuente oficial tiene una fecha que la tabla no, alerta al Super Admin ("Revisá los feriados de 2027") y anotalo en PROGRESO.md. v1.1: formulario de feriados en Plataforma.
- Nunca se cancela en silencio. 14 días antes de cada feriado en el que un profesional tiene turnos, Alertas y un aviso: "El lunes 24 de marzo es feriado (Día de la Memoria). Tenés 5 turnos. ¿Atendés?" con "Atiendo" (no cambia nada) y "No atiendo" (crea un bloqueo de día completo con el mensaje "Ese día es feriado y no hay consultorio. Retomamos el {próxima sesión}.", que avisa a cada paciente). Sin respuesta, se repite 7 días antes y el día anterior; si nunca responde, los turnos quedan como están.
- Turnos creados después de la pregunta (extras, horizonte): si ya respondió "No atiendo", el bloqueo los evita; si respondió "Atiendo", se generan; si está pendiente, entran en la misma pregunta.
- Configuración: "Feriados: Preguntarme (recomendado) / No atiendo nunca (bloquear y avisar solo)". En automático, el job crea el bloqueo y los avisos 14 días antes sin preguntar. Los días `no_laborable` se tratan como feriado solo si el profesional lo activa.
- La agenda muestra el feriado con su nombre y el estado de la respuesta.

### 3.9 Bloqueos (regla 6)
- Interfaz: "Un día", "Una franja horaria", "Varios días (vacaciones)"; vista previa con turnos y pacientes afectados (corrige el bug del prototipo que contaba el día seleccionado); campo "Mensaje para tus pacientes" precargado y editable ("No voy a atender del {desde} al {hasta}. Retomamos el {próxima sesión del paciente}." o "Tu turno del {día y hora} se cancela."); interruptor "Ofrecer otros horarios" (v1.1; encendido por defecto en día y franja, apagado en rangos).
- La función cancela los turnos afectados con el lock, encola un aviso por paciente y aplica la regla de cobertura (§7.6). `alternativas_turno(turno, n)` y `portal_aceptar_alternativa` quedan para v1.1 (la restricción de exclusión resuelve carreras).

### 3.10 Honorarios (regla 8)
Honorario copiado al turno al generarse. Cambio individual "a partir del [fecha]" actualiza turnos futuros no cancelados; los pasados conservan su valor. Todo cambio se comunica en el próximo resumen del día 25 ("Desde enero, la sesión es de $ 9.500") y, si el profesional lo elige, con un aviso inmediato. v1.1: "Actualizar honorarios" en bloque (porcentaje redondeado a la centena o monto nuevo, a todos o a una selección, con vista previa antes y después).

### 3.11 Resumen del día 25 (regla 3)
Para cada paciente activo: todas las fechas del mes siguiente (series y extras, no canceladas), honorario por sesión (si todos iguales) o por fecha, y total. Feriados con pregunta pendiente: se incluyen (siguen confirmados) y el aviso posterior corrige. Cálculo en SQL (`resumen_mes(paciente, mes)`), el mismo que usan el portal, la vista previa "Recordatorios" del profesional y el test que compara con la suma real.

### 3.12 Horario de atención
Tabla `horarios_atencion(profesional_id, dia_semana, desde, hasta)` con varios rangos por día, reconciliada con `dias_atencion`, `hora_inicio` y `hora_fin` existentes (expandir/contraer). Sirve para sugerir huecos; nunca impide agendar fuera: avisa "Está fuera de tu horario de atención" y deja seguir.

### 3.13 Migración del dato existente
Si la base tiene frecuencias viejas (verificá nombres y valores reales en la introspección), migración en dos pasos (expandir, después contraer en otro PR):
| Valor viejo | Serie nueva |
|---|---|
| semanal | opción 4: `cada_n_semanas` N = 1 (incluye 5ª) |
| quincenal | opción 2: `cada_n_semanas` N = 2, con ancla = primer turno futuro existente (conserva la paridad); si no hay, la próxima fecha de su día |
| mensual | opción 1: `mensual_ordinal` con el ordinal del primer turno futuro (5º → -1) |
| bimestral | "Más opciones": `cada_n_semanas` N = 8 |
| trimestral | "Más opciones": `cada_n_semanas` N = 12 |
| otro o vacío | "Sin horario fijo" y alerta al profesional |
Test de la migración: misma cantidad de pacientes antes y después, cada paciente activo con frecuencia vieja tiene exactamente una serie, ningún turno futuro duplicado, y un informe "Así quedaron tus pacientes" (próximas 3 fechas) visible para el profesional. La columna vieja se borra recién en el PR de contracción, con aprobación de Martín.

### 3.14 Estados y eventos de turno
Estados (reconciliá con los existentes): `confirmado` (default), `cancelado_paciente`, `cancelado_profesional`, `cancelado_bloqueo`, `cancelado_cambio_plan`, `realizado`, `ausente`. Columnas: `origen` (`serie`, `extra`), `movido_desde`, `ajustado_dst`. Tabla `turnos_eventos` de solo inserción (`turno_id`, `profesional_id`, `actor` profesional/paciente/sistema, `acceso_id`, `evento`, `antes jsonb`, `despues jsonb`, `creado`); el profesional ve el historial en el detalle del turno.

## 4. Diseño (preservar el prototipo)

### 4.1 Tokens
Referencia real: `docs/prototipo/TURNAPP-v2-complete.jsx` (excluido de build, lint y typecheck). DM Sans 400–900 (`@fontsource-variable/dm-sans`, subset latin). Títulos de pantalla 20px/800, letter-spacing -0.5px; hero `clamp(32px,5vw,56px)`/900, -2px, line-height 1.05; cuerpo 13–14px (16px en el portal); labels 11–12px/600–700.
Colores en `src/styles/tokens.css`: `--bg #f8fafc`, `--card #ffffff`, `--ink #0f172a`, `--text #334155`, `--text-2 #475569`, `--text-3 #64748b`, `--muted #94a3b8` (solo íconos y decoración sobre fondo claro; sobre fondos oscuros sirve como texto secundario, 7,5:1), `--border #e2e8f0`, `--divider #f1f5f9`, `--primary #0891b2`, `--primary-2 #0e7490`, `--primary-bg #ecfeff`, `--accent #7c3aed` (gradiente a `#6d28d9`), `--success #059669`/`--success-bg #ecfdf5`, `--danger #dc2626`/`--danger-bg #fef2f2`/`--danger-border #fecaca`, `--warning #d97706`/`--warning-bg #fffbeb`, `--dark-bg` gradiente `#0a0f1e` → `#0d1b33`, `--dark-input #0f172a`/`--dark-border #1e293b`, `--admin-bg #0d0820`, `--admin-header #150b2e`, `--admin-border #2d1b69`, `--admin-accent #8b5cf6`, `--admin-accent-2 #a78bfa`. Hero: gradiente `#0891b2` → `#06b6d4` → `#7c3aed` sobre texto.
Tokens de texto (mismo look, pasan AA en texto chico; el color brillante queda para bordes, íconos, fondos y texto grande): `--primary-text #0e7490`, `--success-text #047857`, `--warning-text #b45309`, `--danger-text #dc2626`, `--on-dark-text-2 #94a3b8` (en vez de `#64748b` sobre oscuro), `--admin-tab-inactive #a78bfa` (en vez de `#4c1d95`), `--on-primary-text-2 rgba(255,255,255,.88)`. Toasts: success `#047857`, info `#0e7490`, error `#dc2626`. Botón primario: gradiente 135° `#0e7490` → `#155e75`. Test unitario de contraste por par; captura lado a lado en el PR de la Fase 1b.
Colores por opción de sesiones por mes: §3.3.
Formas: botones radio 10px; tarjetas 12–14px; modales 20px, ancho máx. 420px, alto máx. 85vh con scroll, overlay `rgba(0,0,0,.5)` con blur 4px; badges radio 6px, fondo al ~9 %, borde al ~19 %. Variantes de botón: `primary`, `danger` (fondo `#fef2f2`, texto `#dc2626`, borde `#fecaca`), `ghost` (transparente, texto `--text-3`, borde `#e2e8f0`), `accent`. Normal 11×18px, chico 8×12px (objetivo táctil ≥ 44px igual). Animaciones `fadeUp`, `slideDown`, `slideUp`, `scaleIn`; `button:active` escala .98; respetar `prefers-reduced-motion`. Íconos solo `lucide-react` con imports nombrados.

### 4.2 Componentes base
`Toast` (abajo a la derecha, `role="status"`), `PushPill` (aviso recibido en primer plano, arriba a la derecha, fondo `#0f172a`, campana en caja cyan, "TURNAPP", título, cuerpo, cerrar), `Modal` accesible, `Badge`, `Btn` (`primary|danger|ghost|accent`, `full`, `small`, `disabled`, respeta `style`), `StatCard` (botón con borde izquierdo de color, ícono + label + valor 22px/800), `Tabs` con `role="tablist"`, `ApptRow` fuera de `Professional`.

### 4.3 Landing (fondo oscuro)
Nav con logo (cuadrado 32px con gradiente e ícono calendario) + "TURNAPP" y "Ingresar". H1 "Tu agenda clínica / en piloto automático" (segunda línea con gradiente). Bajada: "Turnos recurrentes, avisos al celular, cancelaciones con un toque. Sin WhatsApp Business." Grilla de 6 features: Avisos gratis, Turnos solos, PC + Celular, Honorarios, Ultra simple, Seguro. El badge "Costo operativo: $0/mes" se reemplaza por un mensaje de valor para profesionales. No hay botón "Super Admin" público; "Ver demo" queda oculto (backlog) y el CTA secundario "Quiero usar TURNAPP" abre WhatsApp a `VITE_CONTACTO_WHATSAPP` con "Hola, soy profesional de salud mental y quiero probar TURNAPP." Footer con Términos y Privacidad. Metadatos Open Graph: `og:title` "TURNAPP — Tus turnos", `og:description` "Mirá tus próximos turnos y recibí avisos en el celular", `og:image` 1200×630 con el logo sobre el fondo oscuro.

### 4.4 Login (fondo oscuro)
Un solo login (el rol se resuelve después): ícono en cuadrado 52px, tarjeta translúcida con Email y Contraseña, "Ingresar" con estado "Verificando...", "Olvidé mi contraseña", errores claros en español, sin valores precargados. Paso de MFA para el Super Admin.

### 4.5 Panel profesional (fondo claro)
Header sticky (logo, "TURNAPP", badge "Profesional", Configuración, "Salir") y tabs sticky con ícono arriba y texto abajo, subrayado cyan: **Hoy**, **Agenda**, **Pacientes**, **Alertas** (contador rojo). Contenido de ancho máx. 800px.
- **Hoy:** saludo por hora ("Buen día" / "Buenas tardes" / "Buenas noches"), fecha larga, cantidad de turnos; botón "Recordatorios" (vista previa del próximo resumen; "Se envía solo el día 25 a las 10:00"; envío manual solo si el automático del mes no salió, con la misma `dedupe_key`). 4 StatCards con drilldown en modal: Turnos hoy, Pacientes activos (A–Z con plan, día, hora y honorario), Total del mes (ARS y cantidad de sesiones, extras incluidas), Cancelados. v1.1: filtros día/semana/quincena/mes. Día 25: tarjeta "N pacientes sin avisos: enviarles el resumen" con un botón de WhatsApp por paciente. Lista "Turnos de hoy" con `ApptRow`; vacío "No tenés turnos hoy".
- **ApptRow:** borde izquierdo con el color del plan, reloj, nombre, hora, badge del plan o "Extra", honorario en `--success-text`; acciones: ver portal (ojo), mover, cancelar (X), marcar realizado/ausente.
- **Agenda:** navegación por semanas, tira de días (botones de 50px con día abreviado, número y punto si hay turnos; hoy resaltado; seleccionado con gradiente), lista del día con huecos libres tocables, "Agregar turno", "Bloquear" (danger), feriados con nombre y estado de la pregunta. Vacío "Sin turnos este día".
- **Pacientes:** "Nuevo", "Pegar lista", "Enviar accesos pendientes"; búsqueda "Buscar por apellido...", filtro "Sesiones por mes", orden (Apellido A–Z por defecto, Mayor honorario, Menor honorario), contador. Tarjeta: ícono con color del plan, "Apellido, Nombre", horarios fijos, badge del plan, badge "Tutor", honorario, estado del acceso ("Sin enviar" → "Enviado" → "Abrió el link" → "Avisos activos", reemplaza al "Push ON/OFF") y acciones Portal, Editar, Avisar. Ficha: horarios fijos con "Cambiar sesiones por mes" y "Cambiar día y hora" ("A partir del [fecha]"), "Agregar sesión extra", dispositivos con acceso y "Quitar acceso", "Reenviar acceso", "Mostrar QR", "Vincular un dispositivo", "Dar de baja", "Eliminar definitivamente".
- **Pegar lista:** cuadro de texto, una línea por paciente: "Apellido, Nombre; celular; día; hora; sesiones por mes; honorario" (separadores coma, punto y coma o tabulador; día "lunes" o "lun"; sesiones por mes y honorario opcionales). Tabla de revisión editable con errores y choques en rojo; nada se crea hasta "Crear N pacientes". Parser con ≥ 20 formatos reales en tests.
- **Enviar accesos pendientes:** flujo en serie con el próximo paciente "Sin enviar", botón grande "Enviar por WhatsApp" y "Siguiente".
- **Alertas** (título "Alertas"): cancelaciones, fallos de entrega con "Avisar por WhatsApp", preguntas de feriados, dispositivos vinculados, conflictos de agenda, cambios de teléfono; leídas/no leídas; detalle expandible; "Enviar aviso" a todos o a uno (texto libre con límite y advertencia "No incluyas información clínica"). En vivo con la app abierta (refetch al volver o Realtime con RLS).
- **Configuración:** datos del consultorio y "Cómo te ven tus pacientes", horario de atención por día, duración, honorario por defecto, anticipación mínima para cancelar, avisos a pacientes (día anterior a las 19:00: sí; antes de la sesión: 1 hora; opciones no/15/30/60/120 min), "Mostrar mi nombre en los avisos" (apagado), feriados (§3.8), alias o CBU opcional para el resumen, dispositivos con avisos, "Cómo usar TURNAPP".
- **Onboarding (primer ingreso):** definir contraseña → una pantalla, todo precargado salvo lo marcado: "Cómo te ven tus pacientes"*, tu celular* (define el código de área por defecto), horario (lunes a viernes de 9:00 a 19:00, con "Horarios distintos por día"), duración 50 min, honorario por defecto*, modalidad y dirección opcionales, avisos a pacientes, casilla "Leí y acepto los Términos y la Política de Privacidad" (con links; registra fecha y versión) → "Activar avisos en este dispositivo" con guía por plataforma (en iPhone también tiene que agregar la app a inicio y volver a ingresar ahí) → panel vacío con "Cargar mis pacientes".

### 4.6 Portal del paciente
Header con gradiente cyan: "TURNAPP", nombre del consultorio y dirección (si el profesional los cargó), nombre del paciente, teléfono con "Editar", control "Letra más grande". Tres mini-stats: "Turnos", "Por sesión", "Total de {mes}". Cuerpo de ancho máx. 440px: toggle "Lista" / "Calendario", navegación de meses. Lista: tarjeta por turno con cuadrado de fecha, día completo, "10:00 · $ 8.500", "Cancelar" (si falta menos que la anticipación mínima: texto explicativo y "Escribirle por WhatsApp"). Calendario: grilla de 7 columnas (D L M X J V S) con días resaltados. Leyenda "Tus turnos ya están confirmados. Si no podés venir, cancelá con al menos 24 horas de anticipación." (14px+, `--text-3`, sin itálica; con el valor configurado). Además: aviso de privacidad la primera vez ("Entendido", registra fecha y versión), bloque "Activá los avisos" con la guía (§7.3), "Agregar a mi calendario" (§7.6), "Avisos discretos", "Escribirle a mi profesional", "Salir de este dispositivo". Vista previa del profesional: misma pantalla en solo lectura vía `profesional_vista_portal(paciente_id)`, con "Volver al panel".

### 4.7 Panel Super Admin (fondo violeta oscuro)
Header con escudo, "TURNAPP", badge "Super Admin", "Salir". Tabs (inactivas con `--admin-tab-inactive`): **Profesionales** (piloto: "Crear profesional", lista con estado Invitado/Activo/Suspendido y fecha, "Reenviar invitación", "Suspender"/"Reactivar"), **Dashboard** (v1.1: profesionales, pacientes, avisos; sin datos de pacientes) y **Plataforma** (v1.1: base responde, último ping, último vaciado de cola, último job de horizonte, cola, consumo vs. límites gratuitos, versión desplegada, feriados cargados, embudo de instalación). "Ver resumen" de un profesional: solo números de soporte (activos, accesos sin enviar/enviados/abiertos, con avisos activos, envíos de 7 días entregados/fallidos con código agregado, último ingreso).

### 4.8 Textos: glosario y plantillas
Glosario: "avisos", nunca "push" ni "notificaciones push"; "Activar avisos", "Avisos activos", "Avisar al paciente", "Enviar aviso"; el botón "Push" de la tarjeta pasa a "Avisar"; "Alertas" se mantiene. "Sesiones por mes", "Sesión extra", "Horario fijo".
Reglas de avisos al paciente: sin emojis; sin abreviaturas de días ni meses; hora "10:00"; montos con `Intl` es-AR sin decimales ("$ 8.500"); título ≤ 40 caracteres; cuerpo ≤ 120 (si no entra, versión corta + "Tocá para ver las fechas"); nunca especialidad, diagnóstico, notas, nombre o título del profesional (salvo que active "Mostrar mi nombre en los avisos"), nombre del consultorio, ni las palabras "terapia", "psicólogo/a", "psicología", "psiquiatra", "psiquiatría" o "sesión" (en avisos se dice "turno"); con tutor: "Turno de {nombre del paciente}". Al tocarlo, abre la pantalla exacta del turno.
| Evento | Título | Cuerpo (sin nombre del profesional por defecto) |
|---|---|---|
| Día 25 | Tus turnos de diciembre | Martes 2, 9, 16 y 23 a las 10:00. Por turno $ 8.500. Total $ 34.000. |
| Día anterior | Mañana tenés turno | Martes 2 de diciembre a las 10:00. Si no podés ir, avisá desde la app. |
| Pre-sesión | Tu turno es en 1 hora | Hoy a las 10:00. (Online: "Tocá para entrar a la videollamada.") |
| Cancelación del profesional | Turno cancelado | Se canceló tu turno del martes 2 de diciembre a las 10:00. Te van a escribir para reprogramar. |
| Bloqueo por rango | No hay turnos esos días | Del 2 al 15 de enero no hay turnos. Retomamos el martes 16 de enero a las 10:00. |
| Cambio de plan, horario u honorario | Cambió tu turno | Desde el martes 9 de diciembre: cada 2 semanas a las 11:00. Tocá para ver tus fechas. |
| Turno movido | Tu turno cambió de día | Tu turno del martes 2 pasa al jueves 4 de diciembre a las 18:00. |
| Feriado sin consultorio | Cambió tu turno | El lunes 24 de marzo no hay turno (feriado). Retomamos el lunes 31 a las 10:00. |
"Avisos discretos" (opción del paciente): cuerpo "Tenés una novedad en TURNAPP" y el detalle al abrir. Avisos al profesional (su pantalla puede verla otra persona): título "Cancelación", cuerpo "García, A. canceló el martes 2/12 10:00"; el resto en Alertas.
Portal: menos de la anticipación: "Faltan menos de 24 horas y ya no se puede cancelar desde acá. Escribile a tu profesional." + "Escribirle por WhatsApp" ("Hola, soy {paciente}. No voy a poder ir al turno del {día} a las {hora}."). Editar teléfono: "Tu profesional va a ver el número nuevo." Link inválido: "Este link ya no funciona. Pedile uno nuevo a tu profesional."
WhatsApp prearmados (sin emojis, con voseo, el link como única URL): acceso "Hola {nombre}, soy {nombre visible del profesional}. Desde este link vas a ver tus turnos y vas a poder recibir avisos en el celular: {link}. No hace falta crear usuario ni contraseña."; invitación al profesional "Hola {nombre}, te creé tu cuenta en TURNAPP. Entrá desde este link para elegir tu contraseña: {link}. El link vence el {fecha y hora}."

### 4.9 Bugs del prototipo que no se migran
`genAppts` por "semana del mes" con intervalos irregulares (reemplazado por §3.6); `Patient` usa `patients[0]` si no encuentra el id (sin acceso válido no se muestra nada); el modal de bloqueo cuenta el día seleccionado; `activePatients.sort` muta estado; `Btn` ignora `style`; `ApptRow` dentro de `Professional`; `pt.push` inexistente; alta solo lunes a viernes y horas en punto (usar el horario del profesional y pasos de 15 minutos); honorario con `parseInt` sin validación; `defaultValue="demo1234"` y datos precargados en el login.

### 4.10 Accesibilidad (sin cambiar la estética)
Foco visible de 2–3px (WCAG 2.2 Focus Appearance) en vez de `outline: none`; textos con tokens `-text`; mínimo 12px en el panel y 16px en el portal; `aria-label` en botones de ícono; modales con foco atrapado, Escape, `role="dialog"` y `aria-modal`; `role="tablist"`; objetivos ≥ 44px (portal ≥ 48px); tamaños en rem; zoom 200 % en 360px sin scroll horizontal (WCAG 1.4.4 y 1.4.10).

### 4.11 Referencia visual y vitrina
En la Fase 1b montá el prototipo en una entrada de Vite solo de desarrollo (`npm run prototipo`, nunca en `dist/`) y sacá capturas de referencia de cada pantalla y modal en 360 y 1280 px en `docs/prototipo/capturas/`. Cada PR de UI adjunta capturas nuevas al lado; la comparación es visual, no pixel a pixel; los cambios a propósito se listan. Las previews del hosting no tienen base (§5.6): para que Martín valide pantallas, el build de preview incluye la **vitrina** `/vitrina/*` (`src/dev/`, con fixtures ficticios y guardado simulado, banner "Vista previa con datos de ejemplo"), excluida del build de producción por una condición de build y verificada por un test que busca `vitrina` en `dist/`.

## 5. Plataforma y despliegue

### 5.1 Hosting y dominio propio (decisión de Martín: dominio propio SÍ)
- El dominio es la única excepción aprobada al costo $0. El origen de una PWA no se puede cambiar sin perder instalaciones, suscripciones y tokens guardados: el origen definitivo queda en producción ANTES de la Fase 5 y antes de que cualquier paciente (o Martín en M-11) instale la app o active avisos.
- En la Fase 0 verificá y presentale a Martín, con precio vigente `[VERIFICAR]`: (a) `.com.ar` en NIC Argentina (requisitos: CUIT/CUIL, Clave Fiscal y nivel `[VERIFICAR]`, costo anual, renovación, cómo delegar DNS); (b) `.com` u otra extensión en un registrador a precio de costo (por ejemplo Cloudflare Registrar: requiere tarjeta y cobra en USD `[VERIFICAR]`); (c) disponibilidad de 3 nombres (por ejemplo `turnapp.com.ar`, `turnapp.ar`, `turnappsalud.com.ar`). Recomendá uno con precio, requisitos y pasos exactos de compra (M-06).
- Origen de la app: `https://app.<dominio>` (fijo para siempre). El dominio raíz redirige a `app.` y queda libre para un sitio comercial futuro sin tocar la PWA.
- Hosting: sitio estático agnóstico (SPA con rewrites y headers). Opción por defecto `[VERIFICAR]`: Cloudflare Workers con assets estáticos (sin código de Worker; `wrangler.jsonc` con `not_found_handling: "single-page-application"`; headers en `public/_headers`), plan gratuito que no restringe uso comercial (verificá el acuerdo vigente), dominio en Cloudflare DNS, previews por rama desde GitHub. Vercel Hobby prohíbe uso comercial `[VERIFICAR]`: se usa solo hasta la migración (Fase 1c). Si la verificación contradice, compará Netlify y otros y elegí el que permita uso comercial gratis con dominio propio; anotalo.
- El origen definitivo se usa en: Site URL y Redirect URLs de Auth, CORS de Edge Functions, `connect-src` de la CSP, `sub` del JWT VAPID, links de acceso, QR y feeds `.ics`. Fase 8: grep + e2e de que nada apunta a un origen anterior.
- Si alguna vez hay que cambiar de origen con pacientes instalados: el viejo sigue sirviendo el mismo service worker y una pantalla "TURNAPP se mudó: tocá acá" durante al menos 90 días (con aprobación de Martín).

### 5.2 Supabase y entornos
- Producción: `hszobstcatbyzijbdnpv`. Desarrollo y CI: stack local (`npx supabase start`) con `supabase/seed.sql` ficticio (3 profesionales, 60 pacientes, todas las opciones de sesiones por mes).
- Docker: en el Arranque probá `docker run --rm hello-world` (antes `sudo dockerd > /tmp/dockerd.log 2>&1 &`) y anotalo en PROGRESO.md. Si no funciona: la evidencia válida pasa a ser el CI (link del run verde del HEAD); si hay PostgreSQL nativo, iterá con `supabase/tests/_shim.sql` (roles `anon`/`authenticated`/`service_role`, esquema `auth`, `auth.uid()`/`auth.jwt()` desde `request.jwt.claims`), nunca como evidencia final. Probá también `npx supabase --version`; si la descarga del binario falla, plan B: imagen Docker oficial con tag exacto.
- Acceso de la sesión a producción: solo `POST https://api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/database/query/read-only` con cuerpo `{"query":"..."}` (corre como `supabase_read_only_user`, exige nombres calificados con esquema). El token de alcance "Database: Read" lo agrega el entorno (network secret): no lo pidas, no lo busques, no lo imprimas. Si responde 401/403, plan B: M-04. La guarda bloquea todo lo demás.
- Pausa del plan gratuito `[VERIFICAR]` (~7 días sin actividad): workflow programado diario que llama a `ping()` (pública, no devuelve datos) y falla visible si la base no responde. Si el repo es público, GitHub desactiva los workflows programados tras 60 días sin actividad `[VERIFICAR]`: el mismo workflow abre o actualiza cada 45 días un issue "Mantenimiento: TURNAPP necesita un commit". `docs/MANUAL-OPERACION.md` explica qué hacer con el email de pausa ("Resume project"). Plataforma muestra "Último ping OK" y "Último vaciado de cola OK" (rojo si > 10 min).
- Backups: verificá qué incluye el plan gratuito `[VERIFICAR]`. Antes del primer paciente real, presentale a Martín la decisión (plan pago con backups diarios, o dump cifrado con `age` con clave pública cuya privada tiene solo Martín, guardado fuera de GitHub). Ningún dato de paciente sin cifrar en ningún lado, nunca en GitHub ni en artifacts.

### 5.3 Visibilidad del repo, protección de `main` y modo de despliegue (decisión de Martín: detectarlo solo)
En el Arranque, solo con lecturas:
1. `gh api repos/Consciousnessebooks/turnapp --jq '{private, visibility, owner: .owner.login, owner_type: .owner.type, default_branch}'`.
2. `gh api repos/Consciousnessebooks/turnapp/branches/main/protection` y `gh api repos/Consciousnessebooks/turnapp/rulesets`: 404 "Branch not protected" = disponible y sin activar; 403 con "Upgrade to GitHub Pro or make this repository public" = no disponible en el plan.
3. `gh api repos/Consciousnessebooks/turnapp/environments`: lista entornos; en privado gratuito los secretos de entorno no existen `[VERIFICAR]`.
4. Probá que podés pushear `.github/workflows/` (rama `prueba-workflows` con un archivo inofensivo; después pedile a Martín que la borre o dejala documentada: vos no podés borrar ramas remotas). Si se rechaza: los workflows van a `docs/ci/<nombre>.yml` y Martín los crea con "Add file" → "Create new file" (pasos exactos en el pedido).
Anotá el resultado en PROGRESO.md y DECISIONES.md y aplicá:
| Caso | Protección de `main` | Modo de despliegue |
|---|---|---|
| Público, o privado con plan pago | M-14 variante A: ruleset `proteger-main` (bloquea force push y borrado, exige PR; después, el check `ci`) | **Modo A (automático):** entorno `produccion` con "Deployment branches" = solo `main`; secretos de Supabase como secretos de ESE entorno, nunca de repositorio (M-05); `deploy-produccion.yml` corre solo en push a `main` |
| Privado en plan gratuito | M-14 variante B: no se puede; la guarda es la barrera; le explicás la opción de hacerlo público (gratis: habilita protección, entornos y minutos ilimitados de Actions; el código queda visible, el repo no tiene secretos ni datos) | **Modo M (manual) mientras Martín no decida otra cosa:** sin secretos de producción en GitHub. Cada cambio de base: SQL consolidado y probado en CI en `supabase/manual/AAAA-MM-DD-<tema>.sql` que Martín pega en el SQL Editor ANTES de mergear (M-18). Edge Functions y secretos: integración oficial de Supabase con GitHub solo si verificás que en el plan gratuito despliega desde `main` sin guardar secretos en GitHub `[VERIFICAR]`; si no, editor de Edge Functions del dashboard con checklist |
Reglas comunes: ningún workflow fuera de `deploy-produccion.yml` y `bootstrap-secretos.yml` referencia `secrets.SUPABASE_*` (paso de CI con `grep`); crear o cambiar esos dos archivos lleva "DEPLOY" en el título del PR; `concurrency: { group: deploy-produccion, cancel-in-progress: false }`; `permissions: { contents: read }`; actions de terceros fijadas por SHA con el tag en comentario. "Required reviewers" en el entorno: no se usa (el merge de Martín ya es la aprobación y la regla de rama impide usar los secretos desde otra rama).

### 5.4 Orden de deploy, freno de migraciones, respaldo y rollback
- La base va antes que el frontend. Modo A: el auto-deploy de `main` del hosting se desactiva `[VERIFICAR]` y `deploy-produccion.yml` publica el frontend (wrangler o deploy hook, secreto del entorno `produccion`) solo si `supabase db push` y `supabase functions deploy` terminaron bien. Modo M: Martín aplica el SQL, vos verificás con la consulta de solo lectura que quedó aplicado, y recién ahí pedís el merge.
- Freno (job `migraciones` del CI en todo PR que toque `supabase/`): lista exacta de migraciones a aplicar (`supabase db push --dry-run` contra producción solo en modo A, desde el workflow con secretos del entorno; en modo M, diff contra la introspección); falla si una migración nueva contiene `drop table`, `drop column`, `drop schema`, `truncate`, `delete from` o `alter table ... drop` sin `-- APROBADO-POR-MARTIN: AAAA-MM-DD PR #n` en la primera línea y su cita en DECISIONES.md. El PR explica en una línea qué cambia en la base.
- Respaldo antes de migrar: sin datos reales, el workflow guarda `supabase db dump --schema-only` como artifact (7 días). Con datos reales, la decisión de §5.2.
- Réplica: en Fase 0 guardá `supabase/tests/fixtures/esquema-produccion.sql` (solo estructura); CI aplica encima las migraciones nuevas.
- Rollback: toda migración no aditiva trae `supabase/rollback/<versión>.sql` probado en CI (aplicar → revertir → aplicar). Por defecto se corrige hacia adelante; el rollback se usa con un "sí" de Martín.
- `supabase migration repair` (si la estrategia es adoptar) nunca en el deploy automático: workflow aparte `baseline-produccion.yml` (`workflow_dispatch`) que Martín dispara una vez con un botón.
- Estrategia de base (Fase 0): si el conteo exacto confirma que no hay pacientes reales (Martín lo confirma por escrito), la recomendación por defecto es **reconstruir** el esquema `public` en el mismo proyecto (los usuarios de Auth se conservan), porque adoptar arrastra grants, políticas y funciones inseguras. Empieza con `drop` explícito de cada objeto listado en el diagnóstico (nunca `drop schema public cascade`) y requiere el "Reconstruir" escrito de Martín.

### 5.5 Claves
- Frontend: la clave publishable (o anon) en `VITE_SUPABASE_ANON_KEY`; la URL en `VITE_SUPABASE_URL`. Edge Functions: el nombre de la variable de la clave secreta después de la rotación `[VERIFICAR]` (`SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY` u otra).
- La rotación la hizo Martín antes de empezar (guía). Vos verificás en Fase 0, sin ver claves: el bundle de producción no contiene ningún JWT con `role` distinto de `anon`; `cron.job`, triggers, webhooks y funciones no tienen claves embebidas (si las hay, quedaron inválidas y se migran a la clave nueva con header `apikey`); Martín confirma con una captura que las claves legacy figuran deshabilitadas y el secreto JWT legacy revocado. Si algo falta, el pedido M-03 con los pasos de la guía, y la Fase 2 no se mergea sin eso.
- `gitleaks detect --source . --log-opts="--all" --redact` sobre todo el historial: cualquier clave o contraseña en el historial se considera filtrada aunque se borre el commit (reportá archivo, commit y tipo, nunca el valor).

### 5.6 Previews
Las previews NO se conectan a producción: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` solo para el entorno de producción del hosting. La preview muestra "Vista previa sin base de datos" y la vitrina (§4.11). Si Martín tiene libre un segundo proyecto gratuito de Supabase, podés proponer `turnapp-staging` con datos ficticios. Si una preview responde 401/403 (protección del hosting), no la uses para pruebas automáticas: la verificación funcional es local y Martín la abre logueado. El login y los avisos se prueban en producción después del merge.

### 5.7 Configuración de Auth como código
En modo A: Site URL, Redirect URLs exactas, registro deshabilitado, vencimiento de links, plantillas de email en español y SMTP en `supabase/config.toml`, aplicados por el workflow (`supabase config push` u otro `[VERIFICAR]` qué campos soporta) con la contraseña SMTP como secreto del entorno. En modo M, o para lo que la CLI no soporte: M-07 con clics exactos.

## 6. Seguridad, autenticación y datos

### 6.1 Autenticación y roles
- Email y contraseña para profesionales y Super Admin; registro público deshabilitado; recuperación de contraseña funcionando (`/auth/callback`, `/auth/nueva-clave`); política: mínimo 12 caracteres, letras y dígitos, protección de contraseñas filtradas si el plan la tiene `[VERIFICAR]`.
- Rol solo desde la base: `es_super_admin()` = fila en `public.super_admin` con `user_id = auth.uid()` y `(select auth.jwt() ->> 'aal') = 'aal2'`; `profesional_actual_id()` = `id` de `profesionales` con `user_id = auth.uid()` y `activo = true`. Ambas `security definer`, `stable`, `set search_path = ''`, en el esquema `interno`. Prohibido autorizar con `user_metadata`/`raw_user_meta_data`; `app_metadata` solo como caché. El frontend llama `mi_rol()` y enruta a `/admin` o `/panel/hoy`.
- MFA TOTP del Super Admin obligatorio en el servidor desde la Fase 3: toda `admin_*` e `invitar-profesional` fallan con `aal1`; sin factor enrolado, la única acción posible es enrolarlo (M-09). Antes de activarlo, `docs/MANUAL-OPERACION.md` tiene el procedimiento verificado para quitar un factor desde el dashboard si Martín pierde el celular `[VERIFICAR]`, y le sugerís un segundo autenticador. Test pgTAP: JWT de Super Admin con `aal1` → `admin_*` rechazadas.
- Suspender (`admin_suspender_profesional`): `activo = false`, `admin_log`, cierre de sesiones (`auth.admin.signOut(user_id, 'global')` o el vigente `[VERIFICAR]`), suscripciones desactivadas y sin avisos encolados para su consultorio. Toda Edge Function que actúa por un profesional vuelve a consultar `profesional_actual_id()` con el JWT del llamador.
- Invitación: Edge Function `invitar-profesional` (JWT + `es_super_admin()` con `aal2`; crea la fila con plan Fundador; invita con la API admin de Auth y `redirectTo` exacto; `admin_log`). Devuelve siempre el link de invitación para "Copiar link" y "Enviar por WhatsApp"; muestra el vencimiento real `[VERIFICAR]`. Verificá que funcione con el registro deshabilitado.
- Primer ingreso: §4.5 Onboarding. Cambiar contraseña cierra sesión en todos los dispositivos.

### 6.2 Acceso del paciente (sin contraseña)
- **Link:** al dar de alta, la base genera 32 bytes aleatorios (`extensions.gen_random_bytes`), base64url, y guarda solo el SHA-256 en `paciente_accesos(id, paciente_id, profesional_id, token_hash, origen /*link|dispositivo|ics*/, creado, revocado, ultimo_uso)`. El token se muestra una vez dentro de `https://app.<dominio>/p#t=<token>` (en el fragmento, no viaja en requests ni en el Referer). El link sirve para vincular dispositivos nuevos durante 30 días; después, "Reenviar acceso".
- **Canje a dispositivo:** al abrir el link, `portal_canjear_link(token_link)` devuelve un token de dispositivo propio (`origen = 'dispositivo'`) que se guarda en `localStorage` (lista de tokens, uno por profesional: con más de uno, pantalla "Tus profesionales"). Máximo 5 accesos de dispositivo activos por paciente (al sexto se revoca el de `ultimo_uso` más viejo). Sin uso por 180 días: revocación automática. Después de guardar, `navigator.storage.persist()` si existe.
- **Fragmento:** no se borra mientras la página no esté instalada (`display-mode: standalone`), así el token viaja si el paciente pasa del navegador de WhatsApp a Safari o Chrome; instalado, y con el token guardado, se limpia con `history.replaceState`.
- **iPhone, traspaso a la app instalada:** iOS/iPadOS 17.2+ copia las cookies de Safari a la app al tocar "Agregar a inicio"; `localStorage` no `[VERIFICAR]`. Cuando el portal en Safari muestra la guía de instalación, pide un token de traspaso de un solo uso (32 bytes, 30 minutos, solo hash) y lo guarda en la cookie `tp_handoff` (`Secure; SameSite=Strict; Path=/; Max-Age=1800`). La app instalada, sin token, la lee, la canjea por un acceso de dispositivo y la borra. Además verificá en un iPhone real (M-11a) si "Agregar a inicio" conserva la URL con el fragmento y si se puede agregar desde el navegador interno de WhatsApp; si conserva el fragmento, ese es el camino principal.
- **Respaldo: vinculación inversa** (si no hay cookie ni fragmento): la app instalada genera un secreto de 32 bytes, llama a `vinculacion-iniciar` (guarda `sha256(secreto)`) y muestra un **código de vinculación de 8 caracteres** del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, formato `ABCD-EFGH`, válido 10 minutos, con botón "Copiar código". En Safari (con token válido), "Vincular mi app" → "Pegar código" → `portal_aprobar_vinculacion(token, codigo)`. La app consulta cada 3 s `vinculacion-canjear(secreto)` y recibe un token de dispositivo de un solo uso. El profesional también puede aprobar el código desde la ficha ("Vincular un dispositivo") en el consultorio. Adivinar un código no da acceso a datos. Límites: global de aprobaciones fallidas (50 por hora en toda la plataforma; al superarlo se cierra 15 minutos) y por IP (10 por hora, IP guardada como `hmac(ip, pepper)` y borrada a las 24 h; header de IP según la doc vigente `[VERIFICAR]`). Cada vinculación genera la alerta "Se vinculó un dispositivo nuevo a {Apellido}".
- **Compartir el acceso:** hoja con "Enviar por WhatsApp" (`https://wa.me/<celular E.164 sin +>?text=<mensaje §4.8>`, abre directo el chat; con tutor, al celular del tutor y nombrando al paciente), "Mostrar QR" (pantalla completa, para escanear en la sesión con la cámara: abre el navegador real) y "Copiar link". Camino recomendado para mayores: alta acompañada en el consultorio con QR.
- **Celulares:** `normalizarCelularAR(texto, codigoAreaDefault)` convierte "11-4521-8832", "011 15 4521-8832", "15 4521 8832", "+54 9 11 4521 8832", "0223 15 412-3456" a E.164 de celular (`+5491145218832`); se muestra "11 4521-8832"; código de área por defecto del celular del profesional (si no, 11); si no se puede interpretar, aviso sin bloquear el guardado.
- **Portal:** solo funciones `portal_*` (`security definer`, validan el hash, acceso no revocado, paciente y profesional activos, devuelven solo ese paciente, errores genéricos), siempre por POST (nunca `rpc(..., { get: true })`). `anon` sin acceso a tablas. Funciones: `portal_ver`, `portal_cancelar` (anticipación en el servidor), `portal_editar_telefono`, `portal_guardar_suscripcion`, `portal_confirmar_recepcion`, `portal_registrar_privacidad`, `portal_aprobar_vinculacion`, `portal_salir` (revoca ese acceso), y en v1.1 `portal_aceptar_alternativa`.
- **Reenviar acceso:** revoca todos los accesos del paciente (link, dispositivos e `ics`) y sus suscripciones en la misma transacción, y crea un link nuevo. La UI: "El link anterior y las apps vinculadas dejan de funcionar".
- **Cambio de teléfono desde el portal:** guarda `telefono_anterior` con fecha, alerta al profesional ("{Apellido} cambió su teléfono de … a …") y durante 7 días "Reenviar acceso" advierte "El teléfono se cambió desde el portal hace N días; confirmá con el paciente antes de enviar".
- **Vista previa del profesional:** `profesional_vista_portal(paciente_id)`, protegida por RLS, solo lectura; nunca usa ni regenera tokens.

### 6.3 Modelo, RLS y grants
- Tablas (reconciliá con lo existente): `profesionales`, `horarios_atencion`, `pacientes`, `paciente_notas`, `recurrencias`, `turnos`, `turnos_eventos`, `bloqueos`, `feriados`, `respuestas_feriado`, `conflictos_agenda`, `paciente_accesos`, `vinculaciones_pendientes`, `intentos_vinculacion`, `suscripciones_push`, `notificaciones`, `push_log`, `alertas`, `admin_log`, `aceptaciones_legales`, `metricas_web` (Final). Las existentes sin uso (`pagos`, `codigos_referido`, `lista_espera`): RLS habilitado, sin políticas, `revoke all` a `anon` y `authenticated`.
- Integridad de tenant: `pacientes unique (id, profesional_id)`; toda tabla hija lleva `profesional_id` y `foreign key (paciente_id, profesional_id) references public.pacientes (id, profesional_id)`; `alternativas_ofrecidas` (v1.1) también `(turno_id, profesional_id)`.
- Columnas protegidas: `revoke update on public.profesionales from authenticated; grant update (nombre, apellido, especialidad, telefono, direccion, duracion, honorario, ...) on public.profesionales to authenticated;` (ajustado a las columnas reales). `plan`, `limite`, `activo`, `user_id`, `email`, `zona_horaria` solo por `admin_*` o la Edge Function. `pacientes.profesional_id`, `turnos.profesional_id/paciente_id`, honorarios de turnos pasados y `token_hash` nunca por `update` directo. pgTAP: un caso por columna protegida (42501).
- Grants: primera migración de seguridad `revoke all on all tables in schema public from anon; revoke all on all sequences in schema public from anon; alter default privileges in schema public revoke all on tables from anon; alter default privileges in schema public revoke all on sequences from anon; alter default privileges in schema public revoke execute on functions from public, anon;` (verificá el rol dueño y usá `for role`). A `authenticated`, por tabla, solo lo que la app usa. Auxiliares, triggers y generadores en el esquema `interno`, no expuesto por la API `[VERIFICAR]` "Exposed schemas".
- Vistas: `security_invoker = true` o reemplazadas por funciones (`v_admin_dashboard`, `v_turnos_hoy`).
- `admin_log` y `turnos_eventos` de solo inserción (`revoke update, delete, truncate`), escritos solo por funciones; `admin_log` sin datos de pacientes.
- Límite del plan: trigger `before insert or update of activo` en `pacientes` que bloquea la fila del profesional (`for update`), cuenta activos y lanza `limite_plan` ("Llegaste al máximo de pacientes de tu plan"). Test con dos sesiones concurrentes: exactamente una falla.
- Test de catálogo `supabase/tests/000_catalogo_seguridad.test.sql`, corre primero y no se saltea; falla si: tabla de `public` sin RLS; privilegio de tabla para `anon`; función `security definer` sin `search_path`; función de `public` ejecutable por `anon` fuera de `portal_*`, `ping` y `vinculacion_*`; vista sin `security_invoker`; tabla con `paciente_id` o `profesional_id` sin política para cada comando concedido; tabla en la publicación `supabase_realtime` fuera de la lista blanca de DECISIONES.md. CI corre además `npx supabase db lint --level warning` y el Security Advisor si hay comando `[VERIFICAR]`.
- pgTAP simula roles con `set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated","aal":"aal1"}';` (`aal2` para el Super Admin). Helpers propios en `supabase/tests/_helpers.sql` (o `basejump-supabase_test_helpers` si verificás que se mantiene).

### 6.4 Edge Functions: autenticación por función
Cada una declara `verify_jwt` explícito en `supabase/config.toml` y usa el wrapper oficial vigente `[VERIFICAR]` (https://supabase.com/docs/guides/functions/auth):
| Función | `verify_jwt` | Quién llama | Verificación |
|---|---|---|---|
| `invitar-profesional` | true | Super Admin | JWT + `es_super_admin()` con `aal2` |
| `push-config` | false | cualquiera | ninguna; devuelve solo la clave pública VAPID |
| `enviar-push` | false | pg_cron/pg_net | `CRON_SECRET` en header, comparación en tiempo constante; no recibe parámetros |
| `vinculacion-iniciar`, `vinculacion-canjear`, `portal-traspaso` | false | anon | límites §6.2; delegan en funciones SQL |
| `calendario` | false | apps de calendario | token `ics` validado por `portal_ics(token)` |
Reglas: el cliente con clave secreta solo para lo que lo requiere (crear usuarios, leer la cola); datos de pacientes siempre vía funciones SQL con la clave publishable; nunca `error.message` de Postgres ni stack traces al cliente (respuesta genérica en español + `codigo_error` para buscar en logs); nunca `console.log` de cuerpos, headers, URLs con tokens, teléfonos, emails ni endpoints. CORS: lista exacta (origen de producción; `http://localhost:5173` y `:4173` solo con `SUPABASE_ENV=local`); `invitar-profesional` solo producción. Dependencias Deno con versión exacta (`npm:x@1.2.3` o `jsr:@a/b@1.2.3`) y `deno.lock` versionado.

### 6.5 Retención, supresión y privacidad (Ley 25.326 y 26.529; a validar por un abogado)
- Rol legal: el profesional es responsable de su base; TURNAPP es encargado del tratamiento (art. 25). Los Términos del profesional incluyen las cláusulas de encargo (finalidad, confidencialidad, seguridad, subencargados con región: Supabase, hosting, servicios push; devolución o destrucción al terminar).
- Notas: "Notas administrativas" en la tabla `paciente_notas` (solo el profesional dueño; nunca en `portal_*`, `admin_*`, exportaciones ni avisos; máximo 500 caracteres) con la ayuda "Solo para vos. No escribas acá información clínica." Notas clínicas: backlog con análisis legal.
- Baja = `activo = false` + cancelación de turnos futuros + borrado de suscripciones. "Eliminar definitivamente": confirmación fuerte, advertencia de posible obligación de conservar registros (Ley 26.529) y oferta de exportar primero; borra en cascada accesos, vinculaciones, suscripciones, `push_log` del paciente, alternativas, notificaciones, notas, eventos y turnos; en `admin_log` queda "paciente eliminado" sin datos. Test: ninguna tabla de `public` conserva el `paciente_id` ni su teléfono.
- Retención (job semanal): notificaciones terminadas 90 días; `push_log` 90 días; accesos y vinculaciones revocados o vencidos 30 días; `conflictos_agenda` resueltos 180 días; `admin_log` 2 años; `cron.job_run_details` 7 días. Profesional que se va: exportación y eliminación de su base a los 30 días de la baja, con aviso previo.
- La Política de Privacidad dice con honestidad que el operador tiene acceso técnico a la infraestructura, que no accede a datos de pacientes salvo soporte pedido por el profesional u obligación legal, que el calendario del teléfono consulta el feed `.ics` si el paciente lo activa, y la región del proyecto Supabase (transferencia internacional).
- Borradores de Términos y Privacidad en `/legal/*` marcados "Borrador — pendiente de revisión legal", aceptación del profesional y aviso al paciente: antes del piloto. Revisión de abogado e inscripción ante la AAIP: M-15.

### 6.6 SMTP (con dominio propio)
El SMTP integrado de Supabase tiene un límite muy bajo y restricciones de destinatarios `[VERIFICAR]`. Decisión: proveedor transaccional con dominio verificado (por ejemplo Resend; verificá plan gratuito y límites `[VERIFICAR]`), remitente `avisos@<dominio>`, registros DNS (SPF, DKIM, DMARC) con pasos exactos para Martín (M-08). Mientras el dominio no esté listo: el link de invitación copiable siempre existe; si hace falta email antes (recuperar la contraseña de Martín), SMTP de Gmail de `turnapp.org@gmail.com` con contraseña de aplicación por el puerto 465. Emails a pacientes: solo con dominio propio y contenido genérico. Las Edge Functions no pueden salir por 25 ni 587 `[VERIFICAR]`: usá 465 o la API HTTP del proveedor.

### 6.7 Super Admin y privacidad
El Super Admin ve agregados vía funciones `admin_*` que devuelven solo números (test que inspecciona respuestas buscando nombres, teléfonos y emails sembrados). No hay "impersonar". Toda acción queda en `admin_log`.

### 6.8 Abuso y límites
Rate limiting de la Data API si el plan lo ofrece `[VERIFICAR]`; si no, las `portal_*` que escriben registran en `interno.limites_portal` (hash del token + minuto) y rechazan más de 20 escrituras por acceso por hora; `portal_guardar_suscripcion` 10 por hora. Errores de cliente: `sanear()` elimina `#t=`, JWT, emails, teléfonos y números de más de 6 dígitos; se registra mensaje, componente, ruta sin fragmento ni query, versión y navegador (test de `sanear()`).

## 7. Frontend, PWA y avisos

### 7.1 Stack y dependencias
- Vite + React + TypeScript estricto (`strict`, `noUncheckedIndexedAccess`; `tsc --noEmit` en CI). React Router: `/`, `/inicio`, `/ingresar`, `/auth/callback`, `/auth/nueva-clave`, `/panel/{hoy,agenda,pacientes,alertas,configuracion}`, `/admin/*`, `/p`, `/legal/{terminos,privacidad}`, `/vitrina/*` (solo preview). TanStack Query, `zod`, tipos generados, `date-fns` v4 + `@date-fns/tz` `[VERIFICAR]` versiones, CSS Modules + `tokens.css`, `@fontsource-variable/dm-sans`, `vite-plugin-pwa` (`injectManifest`).
- Fijado: runtime con `^` como máximo y lockfile; herramientas con versión exacta en devDependencies (`supabase`, `@playwright/test`, `vitest`, `@lhci/cli`, `typescript`, `eslint`, `size-limit`); `supabase/setup-cli` con la misma versión; gitleaks por imagen con tag exacto; navegadores con `npx playwright install --with-deps chromium webkit` de la misma versión; `.nvmrc` (22) y `engines`. Antes de agregar una librería: existe, última versión reciente, licencia. `npm ci --ignore-scripts` donde no hagan falta scripts. Dependabot semanal agrupado para npm y github-actions.
- Headers (en `public/_headers` y, mientras exista, `vercel.json`): CSP sin `unsafe-eval` (`default-src 'self'`; `connect-src 'self' https://hszobstcatbyzijbdnpv.supabase.co wss://hszobstcatbyzijbdnpv.supabase.co`; `img-src 'self' data: blob:`; `worker-src 'self'`; `manifest-src 'self'`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` mínima. Caché: `/sw.js`, `/index.html`, `/` y `/manifest.webmanifest` con `no-cache`; `/assets/*` `public, max-age=31536000, immutable`; el fallback SPA no aplica a `/sw.js`, `/manifest.webmanifest`, `/assets/*`, `/icons/*` (404 si faltan). Test: tipos de contenido correctos en `vite preview` y en la preview.

### 7.2 PWA
- Manifest único generado por vite-plugin-pwa (borrar `public/manifest.json` y `<link rel="manifest">` viejos): `id: "/"`, `name`/`short_name: "TURNAPP"`, `description` en español, `lang: "es-AR"`, `dir: "ltr"`, `start_url: "/inicio?fuente=pwa"`, `scope: "/"`, `display: "standalone"`, `theme_color: "#0891b2"`, `background_color: "#f8fafc"`, `categories: ["medical","productivity"]`; íconos 192/512 `any` y archivos distintos 192/512 `maskable` (zona segura 80 %); `screenshots` (2 de 1080×1920 `narrow`, 1 de 1920×1080 `wide`, con `label` y datos ficticios); `shortcuts` "Hoy" y "Agenda"; `apple-touch-icon` 180 sin transparencia (fondo `#0891b2`); `badge` 96 monocromo. `id`, `scope` y `start_url` no se cambian nunca. Test del manifest.
- `/inicio` (despachador sin UI propia): token de paciente → `/p`; sesión → `mi_rol()` → `/panel/hoy` o `/admin`; nada → "¿Sos paciente? Abrí el link que te mandó tu profesional." con "Vincular esta app" (vinculación inversa) y "Soy profesional: ingresar". Nunca la landing. Test e2e de los tres casos.
- Service worker (desde la Fase 1b, sin avisos; avisos en la Fase 6): precache del shell y de los chunks de `/p` e `/inicio`; el resto con hash, `CacheFirst` al usarse; página offline; nunca intercepta `*.supabase.co` (regla explícita con test). Actualización: `SKIP_WAITING` por mensaje, `registration.update()` al volver a visible y cada 60 min; banner "Hay una versión nueva" con "Actualizar"; si no lo toca, se aplica en el próximo arranque en frío o, en el portal, al volver tras 30 minutos en segundo plano sin formularios abiertos; `version_minima` desde `ping()` fuerza "Actualizando TURNAPP…". Registro sin script inline (`injectRegister: null`, `virtual:pwa-register`).
- Offline: solo el portal persiste, con TanStack Query en IndexedDB, únicamente la respuesta de `portal_ver` (fechas, horas, honorario, consultorio y dirección), `maxAge` 7 días, `buster` = versión. El panel no persiste datos de pacientes fuera de memoria ("Sin conexión: datos de las HH:MM", acciones deshabilitadas). "Salir", "Salir de este dispositivo" y "acceso revocado" borran persistencia, token o sesión y la suscripción de ese dispositivo. Test: después de "Salir", IndexedDB, `localStorage` y `caches` no contienen nombres, teléfonos ni montos.

### 7.3 Activar avisos e instalación guiada
- Clave pública VAPID disponible antes del toque (`VITE_VAPID_PUBLIC_KEY`; `push-config` como respaldo; botón deshabilitado hasta tenerla). Dentro del manejador del clic, ningún `await` de red antes de `Notification.requestPermission()` y `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`; el guardado va después.
- Estados: `default` → "Activar avisos"; `granted` sin suscripción en el servidor → resuscribir en silencio; `denied` → pasos para reactivar (iPhone: "Ajustes → Notificaciones → TURNAPP → Permitir notificaciones"; Android: mantener apretado el ícono → "Información de la app" → "Notificaciones") y plan B. Resincronización al abrir y en `visibilitychange` (actualiza `ultimo_visto`); `pushsubscriptionchange` como complemento.
- Guía por plataforma detectada (un camino por pantalla, texto ≥ 16 px, capturas reales en español, "Ya lo hice"): ya instalada → "Activar avisos"; iOS < 16.4 → "Tu iPhone no permite avisos de apps web" → calendario (§7.6); iOS ≥ 16.4 en Safari → pasos para iOS 16–18 (Compartir abajo) e iOS 26 ("⋯" → "Compartir" → "Agregar a inicio" → "Abrir como app web" → "Agregar") `[VERIFICAR]`; iOS en Chrome/Edge/Firefox → mismos pasos desde su Compartir o "Copiar link" + "Abrilo en Safari"; navegador interno de otra app → "Tocá ⋯ y elegí Abrir en el navegador" + "Copiar link" (si la verificación M-11a muestra que WhatsApp permite agregar a inicio, se quita ese paso); Android con `beforeinstallprompt` → "Instalar TURNAPP"; Android sin él → pasos manuales del menú; escritorio → ícono de instalación de Chrome/Edge.
- Android: activar avisos sin instalar está permitido (un paso menos para mayores), pero Chrome revoca permisos de sitios con poca interacción y no de apps instaladas `[VERIFICAR]`: el portal sigue sugiriendo "Instalá TURNAPP para no perder los avisos" y la resincronización detecta la pérdida y la marca en el panel. Primero verificá que Chrome Android reciba avisos sin instalar y si los permisos funcionan dentro del navegador de WhatsApp; si no funcionan, el primer paso es "Abrir en Chrome".
- El profesional también instala y activa avisos (en la computadora llegan solo con el navegador abierto: el onboarding lo dice y sugiere instalar también en el celular). Badge del ícono del profesional con `setAppBadge(n)` de alertas no leídas, `clearAppBadge()` al leerlas.
- Embudo sin datos personales (v1.1): contadores por paso y plataforma (guía vista → instalada → permiso → suscripción guardada).

### 7.4 Suscripciones, cola y entrega
- `suscripciones_push(id, endpoint unique, p256dh, auth, profesional_id null, paciente_id null, acceso_id null references paciente_accesos on delete cascade, plataforma, creada, ultimo_visto, ultimo_ok, fallos_consecutivos default 0, activa)` con `check (num_nonnulls(profesional_id, paciente_id) = 1)` y FK de tenant. Revocar un acceso borra sus suscripciones en la misma transacción; baja del paciente borra todas; suspensión desactiva las del profesional; "Salir" del profesional hace `unsubscribe()` y borra la fila. Un endpoint que ya existe con otro dueño pasa al último que se registró (queda en `admin_log`).
- Validación (en SQL al guardar y otra vez en `enviar-push`): `https://`, sin credenciales ni puerto, host terminado en `fcm.googleapis.com`, `push.apple.com`, `push.services.mozilla.com` o `notify.windows.com` (completá la lista con la doc de cada proveedor `[VERIFICAR]`); `p256dh` base64url de 65 bytes y `auth` de 16; máximo 5 activas por paciente y 10 por profesional (se reemplaza la más vieja).
- Encolado en `notificaciones` con `on conflict (dedupe_key) do nothing`: `resumen_mensual:{paciente}:{AAAA-MM}`, `dia_anterior:{turno}:{fecha}`, `presesion:{turno}:{epoch_inicio}`, `cancelacion_paciente:{turno}`, `cancelacion_profesional:{turno}`, `bloqueo:{bloqueo}:{paciente}`, `cambio:{paciente}:{uuid}`, `feriado:{profesional}:{fecha}:{n}`, `prueba:{uuid}`; con `prioridad`, `expira_en`, `estado`.
- Entrega exactamente una vez por suscripción: `enviar-push` llama a `reclamar_notificaciones(lote)` (`update ... set estado='enviando', reclamada_en=now(), intentos=intentos+1 where id in (select ... where estado in ('pendiente','reintentar') and proximo_intento <= now() order by prioridad, creada_en limit lote for update skip locked) returning ...`), que antes revalida vigencia (turno no cancelado ni movido, paciente y profesional activos, acceso no revocado, `expira_en > now()`; si no, `descartada`). Reclamos con más de 2 minutos vuelven a `reintentar`. `push_log unique (notificacion_id, suscripcion_id)`; una suscripción con 201 no se reintenta.
- Política por respuesta: 201 → ok (`fallos_consecutivos = 0`, `ultimo_ok`); 404/410 → borrar la suscripción; 400/403 (incluye `VapidPkHashMismatch`, `BadJwtToken`) → no reintentar, marcar inválida, alerta técnica; 413 → no reintentar (bug); 429/5xx/red → backoff 1, 5, 15, 60 min respetando `Retry-After` y `expira_en`, máximo 5; 5 fallos seguidos desactivan la suscripción. Estados finales: `entregada`, `fallida`, `sin_destino`, `descartada`. `push_log` sin contenido: `notificacion_id, suscripcion_id, intento, http_status, motivo, servicio, latencia_ms, creado`.
- Headers: pre-sesión `TTL` = segundos hasta el inicio y `Urgency: high`; cancelación o bloqueo `TTL` hasta el turno (máx. 24 h), `high`; aviso al profesional `TTL` 24 h, `high`; día anterior `TTL` 12 h, `normal`; resumen `TTL` 72 h, `normal`; prueba 1 h. `Topic` por turno (≤ 32 caracteres base64url).
- Confirmación de recepción (urgentes y prueba): el handler `push`, después de `showNotification`, hace `fetch` con `keepalive` a `portal_confirmar_recepcion` (o la del profesional). La UI dice "Recibido" solo con esa confirmación; "Enviado" = 201. Suscripciones sin `ultimo_visto` en 45 días: "Avisos: sin verificar".
- VAPID y `CRON_SECRET` se generan UNA vez. Modo A: `bootstrap-secretos.yml` (`workflow_dispatch`, entorno `produccion`, mismo `concurrency` que el deploy) que Martín dispara (M-19): termina sin hacer nada si existe alguno; falla si existe uno de VAPID y falta el otro; genera sin imprimir (`set +x`, archivo temporal `umask 077`, `::add-mask::` por valor y por línea), carga con `supabase secrets set --env-file`, escribe `CRON_SECRET` en Vault con variable de `psql` (nunca literal en `-c`) y publica la pública como variable del hosting. Modo M: la pantalla "Plataforma → Configurar avisos" (Super Admin con `aal2`) genera el par en el navegador de Martín con WebCrypto y el `CRON_SECRET`, y le muestra los valores con "Copiar" y el SQL exacto de Vault para pegar en el dashboard (M-19); nunca pasan por la sesión ni por el chat. La clave privada VAPID no tiene copia: si se pierde, todos reactivan avisos (anotado en DECISIONES.md). El deploy normal nunca genera secretos.
- `CRON_SECRET` viaja en headers de `pg_net`, legibles por roles de la base `[VERIFICAR]`: por eso `enviar-push` no recibe parámetros (conocer el secreto solo adelanta un vaciado), limita a 1 vaciado cada 10 s, responde solo contadores, y el secreto no sirve para nada más (riesgo aceptado en DECISIONES.md).
- Librería: candidatas `jsr:@negrel/webpush` y `npm:@pushforge/builder` `[VERIFICAR]`; evitá `npm:web-push` (APIs de Node). Elegí con el test de ida y vuelta RFC 8291 (§8.1) y fijá la versión.

### 7.5 Jobs (pg_cron en UTC; la hora local se decide en SQL por profesional)
| Job | Cuándo | Qué hace |
|---|---|---|
| `horizonte` | diario 06:00 UTC | genera ocurrencias (§3.6), profesional por profesional |
| `resumen_mensual` | cada hora, minuto 7 | encola para cada paciente activo cuyo profesional, en su zona, está entre el día 25 a las 10:00 y fin de mes, sin su `dedupe_key` (se recupera solo si una corrida falló o la base estuvo pausada) |
| `dia_anterior` | cada 15 min | encola los turnos de mañana cuando en la zona del profesional son ≥ la hora configurada (19:00) |
| `presesion` | cada minuto | encola turnos `confirmado` con `inicio - ventana <= now() < inicio` |
| `feriados` | diario 12:00 UTC | preguntas de 14, 7 y 1 día antes; modo automático; alerta de feriados faltantes el día 1 |
| `vaciar_cola` | cada minuto + disparo inmediato por `pg_net` en urgentes | llama a `enviar-push` |
| `limpieza` | diario | retención §6.5 |
| `accesos` | diario | revoca accesos sin uso en 180 días |
Tests con reloj simulado: profesional en Argentina y otro en `America/Santiago` reciben el resumen a las 10:00 locales; si la corrida de las 10 falla, la de las 11 lo encola una vez; pre-sesión con corrida demorada 3 minutos encola exactamente uno. Consumo estimado vs. límites (§8.4) visible en Plataforma.

### 7.6 Plan B y regla de cobertura
- **Regla de cobertura (obligatoria):** ningún cambio iniciado por el profesional queda sin un canal confirmado. Al confirmar una cancelación, un bloqueo, un "No atiendo" de feriado o un cambio de plan, el modal lista los pacientes afectados con su estado ("Avisos activos" / "Sin avisos" / "Último aviso falló"); para cada uno sin avisos activos, "Avisar por WhatsApp" (`wa.me` al celular con el texto §4.8), y no se cierra sin marcar "Avisado por WhatsApp" o "Lo aviso yo después" (queda pendiente en Alertas). Una notificación urgente que termina `fallida` o `sin_destino` crea la alerta "No pudimos avisarle a {Apellido, Nombre}: avisale por WhatsApp".
- **"Agregar a mi calendario":** (a) "Agregar este turno" y "Agregar los turnos del mes": descarga de `.ics` con `VALARM` de 24 h y 1 h (en iPhone abre la hoja nativa; en Android, Google Calendar o el calendario del teléfono), con la advertencia "Si tu turno cambia, te vamos a avisar; este evento no se actualiza solo"; (b) "Suscribirme (se actualiza solo)": feed con token `ics` propio de solo lectura (32 bytes, solo hash, revocable, rotado por "Reenviar acceso"; las `portal_*` lo rechazan), en iPhone `webcal://`, en Android `https://calendar.google.com/calendar/r?cid=<URL webcal codificada>` con "Se abre Google Calendar en el navegador; tocá Agregar" `[VERIFICAR]`, y el texto "Los cambios pueden tardar varias horas en aparecer". Eventos con título "Turno", sin nombre del profesional, especialidad, honorario ni notas, dirección solo si el profesional la habilitó, `UID` estable, `SEQUENCE`, `STATUS:CANCELLED`, `REFRESH-INTERVAL` y `X-PUBLISHED-TTL` de 1 h. La Edge Function no registra URL ni token. Validado con `ical.js` en tests.
- El portal funciona igual en el navegador para ver y cancelar.
- Email solo con dominio propio y si el paciente tiene email (§6.6).

### 7.7 Contenido y formato del aviso
- Contenido: §4.8. Test que recorre todos los tipos de payload buscando las palabras prohibidas y el nombre del profesional sembrado, verifica largo de título y cuerpo, y tamaño < 4 KB.
- Formato único compatible con Declarative Web Push `[VERIFICAR]`: `{"web_push": 8030, "notification": {"title": "...", "body": "...", "navigate": "https://app.<dominio>/p?n=<id>", "lang": "es-AR", "dir": "ltr", "tag": "turno-<id>", "silent": false, "data": {"notificacion_id": "<id>"}}}`. El handler `push` del SW parsea ese JSON y llama `showNotification` siempre (si el JSON es inválido: "Tenés un aviso de TURNAPP"). `notificationclick` cierra, enfoca una ventana del origen y navega a `navigate` (sin tokens en la URL). Sin `actions` como única vía (Safari no las soporta). `tag` por turno.

## 8. Testing, CI y backtesting

### 8.1 Niveles
- Unit (Vitest): fechas y moneda, "Próximas fechas", `normalizarCelularAR` (≥ 15 casos), parser de "Pegar lista" (≥ 20 formatos), contraste de tokens, `sanear()`, reglas de UI (anticipación, saludos), handlers del SW con mocks, test de ida y vuelta RFC 8291 sin red (claves P-256 generadas en el test, cifrado con la librería, descifrado de referencia; headers `Content-Encoding: aes128gcm`, `TTL`, `Urgency`, `Topic`, JWT VAPID con `aud` = origen del endpoint, `exp` ≤ 24 h, `sub` mailto).
- Base (pgTAP): catálogo primero; matriz RLS por rol × operación × tabla (anon, paciente por token, token `ics`, profesional A, profesional B, suspendido, Super Admin `aal1` y `aal2`); columnas protegidas; `portal_*`, `admin_*` (sin datos de pacientes); reglas 1, 3, 4, 6, 7, 8; límite del plan concurrente; cola concurrente (3 vaciados en paralelo sobre 50 avisos = una entrega por suscripción; aviso de turno cancelado antes del vaciado = `descartada`); revocar un acceso = 0 suscripciones; vinculación con fuerza bruta global; supresión completa; funciones con `search_path` vacío en la sesión; migración de frecuencias viejas.
- E2E (Playwright, Chromium; WebKit en v1.1; 360 y 1280 px) contra `vite preview` + stack local: login, onboarding, alta rápida con cada opción de sesiones por mes (cuenta interacciones), "Pegar lista", extras, mover, cancelación, bloqueo con regla de cobertura, pregunta de feriado, portal por link, cancelación con más y con menos de la anticipación (rechazada en el servidor aunque se fuerce), editar teléfono, invitación leyendo el email en Mailpit/Inbucket del stack local, suscripción con permiso concedido, `/inicio` en sus tres casos, offline del portal, limpieza al salir. Errores de consola y violaciones de CSP = fallo. axe sin serious/critical.
- Suscripción real a FCM desde Chromium y envío desde la Edge Function local: solo si el entorno llega a los dominios push; si no, "NO VERIFICADO" en el PR. iOS: solo dispositivos reales (M-11).
- Instalabilidad propia (Lighthouse 12+ no tiene categoría PWA): manifest válido con campos e íconos, SW controlando la página, `start_url` responde offline. Lighthouse CI (v1.1/Final) móvil en Landing, Login, Hoy y portal: Performance, Accessibility y Best Practices ≥ 90.
- Rendimiento (Final; presupuesto medido desde 1b): code-splitting por ruta con `React.lazy`; gzip JS+CSS de `/p` ≤ 120 KB, `/ingresar` ≤ 150 KB, `/panel/hoy` ≤ 200 KB (`size-limit`); lazy de QR, calendario y gráficos. Web Vitals de campo (`web-vitals`, 10 % de muestreo, tabla `metricas_web` sin datos personales): p75 LCP < 2,5 s, INP < 200 ms, CLS < 0,1.
- Tests deterministas: reloj simulado, datos por test, sin depender del orden. Cobertura por regla en `docs/TESTS.md`.

### 8.2 CI y workflows
- `ci.yml` en cada PR: `npm ci`, lint, typecheck, unit, build, `supabase start` + `supabase test db` + `supabase db lint`, prueba contra la réplica del esquema, freno de migraciones, e2e, axe, gitleaks, `npm audit --audit-level=high`, `grep` de `secrets.SUPABASE_` fuera de los workflows permitidos, presupuesto de tamaño (Lighthouse en v1.1). Caché de dependencias, imágenes y navegadores. Minutos gratuitos según visibilidad `[VERIFICAR]`: e2e completos solo en PR.
- Todos los workflows: `permissions` mínimos (`contents: read`), actions fijadas por SHA con el tag en comentario, `persist-credentials: false`, sin `pull_request_target`.
- Setup script del entorno de Claude Code (opcional, para velocidad), cuando exista `@playwright/test`: pedile a Martín que pegue en "Setup script" `#!/bin/bash` + `cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && npx -y playwright@<versión exacta> install --with-deps chromium webkit || true` `[VERIFICAR]` (se cachea si tarda menos de ~5 minutos).

### 8.3 Backtesting de agenda (obligatorio)
Script SQL/pgTAP en `supabase/tests/backtesting/` que simula la agenda día por día con reloj simulado y verifica invariantes.
- **Escenarios (todos obligatorios desde el piloto):** cada opción de §3.3 con sus alternativas (1 con ordinal 1–4 y 5º → último; 1 "cada 4 semanas"; 2 cada dos semanas con meses de 3; 2 "1ª y 3ª"; 3 con {1,2,3}, {2,3,4} y primera sesión en 5ª semana como extra; 4 con 5ª semana y "máximo 4"; "Más" con martes y jueves y con "cada 8 semanas"; "sin horario fijo" solo con extras); meses de 4 y 5 semanas para cada día de la semana; febrero 2027 y 29/02/2028; cruce diciembre → enero; feriados en los tres modos (pregunta respondida "Atiendo", "No atiendo", sin respuesta, automático) incluidos puentes; bloqueos de día, franja y rango; extras sobre días con serie y en huecos; sesiones movidas y el generador corriendo después; cambios de plan a mitad de mes en ambos sentidos con choques; cambio de honorario a mitad de mes; altas y bajas; migración de frecuencias viejas; dos series del mismo paciente; dos pacientes compitiendo por el mismo horario (uno queda en `conflictos_agenda`).
- **Invariantes:** cero duplicados por `(recurrencia_id, fecha_ocurrencia)`; cero solapamientos de turnos activos por profesional; nada activo dentro de un bloqueo; ordinales e intervalos exactos según el patrón; cantidad por mes exacta donde el patrón la fija (1, 3, "máximo 4", "1ª y 3ª"); correr el generador dos veces no cambia nada; ningún feriado cancelado sin respuesta o modo automático; total y fechas del resumen del día 25 iguales a la suma real de turnos del mes siguiente, extras incluidas; horizonte siempre cubierto; ninguna sesión perdida sin registro en `conflictos_agenda`.
- **Piloto:** 12 meses × 60 pacientes × 1 profesional en `America/Argentina/Buenos_Aires`. **Final:** 18 meses × 200 × 3, repetido en `America/Santiago` y `America/New_York` (hora inexistente y ambigua).

### 8.4 Límites gratuitos a vigilar (anotados por la auditoría el 13/11/2026; todos `[VERIFICAR]` antes de la Fase 6)
Supabase Free: 500.000 invocaciones de Edge Functions/mes, 500 MB de base, 5 GB de egress, 50.000 MAU, pausa tras ~1 semana sin actividad, sin backups, 2 proyectos activos; Edge Functions 256 MB, 150 s de reloj, 2 s de CPU, puertos 25 y 587 bloqueados; `pg_net` hasta 200 req/s, timeout 2 s, respuestas 6 h, tablas unlogged; Cron: ≤ 8 jobs concurrentes, < 10 min por job, horarios en GMT. Cloudflare Workers Free: assets estáticos gratis e ilimitados, 100.000 requests/día de código. Vaciado cada minuto ≈ 43.200 invocaciones/mes más disparos: mantené el total por debajo del 30 % del límite y mostralo en Plataforma.

## 9. Fases

Orden: Arranque → 0 → 1a → 1b → 1c → 2 → 3 → 4 → 5 → 6 → **Puerta del piloto (Piloto 1)** → 7 (v1.1) → 8 (Final). El piloto tiene prioridad: lo marcado "v1.1" no se hace antes. Cada fase: rama propia, puertas de revisión, PROGRESO.md, PR con la plantilla §13.2. Si un criterio no se puede cumplir por algo externo, el PR lo dice con la causa. Fases grandes se dividen en sub-PRs completos y mergeables.

### Arranque (primera sesión; sin PR propio)
Martín ya subió el kit a `main`, así que `CLAUDE.md`, los subagentes y la guarda cargan desde esta sesión. Checklist en PROGRESO.md: (1) confirmar que `CLAUDE.md` está entre las instrucciones cargadas y que los 7 subagentes aparecen en la herramienta de agentes; (2) `bash .claude/hooks/probar-guardia.sh` → "TODAS LAS PRUEBAS PASARON" y un intento real bloqueado (`git push origin main` desde una rama de prueba local debe devolver "BLOQUEADO por .claude/hooks/guardia.sh"); (3) validar el YAML de `.claude/agents/*.md` con python3 + yaml; (4) detección del repo y modo de despliegue (§5.3); (5) entorno: `git status`, `git log --oneline -5`, `node -v`, `npm -v`, Docker (§5.2), `npx supabase --version`, códigos HTTP de `https://registry.npmjs.org/`, `https://hszobstcatbyzijbdnpv.supabase.co/rest/v1/`, `https://cdn.playwright.dev/`, `https://developer.mozilla.org/`, `https://fcm.googleapis.com/`, y la consulta de solo lectura con `{"query":"select 1 as ok"}` (si da 401/403/000, anotalo: plan B M-04); (6) si falta algo de Martín (M-14 según §5.3, M-01 incompleto), mandale el pedido y seguí con la Fase 0 en la misma sesión.

### Fase 0 — Diagnóstico sin romper nada
Pasos: (1) crear `docs/BACKLOG.md` (§12), `docs/TESTS.md` vacío con las 8 reglas, `docs/MANUAL-OPERACION.md` inicial (mensaje de reanudación, cómo mergear, qué hacer con un email de pausa de Supabase, vencimiento del token); (2) leer el repo completo: estructura, `package.json`, lockfile, `vite.config.js`, `index.html`, `src/`, `public/manifest.json`, configuración de Vercel, `git log --stat -20`; identificar qué `App.jsx` está en `main` y si existe `App-MINIMAL.jsx`; (3) `npm ci` (o `npm install` si no hay lockfile) y `npm run build`; (4) reproducir el crash con `vite preview` y sourcemaps en Playwright (Landing → Login → Ingresar), causa raíz con archivo y línea, y origen del mensaje de CSP/eval; si el entorno llega, lo mismo contra producción (solo lectura); (5) seguridad de claves (§5.5): gitleaks sobre todo el historial, JWT del bundle de producción, claves embebidas; (6) introspección con el anexo §13.1 (plan A: consulta de solo lectura; plan B: M-04), resultado completo en `.verificacion/diagnostico/esquema-AAAA-MM-DD.json` (ignorado por git) y versión commiteable sin `usuarios_auth` y con `[REDACTADO]` en todo secreto, JWT o `Authorization` de `definicion` o `comando` (cada uno es un hallazgo CRÍTICO); (7) comparar real vs. esperado (tablas, columnas, NOT NULL, defaults, FKs, índices, RLS y políticas, funciones con `security definer`, `search_path` y grants, vistas, triggers, extensiones `pg_cron`, `pg_net`, `btree_gist`, `pgcrypto`, grants a `anon`/`authenticated`, usuarios de Auth y filas de `super_admin`); listar "posibles puertas traseras" (usuarios o filas que Martín no reconozca) y pedirle que confirme cada una; guardar `supabase/tests/fixtures/esquema-produccion.sql` (solo estructura); (8) conteo exacto de `pacientes` y `turnos` con consulta aparte (`filas_aprox = -1` significa "nunca analizada", no "vacía"); (9) recomendación adoptar o reconstruir (§5.4); (10) dominio y hosting (§5.1) con precios y requisitos verificados; (11) `docs/DIAGNOSTICO.md` y el informe para Martín (§13.3). Si el repo es público, la lista de riesgos de seguridad no va al repo ni al PR: va solo en el chat, y en DIAGNOSTICO.md queda "Riesgos: ver chat del AAAA-MM-DD; se corrigen en Fase 2".
Entregable: PR "Fase 0 — Diagnóstico" solo con `docs/` y `supabase/tests/fixtures/`. Sin cambios en `src/`, `public/`, build ni base.
Criterios: Arranque registrado en PROGRESO.md con sus pruebas; DIAGNOSTICO.md con causa raíz (archivo y línea), resultado del build, tabla esperado vs. real, riesgos (o la referencia al chat), estado de Auth, puertas traseras, recomendación de base, modo de despliegue y propuesta de dominio; informe que entra en una pantalla de celular y termina con los pedidos agrupados; producción sin cambios. Después de abrir el PR, seguí con la 1a sin esperar.

### Fase 1a — Hotfix (PR chico, prioridad máxima; puede abrirse con el PR de Fase 0 abierto)
Con el menor cambio posible: que `main` compile y que producción no crashee (props y handlers coherentes, dependencias faltantes, login con error controlado si todavía no puede funcionar). Crea `e2e/humo.spec.ts` (Landing → Login → panel o error controlado; falla con errores de consola). No refactoriza. Criterios: comandos 1a de CLAUDE.md en verde; después del merge, verificás producción si el entorno llega o Martín confirma con la checklist que abre sin pantalla en blanco.

### Fase 1b — Reestructura (tres sub-PRs)
- **1b-1 Tooling y CI:** TypeScript estricto, ESLint + Prettier, Vitest, Playwright, `.nvmrc`, `engines`, `.env.example`, `.gitignore` (`.env*` salvo `.env.example`, `.verificacion/`), `ci.yml` (§8.2), headers y rewrites para el hosting actual y para Cloudflare (`public/_headers`, `wrangler.jsonc`), Dependabot, presupuesto de tamaño. Si GitHub rechaza el push de workflows: §5.3 paso 4.
- **1b-2 Base visual:** `tokens.css` con tokens de texto y test de contraste, componentes base accesibles (§4.2), fuente autoalojada, service worker mínimo (precache del shell + página offline, sin avisos) y manifest único (§7.2), prototipo montado con `npm run prototipo` y capturas de referencia (§4.11).
- **1b-3 Pantallas y router:** extracción por partes del monolito a la estructura de CLAUDE.md, compilando y corriendo Playwright después de cada extracción; rutas de §7.1; cliente Supabase con error claro si faltan variables; vitrina `/vitrina/*` en previews; estados vacíos en vez de datos de ejemplo.
Criterios: CI verde; Landing, Login y cada tab renderizan en 360 y 1280 px sin errores de consola ni violaciones de CSP, con capturas al lado de las de referencia; `grep` de emojis en `src/` vacío; ningún componente > 250 líneas; ningún `any` explícito; la vitrina no aparece en `dist/` de producción.

### Fase 1c — Origen definitivo (antes de la Fase 5; puede correr en paralelo con la 2)
Compra del dominio (M-06), hosting definitivo con dominio `app.<dominio>`, redirección del dominio raíz, variables solo en producción (§5.6), previews por rama, Site URL y Redirect URLs nuevas (M-07 o config como código), CSP y CORS con el origen nuevo. El deploy de Vercel queda apagado o redirigiendo cuando el nuevo funciona (no hay pacientes instalados todavía). Criterios: `https://app.<dominio>` sirve la app con headers verificados (`curl -I`), HTTPS válido, `sw.js` y manifest con tipos correctos, e2e de humo contra el origen nuevo; grep sin referencias al origen viejo fuera de DECISIONES.md.

### Fase 2 — Base de datos y seguridad (cuatro sub-PRs)
- **2a Esquema y seguridad:** estrategia aprobada (adoptar o reconstruir), migración de grants, esquema `interno`, tablas de §6.3 con FKs de tenant y columnas protegidas, RLS, vistas, `admin_log` de solo inserción, test de catálogo, matriz RLS, `supabase/config.toml`, seed ficticio, tipos generados.
- **2b Agenda:** §3 completo para el piloto (series, generación, extras, mover, cambio de plan desde una fecha, bloqueos, feriados con preguntas, horario de atención, resumen del mes, migración de frecuencias viejas en modo expandir) y el backtesting del piloto (§8.3).
- **2c Funciones:** `portal_*`, `profesional_vista_portal`, `admin_*` agregadas, `ping()` con `version_minima`, límites de §6.8, test de integración con `supabase-js` contra el stack local (cliente → RLS → funciones).
- **2d Despliegue:** según el modo (§5.3–5.4): `deploy-produccion.yml` con freno, respaldo de esquema y orden base → frontend, o `supabase/manual/` con su checklist (M-18); workflow de `ping` y de mantenimiento; rollback probado.
Criterios: `npx supabase db reset` limpio; `npx supabase test db` verde con catálogo, matriz RLS y backtesting del piloto (con cantidad de asserts); anon no lee ninguna tabla; profesional B no ve nada de A ni puede referenciar sus pacientes; el profesional no puede cambiar `plan`, `limite` ni `activo`; paciente con token solo ve lo suyo y no cancela con menos de la anticipación; token revocado y token `ics` rechazados por `portal_*`; migraciones aplicadas sobre la réplica; después del merge, el esquema de producción coincide con las migraciones (introspección de solo lectura); M-03 confirmado; `arquitecto-supabase` y `auditor-seguridad` en APROBADO.

### Fase 3 — Autenticación, roles, alta de profesionales y acceso del paciente
Entregables: login real, recuperación, `/auth/callback`, `/auth/nueva-clave`, guards por rol, `mi_rol()`, profesional suspendido, MFA `aal2` del Super Admin con recuperación documentada, Edge Function `invitar-profesional` con su UI mínima en `/admin/profesionales` (lista con estado y fecha, "Crear profesional" con Nombre, Apellido y Email obligatorios, Especialidad opcional y plan "Fundador" preseleccionado; pantalla "Invitación enviada a {email}" con "Copiar link" y "Enviar por WhatsApp" y el vencimiento real; "Reenviar invitación"; "Suspender"/"Reactivar" con confirmación), onboarding del profesional (§4.5) con aceptación legal, borradores de `/legal/terminos` y `/legal/privacidad`, acceso del paciente completo (§6.2: link, canje, traspaso por cookie, vinculación inversa, QR, WhatsApp, normalización de celulares), cierre de sesión global al cambiar contraseña, SMTP (M-08). Pedidos: M-07 (si no es config como código), M-08, M-09.
Criterios: e2e: profesional entra y ve su panel; Super Admin entra con MFA (stack local) y ve `/admin`; un profesional no abre `/admin` ni llama `admin_*`; Super Admin con `aal1` rechazado en `admin_*`; suspendido ve el mensaje y no lee datos; recuperación completa leyendo Mailpit; crear profesional en 4 toques + 3 campos → email → contraseña → onboarding → "Activo"; link válido muestra solo ese paciente; link inválido o revocado muestra "Este link ya no funciona. Pedile uno nuevo a tu profesional." sin filtrar información; vinculación inversa funciona una vez y la fuerza bruta global se corta; en producción, Martín entra como Super Admin con contraseña nueva y MFA (M-09).

### Fase 4 — Panel profesional (núcleo del piloto)
Entregables: Hoy, Agenda, Pacientes, Alertas y Configuración según §4.5 y §3: alta rápida con "Sesiones por mes", "Más opciones" y "Más", "Guardar y cargar otro", "Pegar lista", hoja "Compartir acceso", estado del acceso, "Enviar accesos pendientes", editar, "Cambiar sesiones por mes" y "Cambiar día y hora" desde una fecha con propuestas sin huecos, "Agregar sesión extra", mover, cancelar con regla de cobertura, bloqueos con mensaje, preguntas de feriados con "Atiendo"/"No atiendo", realizado/ausente, baja, eliminar definitivamente, reenviar acceso, vincular dispositivo, vista previa del portal, StatCards con drilldown, "Recordatorios", Alertas en vivo. Antes de cerrar: M-17 (Martín valida la pantalla de alta en la preview/vitrina con capturas en el PR).
Criterios: alta con ≤ 7 campos visibles y ≤ 8 interacciones de "Nuevo" a "Guardar" contadas por el e2e, compartir por WhatsApp en 1 toque más; para cada opción de sesiones por mes, la línea "Próximas" coincide con lo que genera la base; "Pegar lista" de 30 pacientes en ≤ 5 toques más correcciones; extra visible en Agenda y sumada al total del mes; cambio 4 → 2 con propuesta aplicada sin choques ni huecos y un solo aviso; choque detectado con hueco sugerido; bloqueo de un día con 3 pacientes (1 con avisos, 2 sin) muestra los 2 "Sin avisos" con WhatsApp y no deja cerrar sin resolverlos; "No atiendo" de feriado crea el bloqueo y los avisos; cambio de honorario solo en turnos futuros; axe limpio en las 4 tabs y todos los modales; M-17 aprobado; `frontend-ux` y `producto-negocio` revisaron.

### Fase 5 — Portal del paciente (requiere la Fase 1c en producción)
Entregables: portal `/p` según §4.6, §6.2 y §7.6: aviso de privacidad, lista y calendario con navegación de meses, cancelación con la anticipación del servidor y "Escribirle por WhatsApp", edición de teléfono, "Agregar a mi calendario" (descarga y feed), "Avisos discretos", "Letra más grande", "Salir de este dispositivo", offline de solo lectura con el SW de 1b, `/inicio`, guía de instalación (sin la suscripción, que es de la Fase 6), vista previa del profesional. Pedido M-11a (verificaciones en iPhone real de §6.2 y §7.3).
Criterios: e2e en 360 px: ver turnos, cancelar uno con más anticipación (llega a Alertas), intentar con menos (rechazado por el servidor aunque se fuerce), editar teléfono (alerta al profesional), offline muestra los últimos turnos y deshabilita acciones, `/inicio` en sus tres casos, limpieza completa al salir; `.ics` válido con `ical.js` y sin notas, especialidad ni honorario; texto ≥ 16 px y objetivos ≥ 48 px verificados por test; zoom 200 % sin scroll horizontal; axe limpio; resultados de M-11a anotados en DECISIONES.md.

### Fase 6 — Avisos y automatizaciones
Entregables: suscripción (profesional y paciente) con validación y límites, `push-config`, `enviar-push` con reclamo atómico, política por código y confirmación de recepción, jobs de §7.5, disparo inmediato en urgentes, VAPID y `CRON_SECRET` (M-19), link de videollamada en el pre-sesión, borrado de suscripciones vencidas, regla de cobertura de punta a punta, badge del profesional.
Criterios: cada tipo encolado produce exactamente una entrega por suscripción (3 vaciados en paralelo); aviso de turno cancelado antes del vaciado = `descartada`; reglas 3 y 4 de punta a punta en local con reloj simulado (resumen por paciente con fechas, honorario y total iguales a la suma, extras incluidas; cancelación del paciente encola el aviso al profesional); resumen a las 10:00 locales en dos zonas y recuperación si falla una corrida; payloads sin palabras prohibidas ni nombre del profesional, ≤ 120 caracteres de cuerpo, < 4 KB; revocar un acceso = 0 envíos a ese dispositivo; test RFC 8291; M-11 completo en Android e iPhone.

### Puerta del piloto (Piloto 1)
Requisitos: Fases 0 a 6 mergeadas y en producción; origen definitivo en uso; M-03 confirmado; borradores legales publicados con aceptación; MFA del Super Admin activo; backtesting del piloto verde; `docs/GUIA-PROFESIONAL.md` y su versión en la app (Configuración → "Cómo usar TURNAPP": cargar pacientes, mandar accesos, qué ve el paciente, qué hacer si a alguien no le llegan los avisos, cómo bloquear vacaciones, cómo responder feriados) con el texto reenviable "Cómo activar los avisos en tu celular" (Android y iPhone); decisión de backups presentada a Martín (§5.2). Cuando todo esté: mensaje "Listo para el piloto" con M-16 (le preguntás a Martín quién es el profesional piloto, cuántos pacientes tiene y qué celulares usan). Durante el piloto: cada viernes, números agregados en `docs/PILOTO.md` (pacientes cargados, accesos enviados y abiertos, avisos activos, cancelaciones, envíos fallidos) y las 3 preguntas de §13.4 en un solo mensaje a Martín.

### Fase 7 — v1.1 (2 a 4 semanas después de arrancar el piloto)
Regla 6 completa (alternativas ofrecidas y aceptables desde el portal), regla 7 completa (propuestas cruzadas y lista de espera), Super Admin completo (Dashboard, Plataforma, cambiar plan, "Ver resumen", feriados), filtros de período en drilldowns, ajuste de honorarios en bloque, feed `.ics` del profesional, varios profesionales por dispositivo con selector, embudo de instalación, Lighthouse CI, e2e WebKit, problemas del piloto priorizados por `producto-negocio`. Criterios: los de cada ítem en sus secciones, más las 8 reglas completas con tests en TESTS.md.

### Fase 8 — Endurecimiento y entrega
Suite completa en CI (unit, pgTAP con backtesting final, e2e Chromium y WebKit —o Firefox si WebKit no instala, documentado—, axe, Lighthouse CI, instalabilidad, gitleaks, audit), presupuestos de rendimiento y Web Vitals (§8.1), monitoreo de errores sin datos personales (`sanear()`), contracción de columnas viejas aprobada, revisión de que el origen es el definitivo y que el hosting sigue permitiendo uso comercial antes del primer cobro, legal completo para revisión de un abogado (M-15), `docs/MANUAL-OPERACION.md` completo (crear un profesional, qué hacer si alguien no recibe avisos, mergear, pedir cambios a Claude Code, base pausada, renovar tokens, recuperar MFA), `docs/BACKLOG.md` priorizado. Criterios: §11.

## 10. Pedidos a Martín (M-xx)

Claude Code los manda agrupados, cuando hacen falta, con valores exactos completados y nombres de menús verificados `[VERIFICAR]`; si no puede verificar un menú, agrega "Si no ves exactamente este texto, mandame una captura". Si un pedido ya está hecho, lo saltea y lo dice. M-01, M-02 y M-03 están en la guía de Martín (se hacen antes de la primera sesión); acá figuran para verificarlos.
- **M-01 · Antes · Entorno de Claude Code:** red "Custom" con la lista de dominios de la guía, variables de timeout y network secret con el token de solo lectura. Verificación: el paso (5) del Arranque. Si falta un dominio, pedí solo ese, con los clics.
- **M-02 · Antes · Kit subido a `main`:** verificación: los archivos existen en `main` con su ruta (incluido `.claude/`).
- **M-03 · Antes (urgente) · Rotación de claves y revocación del secreto JWT legacy:** verificación §5.5. Si falta: los pasos de la guía, de nuevo.
- **M-04 · Fase 0, solo si falla la consulta de solo lectura:** abrir `https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv/sql/new`, pegar completa la consulta que le pasás (probada en CI), "Run", exportar el resultado ("Export" → "Copy as JSON" o "Download CSV", según lo que vea) y pegarlo o subirlo al chat. Nunca edita SQL.
- **M-05 · Fase 2d, modo A · Secretos de despliegue en el entorno `produccion`:** (1) contraseña de la base: `https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv/settings/database` → "Reset database password" → "Generate a password" → copiarla → "Reset password"; (2) token: `https://supabase.com/dashboard/account/tokens` → "Generate new token" → nombre `github-actions-turnapp`, solo el proyecto `hszobstcatbyzijbdnpv`, los permisos exactos que le indiques (verificados; nada de alcance de cuenta), vencimiento 1 año; (3) `https://github.com/Consciousnessebooks/turnapp/settings/environments` → "New environment" → `produccion` → "Configure environment" → "Deployment branches and tags" → "Selected branches and tags" → "Add deployment branch or tag rule" → `main`; en "Environment secrets" (NO en "Repository secrets"): `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN` y los del hosting que le indiques. Si no ve "Environment secrets", no carga nada y avisa: modo M. Anotá el vencimiento del token en MANUAL-OPERACION.md.
- **M-06 · Fase 0–1c · Dominio y hosting:** con los datos verificados de §5.1: comprar el dominio elegido (pasos exactos del registrador), crear la cuenta del hosting, conectar el repo, delegar DNS, agregar `app.<dominio>`. Sin variables en previews (§5.6).
- **M-07 · Fase 1c/3 · Auth (si no va como código):** `https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv/auth/url-configuration` → "Site URL" = `https://app.<dominio>` → "Save"; "Redirect URLs" = solo `https://app.<dominio>/auth/callback` y `https://app.<dominio>/auth/nueva-clave` (sin comodines, sin localhost, sin previews) → "Save URLs"; `https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv/auth/providers` (o "Authentication" → "Sign In / Providers") → desactivar "Allow new users to sign up" → "Save"; contraseñas: mínimo 12, letras y dígitos, "Leaked password protection" si está en el plan.
- **M-08 · Fase 3 · Emails:** con dominio: crear la cuenta del proveedor elegido, agregar los registros DNS exactos que le pasás y cargar la clave SMTP (en el entorno `produccion` en modo A, o en `https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv/auth/smtp` en modo M). Respaldo sin dominio: verificación en 2 pasos de `turnapp.org@gmail.com`, contraseña de aplicación en `https://myaccount.google.com/apppasswords` (nombre `Supabase TURNAPP`), SMTP `smtp.gmail.com`, puerto 465.
- **M-09 · Fase 3 · Recuperar el acceso de Super Admin:** en `https://app.<dominio>` → "Ingresar" → "Olvidé mi contraseña" → `turnapp.org@gmail.com` → abrir el email → contraseña nueva de 12+ caracteres guardada en un gestor → escanear el QR del código de seguridad con Google Authenticator o similar (y un segundo autenticador si puede) → "Listo M-09" (sin la contraseña).
- **M-10 · Fase 3 · Usuario de prueba:** por defecto se elimina `profesional@test.com`; Martín solo se entera en el PR. Para probar como profesional usa un alias (`turnapp.org+prof1@gmail.com`).
- **M-11a · Fase 5 · Verificaciones en iPhone:** con su iPhone (iOS ≥ 16.4; Ajustes → General → Información → "Versión de iOS"): abrir el link de prueba desde WhatsApp; ¿aparece "Agregar a inicio" sin pasar a Safari?; en Safari, "Agregar a inicio" y abrir el ícono: ¿entra directo a los turnos o pide vincular?; capturas de cada pantalla.
- **M-11 · Fase 6 · Matriz de avisos en Android (Chrome) e iPhone (instalada):** (1) instalar y activar (Android: abrir el link en Chrome → "Activar avisos" → "Permitir"; instalar si lo sugiere; iPhone: Safari → Compartir (en iOS 26: "⋯" → "Compartir") → "Agregar a inicio" → "Abrir como app web" si aparece → "Agregar" → abrir el ícono → si pide código, seguir la pantalla → "Activar avisos" → "Permitir"); (2) "Enviar aviso de prueba" con la app abierta, cerrada y el teléfono bloqueado; (3) modo avión, aviso, 2 minutos, sin modo avión: ¿llegó?; (4) turno de prueba en 20 minutos con pre-sesión de 15: ¿llegó entre 14 y 16 minutos antes?; (5) cancelar un turno de mañana desde el portal: ¿le llegó al profesional?; (6) tocar el aviso: ¿abre el turno?; (7) "Reenviar acceso" y aviso de prueba: NO tiene que llegar; (8) iPhone: desactivar notificaciones en Ajustes y abrir la app: ¿muestra cómo reactivarlas?; (9) "Agregar a mi calendario" en ambos: ¿suenan las alarmas? Respuesta: lista numerada con "llegó"/"no llegó" y captura de cada "no llegó".
- **M-13 · Siempre · Mergear un PR:** abrir el link → esperar "All checks have passed" (si hay cruz roja, no mergear y avisar) → hacer "Cómo probarlo" → "Merge pull request" → "Confirm merge" → "Mergeado #n".
- **M-14 · Arranque · Proteger `main` (según §5.3):** variante A: `https://github.com/Consciousnessebooks/turnapp/settings/rules` → "New ruleset" → "New branch ruleset" → nombre `proteger-main` → "Enforcement status": "Active" → "Target branches" → "Add target" → "Include default branch" → marcar "Restrict deletions", "Block force pushes" y "Require a pull request before merging" (aprobaciones 0) → sin "Bypass list" → "Create" → "Listo M-14"; más adelante, agregar "Require status checks to pass" con el nombre exacto del check. Variante B (privado gratuito): explicación de §5.3 y la pregunta "¿Lo hacemos público? Respondé Público o Privado".
- **M-15 · Fase 8 · Decisiones legales:** revisión de textos por un abogado, inscripción ante la AAIP si corresponde, backlog priorizado.
- **M-16 · Puerta del piloto · Arrancar con el primer profesional:** primero, la pregunta: quién es, cuántos pacientes tiene, qué celular usa él y cuáles sus pacientes. Después: Super Admin → "Profesionales" → "Crear profesional" → Nombre, Apellido y Email → "Crear" → "Enviar por WhatsApp" → mandarle también el link de la guía para profesionales → si puede, acompañarlo 15 minutos mientras usa "Pegar lista" y manda el acceso a 2 o 3 pacientes → "Listo M-16" con cuántos cargó y qué le costó.
- **M-17 · Fase 4 · Validar la pantalla de alta:** abrir la vitrina de la preview del PR (`<URL de la preview>/vitrina/alta`) o las capturas del PR, probar cargar un paciente con 1, 2, 3, 4 y "Más", y responder "Aprobado alta" o qué cambiaría.
- **M-18 · Modo M · Aplicar un cambio de base:** abrir `https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv/sql/new`, abrir el archivo `supabase/manual/<archivo>.sql` del PR → botón "Copy raw file" → pegar → "Run" → tiene que decir "Success. No rows returned" → "Listo M-18". Después Claude Code verifica y pide el merge.
- **M-19 · Fase 6 · Generar las claves de avisos (una sola vez):** modo A: `https://github.com/Consciousnessebooks/turnapp/actions/workflows/bootstrap-secretos.yml` → "Run workflow" → "Run workflow" → esperar el tilde verde → "Listo M-19". Modo M: Super Admin → "Plataforma" → "Configurar avisos" → copiar cada valor al lugar exacto que indica la pantalla (secretos de Edge Functions en el dashboard de Supabase, variable del hosting y el SQL de Vault) → "Listo M-19".

## 11. Definición de terminado global (MVP)
Con evidencia enlazada en PROGRESO.md:
1. CI de `main` verde: lint, typecheck (estricto, sin `any`), unit, build, pgTAP con catálogo y backtesting final, e2e Chromium y WebKit, axe, Lighthouse CI, instalabilidad, gitleaks, audit.
2. Las 8 reglas con tests que pasan, listados en TESTS.md (reglas 6 y 7 en su versión completa).
3. Matriz RLS completa sin accesos indebidos; columnas protegidas; FKs de tenant.
4. Backtesting final (§8.3) sin duplicados, choques, turnos en bloqueos, feriados cancelados en silencio ni errores de zona horaria.
5. Lighthouse móvil ≥ 90 en Performance, Accessibility y Best Practices en Landing, Login, Hoy y portal; instalabilidad verde; axe limpio en todas las pantallas; presupuestos de tamaño cumplidos.
6. Sin errores de consola ni violaciones de CSP en ningún e2e.
7. M-11 completo en Android e iPhone (todo "llegó" salvo el ítem 7); resumen del día 25 verificado en local con reloj simulado y en producción el primer día 25 posterior (captura agregada de `push_log`, sin datos personales).
8. Producción: Martín entra con MFA, crea un profesional con 3 campos, el profesional recibe la invitación, completa el onboarding, da de alta un paciente con ≤ 8 interacciones y le manda el acceso por WhatsApp en 1 toque, y el paciente entra sin contraseña.
9. Seguridad: M-03 confirmado; registro público deshabilitado; Redirect URLs exactas; ningún secreto en repo ni bundle; vistas con `security_invoker`; grants mínimos; `auditor-seguridad` APROBADO sobre `main`.
10. Esquema de producción idéntico a `supabase/migrations` (introspección).
11. Origen definitivo en uso, con dominio propio y hosting que permite uso comercial.
12. Borradores legales publicados y aceptación registrada; aviso de privacidad; supresión probada.
13. MANUAL-OPERACION.md, GUIA-PROFESIONAL.md, DECISIONES.md, BACKLOG.md y PROGRESO.md al día; todos los PRs mergeados.

## 12. Backlog (después del MVP; `producto-negocio` lo mantiene en docs/BACKLOG.md)
| Prioridad | Ítem | Por qué |
|---|---|---|
| Alta | Registro de cobro por sesión (pagado/pendiente, medio) y saldo; alias o CBU en el resumen | Así se cobra en Argentina |
| Alta | Lista de espera que ofrece por aviso el hueco liberado | Extiende la regla 7 |
| Alta | Reprogramación autogestionada dentro de reglas del profesional | Menos mensajes |
| Media | Tasa de asistencia y política de ausentes | Ya pedido |
| Media | Notas por sesión cifradas | Requiere análisis legal (Ley 26.529) |
| Media | Videollamada con sala generada por sesión (por ejemplo Jitsi) | Gratis |
| Media | Códigos de referido funcionales | Crecimiento |
| Media | Modo demo con datos ficticios aislados | Recupera "Ver demo" |
| Media | Exportar reporte mensual y exportación completa de datos | Portabilidad |
| Media | "Compartir mis horarios libres" y resumen matinal del profesional | Agrado |
| Baja | MercadoPago para suscripciones | Requiere cobro definido |
| Baja | Plan Clínica con secretaría | Monetización |
| Baja | Pacientes en otra zona horaria | Exterior |
| Baja | Modo oscuro, varios consultorios por día, comprobante simple "No válido como factura" | Preferencias |
Hallazgos MEDIO/BAJO no aplicados en el kit: ver la sección "Backlog de auditorías" de DECISIONES.md.

## 13. Anexos

### 13.1 SQL de diagnóstico (solo lectura)
Para el endpoint read-only todos los catálogos van calificados. Probalo en el stack local o en CI tal cual antes de usarlo o dárselo a Martín. Si `cron`, `storage` o `auth.users` no existen o `supabase_read_only_user` no puede leerlos, la referencia falla al planificar: separá esos bloques en consultas independientes probadas (nunca le pidas a Martín que edite SQL).

Consulta 1 (estructura):
```sql
-- TURNAPP · Diagnóstico 1/3 · SOLO LECTURA
select jsonb_pretty(jsonb_build_object(
  'generado', pg_catalog.now(),
  'version_postgres', pg_catalog.version(),
  'tablas', (select coalesce(jsonb_agg(jsonb_build_object('tabla', c.relname, 'rls', c.relrowsecurity, 'rls_forzado', c.relforcerowsecurity, 'filas_aprox', c.reltuples::bigint) order by c.relname), '[]'::jsonb)
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p')),
  'columnas', (select coalesce(jsonb_agg(jsonb_build_object('tabla', table_name, 'columna', column_name, 'tipo', data_type, 'udt', udt_name, 'nulo', is_nullable, 'default', column_default) order by table_name, ordinal_position), '[]'::jsonb)
    from information_schema.columns where table_schema = 'public'),
  'restricciones', (select coalesce(jsonb_agg(jsonb_build_object('tabla', conrelid::regclass::text, 'nombre', conname, 'tipo', contype, 'definicion', pg_catalog.pg_get_constraintdef(oid)) order by conrelid::regclass::text, conname), '[]'::jsonb)
    from pg_catalog.pg_constraint where connamespace = 'public'::regnamespace),
  'indices', (select coalesce(jsonb_agg(jsonb_build_object('tabla', tablename, 'definicion', indexdef) order by tablename, indexname), '[]'::jsonb)
    from pg_catalog.pg_indexes where schemaname = 'public'),
  'politicas', (select coalesce(jsonb_agg(jsonb_build_object('tabla', tablename, 'nombre', policyname, 'comando', cmd, 'roles', roles, 'permisiva', permissive, 'using', qual, 'with_check', with_check) order by tablename, policyname), '[]'::jsonb)
    from pg_catalog.pg_policies where schemaname = 'public'),
  'funciones', (select coalesce(jsonb_agg(jsonb_build_object('nombre', p.proname, 'argumentos', pg_catalog.pg_get_function_identity_arguments(p.oid), 'security_definer', p.prosecdef, 'config', p.proconfig, 'execute_anon', pg_catalog.has_function_privilege('anon', p.oid, 'execute'), 'execute_authenticated', pg_catalog.has_function_privilege('authenticated', p.oid, 'execute'), 'definicion', pg_catalog.pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb)
    from pg_catalog.pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
      and not exists (select 1 from pg_catalog.pg_depend d where d.objid = p.oid and d.deptype = 'e')),
  'funciones_otros_esquemas', (select coalesce(jsonb_agg(jsonb_build_object('esquema', n.nspname, 'nombre', p.proname, 'security_definer', p.prosecdef, 'config', p.proconfig, 'execute_anon', pg_catalog.has_function_privilege('anon', p.oid, 'execute')) order by n.nspname, p.proname), '[]'::jsonb)
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname not in ('public','pg_catalog','information_schema','auth','storage','realtime','extensions','graphql','graphql_public','pgsodium','pgsodium_masks','vault','net','cron','supabase_functions','supabase_migrations','pgbouncer','pgtle','_realtime','_analytics')
      and not exists (select 1 from pg_catalog.pg_depend d where d.objid = p.oid and d.deptype = 'e')),
  'vistas', (select coalesce(jsonb_agg(jsonb_build_object('nombre', c.relname, 'opciones', c.reloptions, 'definicion', pg_catalog.pg_get_viewdef(c.oid, true)) order by c.relname), '[]'::jsonb)
    from pg_catalog.pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('v','m')),
  'triggers', (select coalesce(jsonb_agg(jsonb_build_object('tabla', event_object_table, 'nombre', trigger_name, 'momento', action_timing, 'evento', event_manipulation, 'accion', action_statement) order by event_object_table, trigger_name), '[]'::jsonb)
    from information_schema.triggers where trigger_schema = 'public'),
  'enums', (select coalesce(jsonb_agg(jsonb_build_object('tipo', t.typname, 'valores', (select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_catalog.pg_enum e where e.enumtypid = t.oid)) order by t.typname), '[]'::jsonb)
    from pg_catalog.pg_type t where t.typnamespace = 'public'::regnamespace and t.typtype = 'e'),
  'extensiones', (select coalesce(jsonb_agg(jsonb_build_object('nombre', e.extname, 'version', e.extversion, 'esquema', n.nspname) order by e.extname), '[]'::jsonb)
    from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid = e.extnamespace),
  'permisos_tablas', (select coalesce(jsonb_agg(jsonb_build_object('tabla', table_name, 'rol', grantee, 'privilegio', privilege_type) order by table_name, grantee, privilege_type), '[]'::jsonb)
    from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon','authenticated')),
  'privilegios_columnas', (select coalesce(jsonb_agg(jsonb_build_object('tabla', table_name, 'columna', column_name, 'rol', grantee, 'privilegio', privilege_type) order by table_name, column_name), '[]'::jsonb)
    from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon','authenticated')),
  'privilegios_por_defecto', (select coalesce(jsonb_agg(jsonb_build_object('rol_dueno', pg_catalog.pg_get_userbyid(d.defaclrole), 'esquema', d.defaclnamespace::regnamespace::text, 'tipo_objeto', d.defaclobjtype, 'acl', d.defaclacl::text)), '[]'::jsonb)
    from pg_catalog.pg_default_acl d),
  'publicaciones_realtime', (select coalesce(jsonb_agg(jsonb_build_object('publicacion', pubname, 'esquema', schemaname, 'tabla', tablename) order by pubname, tablename), '[]'::jsonb)
    from pg_catalog.pg_publication_tables)
)) as diagnostico;
```
Consulta 2 (jobs y storage; separala si alguno no existe): `select jsonb_build_object('cron_jobs', (select coalesce(jsonb_agg(jsonb_build_object('nombre', j.jobname, 'horario', j.schedule, 'activo', j.active, 'comando', j.command) order by j.jobname), '[]'::jsonb) from cron.job j), 'buckets_storage', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'publico', public)), '[]'::jsonb) from storage.buckets)) as diagnostico_2;`
Consulta 3 (usuarios y conteos; no se commitea sin redactar): `select jsonb_build_object('usuarios_auth', (select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'creado', u.created_at, 'ultimo_ingreso', u.last_sign_in_at, 'email_confirmado', u.email_confirmed_at is not null) order by u.created_at), '[]'::jsonb) from auth.users u), 'super_admin_filas', (select pg_catalog.count(*) from public.super_admin), 'pacientes', (select pg_catalog.count(*) from public.pacientes), 'turnos', (select pg_catalog.count(*) from public.turnos)) as diagnostico_3;`
En los commits, emails reemplazados por `usuario1@…`, `usuario2@…` (manteniendo los `id`) y secretos por `[REDACTADO]`.

### 13.2 Plantilla de PR
```markdown
## Fase N — Título

### Qué cambió (en simple)
3 a 6 viñetas para Martín, sin jerga.

### Cómo probarlo (Martín)
Cuándo: [antes del merge, en la preview o la vitrina | después del merge, en producción].
1. Abrí ... 2. Tocá "..." 3. Tenés que ver "...".
Si algo no coincide, respondé en el PR con una captura.

### Lo que necesito de vos
Pedidos M-xx con sus pasos, o "Nada".

### Base de datos
Qué cambia en una línea ("agrega la tabla de feriados; no borra nada"), migraciones y compatibilidad hacia atrás. Modo M: el archivo de supabase/manual/ a aplicar ANTES del merge.

### Verificación hecha por Claude Code (SHA: <sha corto del HEAD>)
| Comando | Código de salida | Resumen (copiado de la salida, no redactado) |
|---|---|---|
| <comando> | <0> | <última línea del resumen> |
CI del HEAD: <URL del run> → <conclusion> (consultado con la API de check-runs)
NO VERIFICADO: <ítems, o "nada">
Capturas: docs/capturas/<fase>/...

### Revisión de subagentes
- <subagente>: <veredicto final> (hallazgos corregidos en una línea)

### Riesgos y pendientes
```

### 13.3 Informe de Fase 0 para Martín
```markdown
## Diagnóstico de TURNAPP
**Estado de producción:** (1 línea: qué ve un usuario hoy)
**Por qué está roto:** (1–2 líneas sin jerga)
**La base de datos:** (coincide / no coincide; 1–3 diferencias importantes)
**Claves:** (la clave filtrada quedó anulada / falta un paso)
**Riesgos de seguridad:** (lista corta y urgencia; si el repo es público, solo acá en el chat)
**Usuarios que tenés que reconocer:** (lista, o "ninguno raro")
**Tu repo:** (público o privado; cómo lo protegemos; cómo se actualiza la base)
**Dominio:** (opción recomendada, precio, requisitos; las otras dos en una línea)
**Mi recomendación para la base:** reconstruir o adoptar, y por qué (2 líneas)
**Lo próximo que hago:** el arreglo urgente (Fase 1a), sin esperar.
**Lo que necesito de vos ahora:** pedidos M-xx con sus pasos.
**Decisiones que te pido:** 1) "Reconstruir" o "Adoptar" 2) el dominio (escribí el nombre) 3) si aplica, "Público" o "Privado".
```

### 13.4 Preguntas semanales al profesional piloto
1. ¿Qué tuviste que hacer por fuera de TURNAPP esta semana (WhatsApp, papel, otra agenda) y por qué?
2. ¿Algún paciente te dijo que no entendía algo o que no le llegaban los avisos? ¿Qué celular tiene?
3. Si mañana TURNAPP desapareciera, ¿qué es lo que más extrañarías y qué no usaste nunca?

