# PROGRESO — TURNAPP
Actualizado: 2026-11-16 20:30 (hora Argentina) — Arranque terminado; empieza Fase 0
Fase actual: 0 — Diagnóstico
Rama de trabajo: claude/stoic-ride-yk4por (base: main@310c1f9)
PR abierto: ninguno
Último commit verificado: 7fd26a7 — Arranque (guarda, agentes, repo, entorno)
## Arranque (terminado 2026-11-16)
- [x] 1. CLAUDE.md cargado; los 7 subagentes aparecen en la herramienta de agentes
- [x] 2. `bash .claude/hooks/probar-guardia.sh` → "TODAS LAS PRUEBAS PASARON (118 casos)", exit 0. `git push origin main` real → "BLOQUEADO por .claude/hooks/guardia.sh: push a main prohibido"
- [x] 3. YAML de los 7 `.claude/agents/*.md` válido (name, description, tools, model) con python3 + yaml, exit 0
- [x] 4. Repo público (owner User), `main` sin protección (404 "Branch not protected"), rulesets `[]` → modo A, M-14 variante A. Push de `.github/workflows/` permitido (4413979, borrado en 7fd26a7). API de environments: 403 del proxy (NO VERIFICADO)
- [x] 5. Entorno: node v22.23.4, npm 10.9.9, Docker OK (`docker run --rm hello-world` exit 0), supabase CLI 3.2.0 por npm OK, psql presente, gitleaks no instalado. HTTP: registry.npmjs.org 200, hszobstcatbyzijbdnpv.supabase.co/rest/v1/ 401 (esperado sin clave), cdn.playwright.dev 400, developer.mozilla.org 302, fcm.googleapis.com 404, turnapp-4typ.vercel.app 200. Consulta de solo lectura `select 1 as ok` → HTTP 201 `[{"ok":1}]`
- [x] 6. Pedido pendiente: M-14 variante A (se manda con el informe de Fase 0). M-01 completo.
## Checklist de la fase
- [ ] 1. Crear docs/BACKLOG.md, docs/TESTS.md, docs/MANUAL-OPERACION.md  ← PRÓXIMO
- [ ] 2. Leer el repo completo (App.jsx, App-MINIMAL, package.json, lockfile, vite, manifest, Vercel)
- [ ] 3. `npm install` (no hay lockfile) y `npm run build`
- [ ] 4. Reproducir el crash con `vite preview` + Playwright; causa raíz con archivo y línea; origen del aviso de CSP/eval
- [ ] 5. Seguridad de claves: gitleaks sobre todo el historial, JWT del bundle de producción, claves embebidas
- [ ] 6. Introspección §13.1 → .verificacion/diagnostico/ + versión redactada
- [ ] 7. Real vs. esperado; puertas traseras; supabase/tests/fixtures/esquema-produccion.sql
- [ ] 8. Conteo exacto de pacientes y turnos
- [ ] 9. Recomendación adoptar o reconstruir
- [ ] 10. Dominio y hosting con precios verificados
- [ ] 11. docs/DIAGNOSTICO.md e informe para Martín; PR "Fase 0 — Diagnóstico"
## Próximo paso
Paso 1 de la Fase 0 y seguir en orden.
## Esperando a Martín
- M-14 variante A (proteger `main` con un ruleset): se pide junto con el informe de Fase 0
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
