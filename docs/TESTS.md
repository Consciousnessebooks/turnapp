# TESTS — TURNAPP

Mapa de las 8 reglas fundacionales (ESPECIFICACION §2.2) a los tests que las prueban. Lo completa `qa-testing` a medida que se escriben. Un test se lista solo si existe en el repo y pasa en CI.

| Regla | Qué tiene que probarse | Tests (archivo › nombre) | Estado |
|---|---|---|---|
| 1. Reserva automática por sesiones por mes | Generación 1/2/3/4/Más sin duplicados ni choques; extras sin tocar el patrón; backtesting §8.3 | — | Sin tests todavía |
| 2. Aislamiento de datos | Matriz RLS: paciente A no ve ni toca datos de B; solo el profesional modifica; FKs de tenant; Super Admin solo agregados | — | Sin tests todavía |
| 3. Resumen mensual (día 25) | Fechas del mes siguiente (patrón + extras), honorario y total; turnos confirmados por defecto; reloj simulado | — | Sin tests todavía |
| 4. Cancelación por el paciente | Anticipación mínima validada en el servidor; aviso al profesional; WhatsApp si falta menos | — | Sin tests todavía |
| 5. Multiplataforma | e2e en 360 y 1280 px; instalabilidad | `e2e/humo.spec.ts` (chromium-360 y chromium-1280) | Parcial: falta instalabilidad (Fases 5–6) |
| 6. Bloqueo por el profesional | Día, franja o varios días; cancela afectados y manda un mensaje a cada paciente (en el piloto: mensaje genérico o fecha de regreso) | — | Sin tests todavía |
| 7. Cambio de sesiones por mes sin huecos | Desde una fecha; no toca el pasado; detecta choques; lista de horarios liberados | — | Sin tests todavía |
| 8. Honorarios individuales | Cambio afecta solo futuros no cancelados desde la fecha; el honorario aparece en todos los avisos de turnos y montos | — | Sin tests todavía |

## Flujos críticos (ESPECIFICACION §8.1)
| Flujo | Tests | Estado |
|---|---|---|
| Landing → Login → panel o error controlado (dos roles) | `e2e/humo.spec.ts` › "Ver demo" (encabezado), "Admin" (encabezado), "Demo profesional" (centro), "Super Admin" (centro): lleva al login y el ingreso da error controlado; "Volver" desde el login regresa a la landing | Parcial: cubre el error controlado sin backend; falta llegar al panel con login real (Fase 2/3). Pasa local en 17505e7 (10/10); CI desde 1b-1 |
| Alta de paciente y "Pegar lista" | — | Sin tests todavía |
| Portal del paciente y cancelación | — | Sin tests todavía |
| Bloqueo y feriado | — | Sin tests todavía |
| Offline e instalación | — | Sin tests todavía |
