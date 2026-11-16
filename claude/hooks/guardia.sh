#!/usr/bin/env bash
# .claude/hooks/guardia.sh — hook PreToolUse de TURNAPP.
# Bloquea lo que CLAUDE.md prohíbe, sin depender de que el modelo lo recuerde.
# Lee el JSON de la herramienta por stdin. Para bloquear: mensaje por stderr y exit 2
# (exit 2 bloquea siempre, aunque falle el JSON). Si no puede leer la entrada, bloquea (falla cerrado).
# No editar desde una sesión de Claude Code: los cambios los aplica Martín (ver CLAUDE.md, "Prohibido").
# Pruebas: bash .claude/hooks/probar-guardia.sh

entrada=$(cat)

deny() {
  local motivo="BLOQUEADO por .claude/hooks/guardia.sh: $1"
  printf '%s\n' "$motivo" >&2
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "${motivo//\"/\'}"
  exit 2
}

leer_campo() {
  # $1 = ruta tipo .tool_input.command
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$entrada" | jq -r "$1 // \"\"" 2>/dev/null
    return $?
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$entrada" | python3 -I -c '
import json, sys
d = json.load(sys.stdin)
for k in sys.argv[1].strip(".").split("."):
    d = d.get(k) if isinstance(d, dict) else None
print("" if d is None else d, end="")' "$1" 2>/dev/null
    return $?
  fi
  return 99
}

herramienta=$(leer_campo .tool_name) || deny "no pude leer la entrada del hook (falta jq y python3, o el JSON es inválido)."
proyecto="${CLAUDE_PROJECT_DIR:-.}"
shopt -s nocasematch

# ---------- piezas de expresiones regulares (en variables: dentro de [[ ]] no se pueden escribir ; & |) ----------
s='[[:space:]]'
sep='[;&|()]'
nosep='[^;&|]'
fin="($s|\$|$sep)"
ini="(^|$sep|$s)"
nocomilla="[^[:space:]'\"]"

# ---------- Edit / Write / MultiEdit / NotebookEdit ----------
if [[ $herramienta =~ ^(Edit|Write|MultiEdit|NotebookEdit)$ ]]; then
  ruta=$(leer_campo .tool_input.file_path) || deny "no pude leer file_path."
  [[ -z $ruta ]] && ruta=$(leer_campo .tool_input.notebook_path)
  re_cfg='(^|/)\.claude/(settings[^/]*\.json|hooks/)'
  if [[ $ruta =~ $re_cfg ]]; then
    deny "la configuración de la guarda (.claude/settings*.json y .claude/hooks/) no se edita desde la sesión. Dejá la propuesta en docs/propuestas/ y pedísela a Martín."
  fi
  exit 0
fi

[[ $herramienta == "Bash" ]] || exit 0
cmd=$(leer_campo .tool_input.command) || deny "no pude leer el comando."

