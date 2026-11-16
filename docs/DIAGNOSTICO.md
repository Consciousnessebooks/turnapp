# DIAGNÓSTICO — TURNAPP (Fase 0, 2026-11-16)

Todo lo de este documento se obtuvo en esta sesión con lecturas: el repo, el sitio de producción y la consulta de solo lectura a la base (`/database/query/read-only`). No se cambió nada en producción.

## 1. Estado de producción
- `https://turnapp-4typ.vercel.app/` sirve `assets/index-DAN7R_GO.js`, el mismo archivo (mismo hash) que da `npm run build` sobre `main@310c1f9`: producción es exactamente el código de `main`.
- Un usuario ve la landing y el formulario de ingreso. Al tocar "Ingresar" no pasa nada visible y la consola muestra `Uncaught TypeError: e is not a function`. Reproducido con Playwright (Chromium sin extensiones) en local y en producción.
- Aunque el login anduviera, hoy no podría traer datos: las claves legacy de Supabase están deshabilitadas (la API responde 401 "Legacy API keys are disabled", deshabilitadas el 2026-11-16 13:27 hora Argentina) y el frontend usa la clave `anon` legacy.

## 2. Causa raíz del crash
- `src/App.jsx:352`: `App` renderiza `<Login role={loginRole} onLogin={handleLogin} onBack=... loading={loading} />`.
- `src/App.jsx:433`: `Login` recibe `{ role, onSuccess, onBack }`; no existe `onSuccess`.
- `src/App.jsx:456`: el botón "Ingresar" llama `onSuccess()` → `undefined()` → `TypeError: e is not a function` (minificado). Confirmado con sourcemap: `index-*.js:227:7065` → `../../../src/App.jsx` línea 456, columna 83, nombre `onSuccess`.
- Además `Login` nunca lee el email ni la contraseña (inputs no controlados con valores de demo).

Errores latentes que aparecen en cuanto se pase el login (referencias a cosas que no existen en ese componente):
| Archivo:línea | Qué llama | Problema |
|---|---|---|
| src/App.jsx:505, 513 | `setAppts` dentro de `Professional` | no es prop ni estado de `Professional` → ReferenceError al cancelar o bloquear |
| src/App.jsx:520, 530 | `setPatients` dentro de `Professional` | ídem al editar o agregar paciente |
| src/App.jsx:533 | `genAppts(...)` | la función no existe en el archivo |
| src/App.jsx:565, 723 | `onPatient(...)` | no es prop de `Professional` → al tocar "Portal" o el ojo |
| src/App.jsx:367 | `Admin onLogout` | vuelve a la landing sin cerrar la sesión de Supabase |

### Base para el humo de la Fase 1a
- A `Login` se llega por 4 botones de la landing con dos roles: "Ver demo" y "Admin" en el encabezado (src/App.jsx:387–388), "Demo profesional" y "Super Admin" en el centro (402, 405). El humo recorre los dos roles.
- El humo no puede pegarle a Auth de producción: intercepta `*.supabase.co` con `page.route`, o el build de prueba va sin variables de Supabase.
- "Error controlado" = sin `pageerror` ni errores de consola, la pantalla sigue en el formulario y aparece un aviso en español con rol `status` o texto "El ingreso no está disponible en este momento" (sin conexión) / "Email o contraseña incorrectos." (credenciales).
- Producción no manda CSP: el criterio "sin violaciones de CSP" no prueba nada hasta que la Fase 1b agregue los headers.

No existe `App-MINIMAL.jsx` en ninguna rama ni en el historial (`git log --all -- '*MINIMAL*'` vacío).

## 3. Mensaje de CSP / eval
Producción no manda header `Content-Security-Policy` (`curl -sI`: solo `strict-transport-security` y headers de Vercel) y Playwright no muestra ningún aviso de CSP. El "Content Security Policy blocks the use of eval" vino de una extensión del navegador de Martín, no de la app.

## 4. Build
| Comando | Salida | Resultado |
|---|---|---|
| `npm ci` | exit 1 | no hay `package-lock.json` en el repo |
| `npm install` | exit 0 | instala; `npm audit` reporta vulnerabilidades (se revisan en Fase 1b) |
| `npm run build` | exit 0 | `dist/assets/index-DAN7R_GO.js 440.38 kB │ gzip: 120.92 kB` |

Dependencias con rango `^` sin lockfile (regla 11): se fijan en la Fase 1a/1b.

## 5. Claves (§5.5)
- Bundle de producción: un solo JWT, con `role: anon` del proyecto `hszobstcatbyzijbdnpv`. Ningún `sb_secret_`, `sbp_` ni `service_role` (la cadena `sb_secret_` que aparece es código de la librería supabase-js).
- Claves legacy (anon y service_role): deshabilitadas en el proyecto (respuesta de la API, ver §1).
- Funciones, vistas y triggers de la base: sin claves ni `Authorization` embebidos. `cron.job` no existe (pg_cron no está instalado). Sin buckets de Storage.
- gitleaks `v8.21.2` sobre todo el historial (17 commits): 3 hallazgos. Detalle y pasos: ver chat del 2026-11-16 (el repo es público).
- Pendiente de Martín: confirmar con captura que el secreto JWT legacy quedó revocado (M-03).

