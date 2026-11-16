# PROGRESO — TURNAPP
Actualizado: 2026-11-13 00:00 (hora Argentina) — plantilla inicial del kit; la primera sesión la reemplaza
Fase actual: Arranque
Rama de trabajo: main (base: main@<sha al empezar>)
PR abierto: ninguno
Último commit verificado: ninguno — todavía no se corrió nada
## Checklist de la fase
- [ ] 1. Confirmar que CLAUDE.md está entre las instrucciones cargadas y que aparecen los 7 subagentes (arquitecto-supabase, auditor-seguridad, especialista-pwa-push, frontend-ux, qa-testing, revisor-codigo, producto-negocio)  ← PRÓXIMO
- [ ] 2. `bash .claude/hooks/probar-guardia.sh` → "TODAS LAS PRUEBAS PASARON"; un intento real de push a main desde una rama local de prueba queda "BLOQUEADO por .claude/hooks/guardia.sh"
- [ ] 3. Validar el frontmatter YAML de `.claude/agents/*.md` con python3 + yaml (name, description, tools, model)
- [ ] 4. Detectar visibilidad, plan y protección del repo (ESPECIFICACION §5.3) y anotar el modo de despliegue (A o M) en DECISIONES.md
- [ ] 5. Diagnóstico del entorno (ESPECIFICACION §9, Arranque, paso 5): node, npm, Docker, supabase CLI, red, consulta de solo lectura
- [ ] 6. Mandar a Martín los pedidos que falten (M-14 según el caso, M-01 incompleto) y seguir con la Fase 0 en una rama nueva
## Próximo paso
Confirmar el paso 1 y seguir la checklist en orden; al terminar el paso 6, crear la rama `fase-0-diagnostico` desde origin/main, mover este archivo a la checklist de la Fase 0 (ESPECIFICACION §9) y pushear.
## Esperando a Martín
- (nada todavía)
## Decisiones pendientes de Martín
- Adoptar o reconstruir la base (se pregunta en el informe de Fase 0)
- Dominio a comprar (se propone en el informe de Fase 0)
- Si el repo es privado y gratuito: hacerlo público o mantenerlo privado (modo M)
- Profesional piloto (se pregunta en la Puerta del piloto, M-16)
## Problemas conocidos e intentos fallidos
- (nada todavía)
## Historial (una línea por sesión, la más nueva arriba)
- 2026-11-13 — kit subido por Martín a main