# 1. git push
re_push="(^|[^[:alnum:]_-])git($s+-[cC]$s+[^[:space:]]+)*$s+push$fin"
re_force="$s(-f|--force|--force-with-lease|--force-if-includes|--mirror|--all|--prune)($s|=|\$)"
re_plus="$s\\+[^[:space:]]+"
re_borrar="$s(--delete|-d)($s|\$)|$s:[^[:space:]]+"
re_main="(^|$s|:)(refs/heads/)?(main|master)$fin"
re_sin_rama="git($s+-[cC]$s+[^[:space:]]+)*$s+push($s+-[^[:space:]]+)*($s+[[:alnum:]_.-]+)?($s+-[^[:space:]]+)*$s*(\$|$sep)"
# 2. merge
re_merge="pulls/[0-9]+/merge|gh$s+pr$s+merge"
# 3. GitHub
re_gh_secretos="gh$s+(secret|variable|ruleset)$fin"
re_gh_workflow="gh$s+workflow$s+(run|enable|disable)$fin"
re_gh_repo="gh$s+repo$s+(edit|delete|rename|archive|unarchive)$fin"
re_gh_graphql="gh$s+pr$s+(create|edit|close|review|list|view|checkout)$fin|gh$s+issue$s"
re_gh_api="gh$s+api|api\\.github\\.com"
re_metodo_escritura="(-X|--method)($s*|=)(POST|PUT|PATCH|DELETE)|$s(-f|-F|--field|--raw-field|--input)($s|=)"
re_gh_reservado="/(git/refs|contents/|branches/[^[:space:]/]+/protection|rulesets|environments|actions/secrets|actions/variables|actions/workflows/[^[:space:]/]+/(dispatches|enable|disable)|actions/runs/[0-9]+/(approve|pending_deployments|rerun)|hooks|collaborators|keys|transfer|merges|dependabot/secrets)"
re_repo_raiz="repos/[^[:space:]/]+/[^[:space:]/'\"]+($s|['\"]|\$)"
re_patch_delete="(-X|--method)($s*|=)(PATCH|DELETE)"
# 4. Supabase producción
re_sb_flags="supabase$nosep*$s(--linked|--db-url|--project-ref)($s|=|\$)"
re_sb_cmds="supabase$s+(link|login|db$s+push|db$s+dump$s+--linked|functions$s+deploy|secrets$s+(set|unset)|migration$s+repair|config$s+push|projects$s+(create|delete)|branches$s+(create|delete))"
re_psql="(psql|pg_dump|pg_restore|pgcli)$nosep*(supabase\\.co|supabase\\.com|hszobstcatbyzijbdnpv)"
re_http_sb="(curl|wget|http|xh)$nosep*[[:alnum:]-]+\\.supabase\\.co([/:'\"]|$s|\$)"
re_http_escritura="(-X|--request)($s*|=)(POST|PUT|PATCH|DELETE)|$s(-d|--data[a-z-]*|-F|--form|--json)($s|=)"
# 5. Management API
re_mgmt="api\\.supabase\\.com"
re_mgmt_url="(api\\.supabase\\.com$nocomilla*)"
mgmt_permitida="api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/database/query/read-only"
# 6. Entorno y .env
re_env_dump="$ini(printenv|export$s+-p|declare$s+-[px]+|compgen$s+-[ev])$fin"
re_env_solo="(^|$sep)$s*env$s*(\$|$sep)"
re_environ="/proc/[^[:space:]]*/environ"
re_dotenv="(cat|less|more|head|tail|bat|cp|mv|grep|sed|awk|base64|xxd|od|strings|source|\\.)$s+$nosep*\\.env($s|\$|\\.[[:alnum:]]+|$sep)"
re_dotenv_ok="\\.env\\.example"
# 7. Configuración de la guarda
re_cfg_bash="\\.claude/(settings[^[:space:]/]*\\.json|hooks)"
re_cfg_redir=">>?$s*[^[:space:]&]*\\.claude/(settings|hooks)"
re_cfg_mod="$ini(sed$s+-i|sed$s+--in-place|perl$s+-[a-z]*i|rm|mv|cp|tee|chmod|chown|truncate|ln|dd|install|unlink|git$s+(rm|mv|checkout|restore|reset|update-index))($s|\$)"
re_disable="disableAllHooks"