## 6. Base de datos: esperado vs. real
Introspección: `docs/diagnostico/esquema-2026-11-16.json` (versión redactada: sin usuarios, sin privilegios por rol). Estructura reproducible: `supabase/tests/fixtures/esquema-produccion.sql`. En un Postgres sin Supabase se aplica después de `supabase/tests/fixtures/preludio-postgres.sql` (esquemas `extensions` y `auth`, roles y stub de `auth.uid()`); en `postgres:17.6` da exit 0 con 11 tablas, 2 vistas, 9 políticas y 5 funciones (evidencia: `.verificacion/<sha>/fixture-aplica.log`). Aplicarlo sobre el stack local de Supabase: NO VERIFICADO todavía (se hace en la Fase 2).

| Tema | Esperado (doc vieja, ESPECIFICACION §1) | Real (2026-11-16) |
|---|---|---|
| Tablas | 11 | Las 11 esperadas |
| Columnas de `profesionales` | `dias_atencion`, `hora_inicio`, `hora_fin`, `duracion`, `honorario`, `limite` | Se llaman `dias_laborales`, `horario_inicio`, `horario_fin`, `duracion_sesion_default`, `honorario_base`, `max_pacientes` (default 15); `activo` default `false` |
| Funciones | 4 + quizás de portal | 5: las 4 + `fn_updated_at`. Ninguna fija `search_path` |
| Vistas | 2 | `v_admin_dashboard`, `v_turnos_hoy` |
| Triggers | — | Ninguno (`updated_at` no se actualiza solo) |
| Extensiones | pg_cron, pg_net, btree_gist, pgcrypto | pgcrypto, uuid-ossp, pg_graphql, pg_stat_statements, supabase_vault. **Faltan** pg_cron, pg_net y btree_gist |
| Grants de tablas y privilegios por defecto | — | Ninguno: las 13 relaciones de `public` tienen `relacl` nulo y no hay filas de `pg_default_acl` en `public`. La app no puede leer ni escribir ninguna tabla por la API aunque el login funcione |
| Fechas y horas | `timestamptz` (§3.6) | `turnos.fecha` `date` + `hora_inicio`/`hora_fin` `time` sin zona |
| Integridad de tenant (§6.3) | `unique (id, profesional_id)` + FKs compuestas | No existen; FKs simples a `profesionales(id)` y `pacientes(id)` |
| FKs hacia `auth.users` | `profesionales.user_id`, `super_admin.user_id` | No existen. Tampoco FK en `referido_por` ni `habilitado_por` |
| `ON DELETE` | explícito | Sin acción explícita en `admin_log`, `codigos_referido`, `lista_espera`, `pagos` y las 3 FKs de `push_log` |
| Choques de turnos | exclusión con `btree_gist` | Solo `idx_turno_slot` (único sobre el inicio exacto); no evita solapamientos |
| NOT NULL | estados, `activo`, `created_at` obligatorios | `estado`, `activo` y `created_at` aceptan nulos |
| Índices | sin duplicados | `idx_pac_token` duplica `pacientes_token_acceso_key` |
| Estados de turno (§3.14) | incluye `cancelado_bloqueo`, `cancelado_cambio_plan` | No están en el check de `turnos.estado` |
| Planes (§2.3) | planes de §2.3 | Check con `starter`, `profesional`, `consultorio`, `clinica` |
| Frecuencias | reemplazadas por sesiones por mes (D-03) | `pacientes.frecuencia` con check `semanal`, `quincenal`, `mensual`, `bimestral`, `trimestral`; no hay tabla de recurrencias |
| Secuencias | — | `pacientes_numero_seq`, pertenece a `pacientes.numero` (`pg_get_serial_sequence`) |
| Realtime | ninguna publicación | ninguna |

El frontend no coincide con la base (otra razón por la que no funcionaría):
| Frontend (src/App.jsx) | Base real |
|---|---|
| `turnos.fecha_hora` (líneas 197–208) | `turnos.fecha` + `turnos.hora_inicio` |
| `turnos.frecuencia` (210) | no existe |
| `pacientes.hora_habitual`, `push_token`, `tutor` (179–182, 259–261) | `hora_turno`, `push_subscription`, `nombre_tutor` |
| `rpc('generar_turnos_paciente', {p_paciente_id, p_meses_adelante})` (319) | firma `(p_paciente_id, p_mes, p_anio)` |

`database-schema.sql` de la raíz del repo es un borrador viejo: no es la fuente de verdad (se archiva en la Fase 1b).

