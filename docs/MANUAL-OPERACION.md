# MANUAL DE OPERACIÓN — TURNAPP

Para Martín. Qué hacer en las situaciones de todos los días, sin saber programar.

## Retomar el trabajo con Claude Code
Abrí una sesión nueva en https://claude.ai/code con el repo `Consciousnessebooks/turnapp` y escribí solamente:

> Seguí

Claude Code lee `docs/PROGRESO.md`, retoma donde quedó y te contesta en 5 líneas qué hizo y qué necesita.

## Cómo mergear un PR (M-13)
1. Abrí el link del PR que te pasó Claude Code.
2. Esperá a que diga "All checks have passed". Si hay una cruz roja, no mergees y avisale.
3. Hacé lo que dice la sección "Cómo probarlo" del PR.
4. Tocá "Merge pull request" y después "Confirm merge".
5. Respondele a Claude Code: "Mergeado #n" (con el número del PR).

## Email de Supabase avisando que el proyecto se pausó
El plan gratuito pausa el proyecto si pasa un tiempo sin uso (NO VERIFICADO el plazo exacto; se verifica en la Fase 2).
1. Abrí https://supabase.com/dashboard/project/hszobstcatbyzijbdnpv
2. Tocá "Resume project" y esperá a que diga que está activo.
3. Avisale a Claude Code en la próxima sesión.

## Vencimiento del token de solo lectura de la sesión
La sesión de Claude Code consulta la base con un token de solo lectura que cargaste en el entorno. Si Claude Code te dice que la consulta de solo lectura responde 401 o 403, el token venció o se borró: generá uno nuevo con los mismos permisos (solo "Database: Read" del proyecto `hszobstcatbyzijbdnpv`) y cargalo en el mismo lugar del entorno. Nunca lo pegues en el chat.
Fecha de vencimiento del token actual: NO VERIFICADO (Claude Code no puede verla; anotala acá cuando lo generes).

## Si pegaste algo secreto en el chat por error
Tratalo como filtrado: revocá ese valor en el dashboard donde lo creaste y generá uno nuevo directo ahí. Claude Code te da los pasos exactos.
