#!/usr/bin/env bash
# Pruebas de .claude/hooks/guardia.sh. Uso: bash .claude/hooks/probar-guardia.sh
# Crea repos de prueba temporales (uno en una rama de trabajo y otro en main) y verifica
# que la guarda bloquee lo prohibido y deje pasar el trabajo normal. No toca el repo real
# ni ejecuta ninguno de los comandos: solo se los pasa a la guarda como texto.
set -u
dir_hooks="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
guardia="$dir_hooks/guardia.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git init -q "$tmp/rama" && git -C "$tmp/rama" symbolic-ref HEAD refs/heads/fase-prueba
git init -q "$tmp/main" && git -C "$tmp/main" symbolic-ref HEAD refs/heads/main
printf 'npm test\n' > "$tmp/script-bueno.sh"
printf '# comentario: git push origin main\nnpm ci\ngit push origin main\n' > "$tmp/script-malo.sh"

fallos=0; total=0
json_bash() { python3 -I -c 'import json,sys; print(json.dumps({"tool_name":"Bash","tool_input":{"command":sys.argv[1]}}))' "$1"; }
json_archivo() { python3 -I -c 'import json,sys; print(json.dumps({"tool_name":sys.argv[1],"tool_input":{"file_path":sys.argv[2]}}))' "$1" "$2"; }

probar() { # $1 = esperado (BLOQUEA|PASA), $2 = proyecto, $3 = JSON, $4 = descripción
  total=$((total+1))
  local salida codigo
  salida=$(printf '%s' "$3" | CLAUDE_PROJECT_DIR="$2" bash "$guardia" 2>&1 >/dev/null); codigo=$?
  local obtenido=PASA; [[ $codigo -eq 2 ]] && obtenido=BLOQUEA
  if [[ $obtenido != "$1" ]]; then
    fallos=$((fallos+1)); printf 'FALLA  esperado=%-7s obtenido=%-7s %s %s\n' "$1" "$obtenido" "$4" "$salida"
  else
    printf 'ok     %-7s %s\n' "$1" "$4"
  fi
}
b() { probar BLOQUEA "$tmp/rama" "$(json_bash "$1")" "$1"; }
p() { probar PASA "$tmp/rama" "$(json_bash "$1")" "$1"; }

# --- Debe bloquear ---
b 'git push origin main'
b 'git push -u origin HEAD:main'
b 'git push origin fase-1:refs/heads/main'
b 'git push --force origin fase-1'
b 'git push --force-with-lease origin fase-1'
b 'git push origin +fase-1'
b 'git push origin --delete fase-1'
b 'git push origin :fase-1'
b 'git push'
b 'git push -u origin'
b 'git -C /tmp/x push origin main'
b 'git push --all origin'
b 'git push --mirror origin'
b 'gh pr merge 3 --squash'
b 'gh api -X PUT repos/Consciousnessebooks/turnapp/pulls/3/merge'
b 'gh api repos/Consciousnessebooks/turnapp/pulls/3/merge -X PUT'
b "gh pr create --title 'Fase 0'"
b 'gh issue list'
b 'gh secret set SUPABASE_ACCESS_TOKEN'
b 'gh variable set X --body 1'
b 'gh workflow run deploy-produccion.yml'
b 'gh repo edit --visibility public'
b 'gh api -X PUT repos/Consciousnessebooks/turnapp/contents/a.txt -f message=x -f content=eA=='
b 'gh api -X DELETE repos/Consciousnessebooks/turnapp/git/refs/heads/fase-1'
b 'gh api -X PATCH repos/Consciousnessebooks/turnapp/git/refs/heads/main -f sha=abc'
b 'gh api -X PUT repos/Consciousnessebooks/turnapp/branches/main/protection --input p.json'
b 'gh api -X POST repos/Consciousnessebooks/turnapp/rulesets --input r.json'
b 'gh api -X PUT repos/Consciousnessebooks/turnapp/environments/produccion'
b 'gh api -X POST repos/Consciousnessebooks/turnapp/actions/workflows/deploy.yml/dispatches -f ref=main'
b 'gh api -X PATCH repos/Consciousnessebooks/turnapp -f visibility=public'
b 'gh api -X DELETE repos/Consciousnessebooks/turnapp'
b 'npx supabase link --project-ref hszobstcatbyzijbdnpv'
b 'npx supabase db push'
b 'npx supabase db push --dry-run --db-url postgresql://x'
b 'npx supabase functions deploy enviar-push'
b 'npx supabase secrets set VAPID_PRIVATE_KEY=x'
b 'npx supabase migration repair 20260101 --status applied'
b 'npx supabase config push'
b 'npx supabase gen types typescript --linked'
b 'psql "postgresql://postgres@db.hszobstcatbyzijbdnpv.supabase.co:5432/postgres" -c "select 1"'
b 'pg_dump -h aws-0-sa-east-1.pooler.supabase.com -U postgres'
b "curl -X POST https://hszobstcatbyzijbdnpv.supabase.co/rest/v1/turnos -d '{}'"
b "curl https://hszobstcatbyzijbdnpv.supabase.co/functions/v1/enviar-push --json '{}'"
b 'curl -s https://api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/api-keys'
b "curl -X POST https://api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/database/query -d '{\"query\":\"select 1\"}'"
b 'curl -X DELETE https://api.supabase.com/v1/projects/otro'
b "curl -X POST https://api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/database/query/read-only https://api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/secrets"
b 'printenv'
b 'env'
b 'env | grep KEY'
b 'export -p'
b 'declare -px'
b 'cat .env'
b 'cat .env.local'
b 'cp .env.production /tmp/x'
b 'cat /proc/self/environ'
b "sed -i 's/deny/x/' .claude/hooks/guardia.sh"
b "echo '{}' > .claude/settings.json"
b "echo '{}' >> .claude/settings.local.json"
b 'rm .claude/hooks/guardia.sh'
b 'mv .claude/settings.json /tmp/'
b 'git rm .claude/hooks/guardia.sh'
b 'chmod 000 .claude/hooks/guardia.sh'
b "echo '{\"disableAllHooks\": true}' > /tmp/x.json"
b "bash $tmp/script-malo.sh"
b "sh $tmp/script-malo.sh && echo listo"
probar BLOQUEA "$tmp/rama" "$(json_archivo Edit .claude/settings.json)" 'Edit .claude/settings.json'
probar BLOQUEA "$tmp/rama" "$(json_archivo Write /repo/.claude/settings.local.json)" 'Write .claude/settings.local.json'
probar BLOQUEA "$tmp/rama" "$(json_archivo Write /root/.claude/settings.json)" 'Write ~/.claude/settings.json'
probar BLOQUEA "$tmp/rama" "$(json_archivo Write .claude/hooks/guardia.sh)" 'Write .claude/hooks/guardia.sh'
probar BLOQUEA "$tmp/rama" "$(json_archivo MultiEdit /repo/.claude/hooks/probar-guardia.sh)" 'MultiEdit .claude/hooks/probar-guardia.sh'
probar BLOQUEA "$tmp/main" "$(json_bash 'git push -u origin HEAD')" 'git push -u origin HEAD (parado en main)'
probar BLOQUEA "$tmp/main" "$(json_bash 'git push -u origin fase-x')" 'git push -u origin fase-x (parado en main)'
probar BLOQUEA "$tmp/rama" 'esto no es JSON' 'entrada inválida (falla cerrado)'