## 7. Datos y usuarios
Conteo exacto (consulta aparte; `filas_aprox = -1` en todas las tablas = nunca analizadas):
| Tabla | Filas |
|---|---|
| profesionales | 2 |
| pacientes | 5 |
| turnos | 16 (todos de abril de 2026) |
| super_admin | 1 |
| configuracion_push, push_log, pagos, bloqueos, lista_espera, codigos_referido, admin_log | 0 |

Usuarios de Auth: 3 (1 con fila de Super Admin, 2 con fila de profesional). El detalle y lo que Martín tiene que confirmar van en el chat del 2026-11-16.

## 8. Riesgos de seguridad
Riesgos: ver chat del 2026-11-16; se corrigen en Fase 2 (salvo los urgentes, que son pasos de Martín).

## 9. Recomendación para la base: reconstruir
Si Martín confirma que los 5 pacientes y 16 turnos son de prueba: **reconstruir** el esquema `public` en el mismo proyecto (los usuarios de Auth se conservan). Motivos: el modelo de "frecuencias" se reemplaza por "sesiones por mes" con recurrencias (D-03, §3); fechas sin zona en vez de `timestamptz`; sin integridad de tenant compuesta ni exclusión de choques; estados incompletos; frontend y base con nombres distintos; sin grants ni triggers; faltan btree_gist, pg_cron y pg_net. Adoptar exigiría reescribir casi todo igual.
Inventario exacto para los `drop` (orden de dependencia; la migración lleva `-- APROBADO-POR-MARTIN: AAAA-MM-DD PR #n` en la primera línea y su cita en DECISIONES.md, nunca `drop schema public cascade`):
1. Vistas: `v_turnos_hoy`, `v_admin_dashboard`.
2. Funciones: `generar_turnos_profesional(uuid, integer, integer)`, `generar_turnos_paciente(uuid, integer, integer)`, `resumen_mensual(uuid, integer, integer)`, `cancelar_turno_paciente(uuid, text, text)`, `fn_updated_at()`.
3. Políticas (9): `bloq_all`, `ref_all`, `espera_all`, `pac_all`, `pago_select`, `prof_select`, `prof_update`, `push_all`, `turno_all` (se van con sus tablas, se listan igual).
4. Tablas: `push_log`, `turnos`, `bloqueos`, `lista_espera`, `codigos_referido`, `pagos`, `admin_log`, `pacientes` (arrastra `pacientes_numero_seq`, que le pertenece), `configuracion_push`, `super_admin`, `profesionales`.
Si algún paciente es real: adoptar, con migración de frecuencias en dos pasos según §3.13 (los valores reales del check son `semanal`, `quincenal`, `mensual`, `bimestral`, `trimestral`).

## 10. Repo y modo de despliegue
Repo **público** (dueño User). `main` sin protección y sin rulesets → M-14 variante A (ruleset `proteger-main`). **Modo A (automático)**: entorno `produccion` con secretos de entorno (M-05, Fase 2d). Se pueden pushear workflows.

## 11. Dominio y hosting
Disponibilidad consultada por RDAP de NIC Argentina (`https://rdap.nic.ar/domain/<nombre>`, 2026-11-16):
| Nombre | Estado |
|---|---|
| turnapp.com.ar | registrado por otro (vence 2027-06-12) |
| turnapp.ar | registrado por otro (vence 2027-06-10) |
| turnosapp.com.ar | registrado por otro |
| turnappsalud.com.ar | libre (404 en RDAP) |
| miturnapp.com.ar | libre (404 en RDAP) |

Precios y requisitos (fuentes y fecha en DECISIONES N-03):
- **.com.ar en NIC Argentina** (recomendado): ARS 8.500 por año, alta y renovación. Requiere CUIT/CUIL y Clave Fiscal nivel 2 o superior, por Trámites a Distancia (TAD). NO VERIFICADO en nic.ar directo (la red de la sesión no llega); se confirma en la pantalla de pago.
- **.ar en NIC Argentina**: ARS 25.500 por año. No hace falta.
- **.com en un registrador a precio de costo** (por ejemplo Cloudflare): cobra en USD con tarjeta; precio NO VERIFICADO. Se descarta porque .com.ar es más barato y en pesos.

Hosting: **Cloudflare Workers con assets estáticos, plan gratuito**. Las peticiones a assets estáticos son gratis e ilimitadas (docs oficiales de precios) y en los términos de Cloudflare no aparece restricción de uso no comercial. Vercel Hobby queda solo hasta la Fase 1c: sus reglas oficiales lo restringen a uso personal no comercial.

Propuesta: **`miturnapp.com.ar`** en NIC Argentina, DNS delegado a Cloudflare, app en `https://app.miturnapp.com.ar`. Alternativa: `turnappsalud.com.ar`, descartada como primera opción porque "salud" en cada link, QR o aviso deja ver en un teléfono compartido que la persona usa un servicio de salud (regla 12, criterio conservador), y es más largo para dictar. Martín elige el nombre. Si Martín no tiene Clave Fiscal nivel 2, subirla puede tardar: conviene revisarlo ya (M-06).
