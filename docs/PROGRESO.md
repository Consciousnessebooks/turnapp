# PROGRESO — TURNAPP
Actualizado: 2026-11-16 21:30 (hora Argentina) — Fase 0 hecha, en revisión
Fase actual: 0 — Diagnóstico
Rama de trabajo: claude/stoic-ride-yk4por (base: main@310c1f9)
PR abierto: ninguno
Último commit verificado: 13b2e09 — Fase 0 (diagnóstico)
## Arranque (terminado 2026-11-16)
- [x] 1. CLAUDE.md cargado; los 7 subagentes aparecen en la herramienta de agentes
- [x] 2. `bash .claude/hooks/probar-guardia.sh` → "TODAS LAS PRUEBAS PASARON (118 casos)", exit 0. `git push origin main` real → "BLOQUEADO por .claude/hooks/guardia.sh: push a main prohibido"
- [x] 3. YAML de los 7 `.claude/agents/*.md` válido (name, description, tools, model) con python3 + yaml, exit 0
- [x] 4. Repo público (owner User), `main` sin protección (404 "Branch not protected"), rulesets `[]` → modo A, M-14 variante A. Push de `.github/workflows/` permitido (4413979, borrado en 7fd26a7). API de environments: 403 del proxy (NO VERIFICADO)
- [x] 5. Entorno: node v22.23.4, npm 10.9.9, Docker OK (`docker run --rm hello-world` exit 0), supabase CLI 3.2.0 por npm OK, psql presente, gitleaks no instalado. HTTP: registry.npmjs.org 200, hszobstcatbyzijbdnpv.supabase.co/rest/v1/ 401 (esperado sin clave), cdn.playwright.dev 400, developer.mozilla.org 302, fcm.googleapis.com 404, turnapp-4typ.vercel.app 200. Consulta de solo lectura `select 1 as ok` → HTTP 201 `[{"ok":1}]`
- [x] 6. Pedido pendiente: M-14 variante A (se manda con el informe de Fase 0). M-01 completo.
## Checklist de la fase
- [x] 1. docs/BACKLOG.md, docs/TESTS.md (8 reglas + flujos), docs/MANUAL-OPERACION.md creados
- [x] 2. Repo leído: un solo src/App.jsx (1182 líneas); no existe App-MINIMAL.jsx; sin lockfile; sin config de Vercel en el repo
- [x] 3. `npm ci` exit 1 (sin lockfile, diagnóstico) · `npm install` exit 0 · `npm run build` exit 0 → `index-DAN7R_GO.js 440.38 kB` (mismo hash que producción)
- [x] 4. Crash reproducido con Playwright en local y producción: `e is not a function` → sourcemap src/App.jsx:456 `onSuccess` (App pasa `onLogin`, línea 352). CSP/eval: extensión del navegador (producción no manda CSP)
- [x] 5. gitleaks v8.21.2 (Docker) exit 1, 3 hallazgos (detalle solo en el chat). Bundle de producción: solo JWT `anon`. Claves legacy deshabilitadas (API: "Legacy API keys are disabled")
- [x] 6. Introspección §13.1 por la consulta de solo lectura (HTTP 201); cron.job no existe (pg_cron ausente); versión commiteable en docs/diagnostico/esquema-2026-11-16.json
- [x] 7. Real vs. esperado en DIAGNOSTICO §6; puerta trasera posible: usuario2 (a confirmar); fixture aplica en postgres:17.6 (11 tablas, 2 vistas, 9 políticas, 5 funciones)
- [x] 8. Conteo exacto: 2 profesionales, 5 pacientes, 16 turnos (abril 2026), 1 super_admin
- [x] 9. Recomendación: reconstruir (DECISIONES N-04)
- [x] 10. Dominio: miturnapp.com.ar libre por RDAP; NIC ARS 8.500/año (NO VERIFICADO en nic.ar directo); hosting Cloudflare Workers
- [ ] 11. Puerta de revisión y PR "Fase 0 — Diagnóstico"  ← PRÓXIMO
## Próximo paso
Cerrar la puerta de revisión, abrir el PR de Fase 0 y mandar el informe a Martín. La Fase 1a (hotfix) está lista en la rama local `fase-1a-hotfix-local` (commit cb3c62d) y se sube a `claude/stoic-ride-yk4por` cuando se mergee la Fase 0 (el entorno no permite pushear otra rama).
## Esperando a Martín
- M-14 variante A (proteger `main` con un ruleset)
- M-03: captura de que el secreto JWT legacy quedó revocado; cambio de las dos contraseñas expuestas (detalle en el chat)
- Confirmar si usuario2 y los 5 pacientes son de prueba
- Decisiones: "Reconstruir" o "Adoptar"; nombre de dominio
## Decisiones pendientes de Martín
- Adoptar o reconstruir la base (se pregunta en el informe de Fase 0)
- Dominio a comprar (se propone en el informe de Fase 0)
- Profesional piloto (se pregunta en la Puerta del piloto, M-16)
## Problemas conocidos e intentos fallidos
- La sesión solo puede pushear a `claude/stoic-ride-yk4por` (restricción del entorno): la Fase 0 usa esa rama en vez de `fase-0-diagnostico` (ver DECISIONES).
- La API REST `repos/.../environments` responde 403 desde el proxy de la sesión: no se puede leer qué entornos hay.
- Un comando de Bash que mezcla un GET a `*.supabase.co` con un POST cualquiera lo bloquea la guarda: separar los comandos.
## Historial (una línea por sesión, la más nueva arriba)
- 2026-11-16 — Arranque completo (guarda, agentes, repo público → modo A, entorno con Docker y consulta read-only OK); empieza Fase 0
- 2026-11-13 — kit subido por Martín a main
