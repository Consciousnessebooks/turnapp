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
Introspección completa: `docs/diagnostico/esquema-2026-11-16.json` (sin usuarios). Estructura reproducible: `supabase/tests/fixtures/esquema-produccion.sql` (aplica sin errores en Postgres 17.6 limpio: 11 tablas, 2 vistas, 9 políticas, 5 funciones).

| Tema | Esperado (doc vieja, ESPECIFICACION §1) | Real (2026-11-16) |
|---|---|---|
| Tablas | 11 | Las 11 esperadas. RLS activo en 9; sin RLS: `super_admin`, `configuracion_push` |
| Columnas de `profesionales` | `dias_atencion`, `hora_inicio`, `hora_fin`, `duracion`, `honorario`, `limite` | Se llaman `dias_laborales`, `horario_inicio`, `horario_fin`, `duracion_sesion_default`, `honorario_base`, `max_pacientes`; `activo` default `false` |
| Funciones | 4 + quizás de portal | 5: las 4 + `fn_updated_at` (sin trigger que la use). Ninguna `security definer`; todas ejecutables por `anon` y `authenticated` |
| Vistas | 2 | `v_admin_dashboard`, `v_turnos_hoy`, sin `security_invoker` |
| Triggers | — | Ninguno (`updated_at` no se actualiza solo) |
| Extensiones | pg_cron, pg_net, btree_gist, pgcrypto | pgcrypto, uuid-ossp, pg_graphql, pg_stat_statements, supabase_vault. **Faltan** pg_cron, pg_net y btree_gist |
| Grants de tablas a `anon`/`authenticated` | — | Ninguno (`relacl` nulo; `has_table_privilege` falso en las 13 relaciones). La app no puede leer ni escribir ninguna tabla por la API aunque el login funcione |
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
| turnos | 16 (todos entre 2026-04-01 y 2026-04-29) |
| super_admin | 1 |
| configuracion_push, push_log, pagos, bloqueos, lista_espera, codigos_referido, admin_log | 0 |

Usuarios de Auth (emails redactados):
| # | id | Email | Creado | Último ingreso | Rol en la base |
|---|---|---|---|---|---|
| usuario1 | 49d02705-9df3-4690-8ab5-5dbe6183fff9 | usuario1@gmail… | 2026-03-13 | 2026-03-19 | fila de `super_admin` |
| usuario2 | b0bc5f01-8d84-46be-b1de-f943e676fd46 | usuario2@test… | 2026-03-16 | nunca | profesional |
| usuario3 | 29070354-48f5-41af-b413-72241422a30c | usuario3@test… | 2026-03-19 | nunca (email sin confirmar) | profesional |

Posibles puertas traseras a confirmar por Martín: `usuario2` no figuraba en la documentación (ver chat). No hay otras filas en `super_admin`.

## 8. Riesgos de seguridad
Riesgos: ver chat del 2026-11-16; se corrigen en Fase 2 (salvo los urgentes, que son pasos de Martín).

## 9. Recomendación para la base: reconstruir
Si Martín confirma que los 5 pacientes y 16 turnos son de prueba: **reconstruir** el esquema `public` en el mismo proyecto (los usuarios de Auth se conservan). Motivos: el frontend y la base no coinciden en nombres; no hay grants ni triggers; las funciones no validan permisos; el modelo de "frecuencias" se reemplaza por "sesiones por mes" (D-03) y faltan extensiones (btree_gist para evitar choques, pg_cron, pg_net). Adoptar exigiría reescribir casi todo igual, arrastrando objetos inseguros. La reconstrucción empieza con `drop` explícito de cada objeto listado en §6 (nunca `drop schema public cascade`) y requiere el "Reconstruir" escrito de Martín.

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

Propuesta: **`turnappsalud.com.ar`** en NIC Argentina, DNS delegado a Cloudflare, app en `https://app.turnappsalud.com.ar`. Alternativa: `miturnapp.com.ar`. Martín elige el nombre.
