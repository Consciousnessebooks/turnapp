# Genera supabase/tests/fixtures/esquema-produccion.sql desde la introspección de ESPECIFICACION §13.1.
# Uso: python3 -I supabase/tests/fixtures/generar_fixture.py <esquema.json sin redactar> <salida.sql>
import json,sys,re
d=json.load(open(sys.argv[1])); out=[]
w=out.append
w("-- Estructura de producción (proyecto hszobstcatbyzijbdnpv), solo estructura, sin datos.")
w(f"-- Generado el 2026-11-16 desde la introspección de solo lectura (ESPECIFICACION §13.1). {d['version_postgres'].split(' on ')[0]}.")
w("-- No editar a mano: lo genera supabase/tests/fixtures/generar_fixture.py desde la introspección completa (sin redactar),")
w("-- que queda fuera del repo en .verificacion/diagnostico/esquema-AAAA-MM-DD.json.")
w("-- Las tablas no tienen grants para anon/authenticated/service_role (relacl nulo en todas, 0 filas de pg_default_acl en public;")
w("-- consultas de solo lectura del 2026-11-16). El final de este archivo revoca lo que el stack local agrega.")
w("-- En Postgres sin Supabase, aplicar antes preludio-postgres.sql (esquemas extensions y auth, stub de auth.uid()).")
w("-- Límites conocidos: la introspección no captura dueños, OWNED BY ni parámetros de secuencias ni comentarios (se asumen")
w("-- los valores por defecto; pacientes_numero_seq pertenece a pacientes.numero). Las funciones en producción usan CRLF.\n")
for e in d["extensiones"]:
    if e["nombre"] in ("pgcrypto","uuid-ossp"): w(f'create extension if not exists "{e["nombre"]}" with schema {e["esquema"]};')
w("")
seqs=set()
for c in d["columnas"]:
    m=re.search(r"nextval\('([^']+)'",c["default"] or "")
    if m: seqs.add(m.group(1))
for s in sorted(seqs): w(f"create sequence if not exists public.{s};")
tablas=[t["tabla"] for t in d["tablas"]]
cons={}
for c in d["restricciones"]: cons.setdefault(c["tabla"].replace("public.",""),[]).append(c)
def tipo(c):
    u=c["udt"]; return {"_int4":"integer[]","int4":"integer","int8":"bigint","bool":"boolean","timestamptz":"timestamp with time zone","time":"time without time zone"}.get(u,u)
for t in tablas:
    cols=[c for c in d["columnas"] if c["tabla"]==t]
    lines=[f'  {c["columna"]} {tipo(c)}'+(f' default {c["default"]}' if c["default"] else "")+("" if c["nulo"]=="YES" else " not null") for c in cols]
    for k in sorted(cons.get(t,[]),key=lambda k:(k["tipo"]!="p",k["nombre"])):
        if k["tipo"]!="f": lines.append(f'  constraint {k["nombre"]} {k["definicion"]}')
    w(f"\ncreate table public.{t} (\n"+",\n".join(lines)+"\n);")
for t in tablas:
    for k in sorted(cons.get(t,[]),key=lambda k:k["nombre"]):
        if k["tipo"]=="f": w(f'alter table public.{t} add constraint {k["nombre"]} {k["definicion"]};')
w("")
for i in d["indices"]:
    if not re.search(r"_pkey|_key\b",i["definicion"]): w(i["definicion"]+";")
w("")
for t in d["tablas"]:
    if t["rls"]: w(f'alter table public.{t["tabla"]} enable row level security;')
w("")
for p in d["politicas"]:
    roles=",".join(p["roles"]); s=f'create policy {p["nombre"]} on public.{p["tabla"]} as {"permissive" if p["permisiva"]=="PERMISSIVE" else "restrictive"} for {p["comando"].lower()} to {roles}'
    if p["using"]: s+=f' using ({p["using"]})'
    if p["with_check"]: s+=f' with check ({p["with_check"]})'
    w(s+";")
for f in d["funciones"]: w("\n"+f["definicion"].strip()+";")
for v in d["vistas"]: w(f'\ncreate view public.{v["nombre"]} as\n{v["definicion"].strip()}')
w("\n-- Producción no tiene grants de tablas ni privilegios por defecto en public: reproducirlo sobre el stack local.")
w("revoke all on all tables in schema public from anon, authenticated, service_role;")
w("revoke all on all sequences in schema public from anon, authenticated, service_role;")
for k in ("tables","sequences","functions"):
    w(f"alter default privileges for role postgres in schema public revoke all on {k} from anon, authenticated, service_role;")
w("-- Las funciones conservan EXECUTE para PUBLIC, como en producción.")
txt="\n".join(out)+"\n"
assert not re.search(r"eyJ[A-Za-z0-9_-]{10,}|sb_secret_|sbp_",txt)
open(sys.argv[2],"w").write(txt)