revisar() {
  local t="$1"

  if [[ $t =~ $re_push ]]; then
    [[ $t =~ $re_force ]] && deny "force push, --mirror, --all y --prune están prohibidos."
    [[ $t =~ $re_plus ]] && deny "refspec con + (force) prohibido."
    [[ $t =~ $re_borrar ]] && deny "borrar ramas remotas está prohibido."
    [[ $t =~ $re_main ]] && deny "push a main prohibido: trabajá en una rama y abrí un PR."
    [[ $t =~ $re_sin_rama ]] && deny "usá el push con la rama explícita: git push -u origin <rama>."
    local rama
    rama=$(git -C "$proyecto" symbolic-ref --short -q HEAD 2>/dev/null)
    [[ $rama == main || $rama == master ]] && deny "estás en $rama: creá una rama (git switch -c fase-... --no-track origin/main) y pusheá esa."
  fi

  [[ $t =~ $re_merge ]] && deny "mergear es tarea de Martín."

  [[ $t =~ $re_gh_secretos ]] && deny "secretos, variables y reglas de GitHub los maneja Martín."
  [[ $t =~ $re_gh_workflow ]] && deny "disparar o activar workflows lo hace Martín con un botón."
  [[ $t =~ $re_gh_repo ]] && deny "la configuración del repo la cambia Martín."
  [[ $t =~ $re_gh_graphql ]] && deny "gh pr y gh issue usan GraphQL (403). Usá gh api repos/Consciousnessebooks/turnapp/pulls (ver CLAUDE.md)."
  if [[ $t =~ $re_gh_api && $t =~ $re_metodo_escritura ]]; then
    [[ $t =~ $re_gh_reservado ]] && deny "esa escritura en la API de GitHub está reservada a Martín."
    [[ $t =~ $re_repo_raiz && $t =~ $re_patch_delete ]] && deny "cambiar o borrar el repo está prohibido."
  fi

  [[ $t =~ $re_sb_flags ]] && deny "comandos de Supabase contra producción prohibidos desde la sesión."
  [[ $t =~ $re_sb_cmds ]] && deny "eso lo hace el workflow de deploy o Martín, no la sesión."
  [[ $t =~ $re_psql ]] && deny "conexión directa a la base de producción prohibida."
  [[ $t =~ $re_http_sb && $t =~ $re_http_escritura ]] && deny "escrituras contra *.supabase.co (producción) prohibidas desde la sesión."

  if [[ $t =~ $re_mgmt ]]; then
    local resto="$t" url
    while [[ $resto =~ $re_mgmt_url ]]; do
      url="${BASH_REMATCH[1]}"
      [[ $url == "$mgmt_permitida" ]] || deny "contra api.supabase.com solo se permite POST a /v1/projects/hszobstcatbyzijbdnpv/database/query/read-only."
      resto="${resto/"$url"/}"
    done
  fi

  [[ $t =~ $re_env_dump ]] && deny "no vuelques variables de entorno."
  [[ $t =~ $re_env_solo ]] && deny "no vuelques variables de entorno."
  [[ $t =~ $re_environ ]] && deny "no leas el entorno de procesos."
  if [[ $t =~ $re_dotenv && ! $t =~ $re_dotenv_ok ]]; then
    deny "no leas ni copies archivos .env reales."
  fi

  if [[ $t =~ $re_cfg_bash ]]; then
    [[ $t =~ $re_cfg_redir ]] && deny "no se escribe sobre la configuración de la guarda."
    [[ $t =~ $re_cfg_mod ]] && deny "no se modifica ni se borra la configuración de la guarda."
  fi
  [[ $t =~ $re_disable ]] && deny "desactivar hooks está prohibido."
  return 0
}

revisar "$cmd"

# 8. Scripts .sh invocados: se revisan línea por línea (salvo los de .claude/hooks/).
re_script="(^|$sep|$s)(bash|sh|zsh|source|\\.)$s+([^[:space:];&|]+\\.sh)|(^|$sep|$s)(\\./[^[:space:];&|]+\\.sh)"
re_hooks_dir='(^|/)\.claude/hooks/'
re_comentario="^$s*#"
resto="$cmd"
while [[ $resto =~ $re_script ]]; do
  archivo="${BASH_REMATCH[3]:-${BASH_REMATCH[5]}}"
  resto="${resto/"${BASH_REMATCH[0]}"/}"
  [[ $archivo =~ $re_hooks_dir ]] && continue
  for candidato in "$archivo" "$proyecto/$archivo"; do
    if [[ -f $candidato ]]; then
      while IFS= read -r linea || [[ -n $linea ]]; do
        [[ $linea =~ $re_comentario ]] && continue
        revisar "$linea"
      done < "$candidato"
      break
    fi
  done
done

exit 0