# --- Debe dejar pasar ---
p 'git push -u origin fase-0-diagnostico'
p 'git push origin fase-1:fase-1'
p 'git push -u origin fase-2b-agenda 2>&1 | tail -5'
p 'git status --porcelain'
p 'git log --oneline -5'
p 'git fetch origin --prune'
p 'git switch -c fase-1a-hotfix --no-track origin/main'
p 'git merge origin/main'
p 'git diff main...HEAD --stat'
p 'npx supabase start'
p 'npx supabase db reset'
p 'npx supabase test db'
p 'npx supabase gen types typescript --local > src/lib/database.types.ts'
p 'npx supabase --version'
p "curl -sS -X POST https://api.supabase.com/v1/projects/hszobstcatbyzijbdnpv/database/query/read-only -H 'Content-Type: application/json' -d '{\"query\":\"select 1 as ok\"}'"
p "curl -s -o /dev/null -w '%{http_code}' https://hszobstcatbyzijbdnpv.supabase.co/rest/v1/"
p 'cat .env.example'
p 'cp .env.example .env.local.example'
p "gh api repos/Consciousnessebooks/turnapp --jq '{private, visibility}'"
p 'gh api repos/Consciousnessebooks/turnapp/branches/main/protection'
p 'gh api repos/Consciousnessebooks/turnapp/rulesets'
p 'gh api repos/Consciousnessebooks/turnapp/environments'
p "gh api repos/Consciousnessebooks/turnapp/pulls -f title='Fase 0 — Diagnóstico' -f head='fase-0-diagnostico' -f base=main -F body=@/tmp/pr.md --jq .html_url"
p 'gh api -X PATCH repos/Consciousnessebooks/turnapp/pulls/3 -F body=@/tmp/pr.md'
p 'gh api repos/Consciousnessebooks/turnapp/issues/3/comments -F body=@/tmp/c.md'
p "gh api repos/Consciousnessebooks/turnapp/commits/abc123/check-runs --jq '.check_runs[] | .name'"
p "gh api 'repos/Consciousnessebooks/turnapp/pulls?state=all&per_page=10' --jq '.[] | .number'"
p 'gh run download 123 -n diagnostico'
p 'npm ci && npm run build'
p 'npx vite preview --port 4173'
p 'npx playwright test e2e/humo.spec.ts'
p 'sudo dockerd > /tmp/dockerd.log 2>&1 &'
p 'docker run --rm hello-world'
p 'gitleaks detect --source . --log-opts="--all" --redact'
p 'cat .claude/settings.json'
p 'bash .claude/hooks/probar-guardia.sh'
p 'python3 -I scripts/validar_agentes.py .claude/agents/arquitecto-supabase.md'
p 'grep -rn "secrets.SUPABASE_" .github/workflows/'
p 'echo $HOME'
p "bash $tmp/script-bueno.sh"
probar PASA "$tmp/rama" "$(json_archivo Write src/App.tsx)" 'Write src/App.tsx'
probar PASA "$tmp/rama" "$(json_archivo Edit docs/PROGRESO.md)" 'Edit docs/PROGRESO.md'
probar PASA "$tmp/rama" "$(json_archivo Edit .claude/agents/revisor-codigo.md)" 'Edit .claude/agents/revisor-codigo.md'
probar PASA "$tmp/rama" '{"tool_name":"Read","tool_input":{"file_path":"README.md"}}' 'Read (otra herramienta: este hook no la evalúa)'

echo "----"
if [[ $fallos -eq 0 ]]; then
  echo "TODAS LAS PRUEBAS PASARON ($total casos)"
else
  echo "FALLARON $fallos de $total casos"; exit 1
fi
