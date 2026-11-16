# PROGRESO — TURNAPP
Actualizado: 2026-11-16 20:58 (hora Argentina) — Fase 1a revisada; el "21:30" que quedó en main por #2 era un error de hora (real: ~20:30)
Fase actual: 1a — Hotfix
Rama de trabajo: claude/stoic-ride-yk4por (base: 84494b1)
PR abierto: ninguno todavía (Fase 1a)
Último commit verificado: 712cc02 — npm ci, build, humo 10/10, gitleaks del PR y bundle sin claves, exit 0 (.verificacion/712cc02/)
## Arranque (terminado 2026-11-16)
- [x] 1. CLAUDE.md cargado; los 7 subagentes aparecen en la herramienta de agentes
- [x] 2. `bash .claude/hooks/probar-guardia.sh` → "TODAS LAS PRUEBAS PASARON (118 casos)", exit 0. `git push origin main` real → "BLOQUEADO por .claude/hooks/guardia.sh: push a main prohibido"
- [x] 3. YAML de los 7 `.claude/agents/*.md` válido (name, description, tools, model) con python3 + yaml, exit 0
- [x] 4. Repo público (owner User), `main` sin protección (404 "Branch not protected"), rulesets `[]` → modo A, M-14 variante A. Push de `.github/workflows/` permitido (4413979, borrado en 7fd26a7). API de environments: 403 del proxy (NO VERIFICADO)
- [x] 5. Entorno: node v22.23.4, npm 10.9.9, Docker OK (`docker run --rm hello-world` exit 0), supabase CLI 3.2.0 por npm OK, psql presente, gitleaks no instalado. HTTP: registry.npmjs.org 200, hszobstcatbyzijbdnpv.supabase.co/rest/v1/ 401 (esperado sin clave), cdn.playwright.dev 400, developer.mozilla.org 302, fcm.googleapis.com 404, turnapp-4typ.vercel.app 200. Consulta de solo lectura `select 1 as ok` → HTTP 201 `[{"ok":1}]`
- [x] 6. Pedido pendiente: M-14 variante A (se manda con el informe de Fase 0). M-01 completo.
## Fase 0 (mergeada 2026-11-16, #2 → 84494b1)
- Diagnóstico en docs/DIAGNOSTICO.md; 5 revisores APROBADO.
## Checklist de la fase
- [x] 1. Login conectado a handleLogin con error controlado; props del panel; Admin cierra sesión; claves desde variables (394f615)
- [x] 2. Versiones exactas, package-lock.json, @playwright/test 1.63.0, .env.example (414ee71)
- [x] 3. e2e/humo.spec.ts (qa-testing) en 360 y 1280: 10 passed, exit 0 (17505e7)
- [x] 4. Puerta de revisión: revisor-codigo, qa-testing, frontend-ux y auditor-seguridad APROBADO (712cc02)
- [ ] 5. PR "Fase 1a — Hotfix" y merge de Martín  ← PRÓXIMO
## Próximo paso
Abrir el PR de la Fase 1a y esperar el merge; después, Fase 1b.
## Esperando a Martín
- Decisiones: "Reconstruir" o "Adoptar"; nombre de dominio; si las cuentas y los 5 pacientes son de prueba
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
