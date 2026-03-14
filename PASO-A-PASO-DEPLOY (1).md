# TURNAPP — Guía de Deploy Paso a Paso
## Sesión 1 Completada — Todo lo que necesitás para poner TURNAPP online

---

## Archivos incluidos en este paquete

```
turnapp-deploy/
├── index.html              ← Página de entrada
├── package.json            ← Dependencias del proyecto
├── vite.config.js          ← Configuración de Vite
├── .gitignore              ← Archivos a ignorar en Git
├── database-schema.sql     ← Base de datos para Supabase
├── public/
│   ├── manifest.json       ← Configuración PWA
│   └── favicon.svg         ← Ícono de la app
└── src/
    ├── main.jsx            ← Entry point React
    └── App.jsx             ← Aplicación completa (la que funciona)
```

---

## PASO 1: Instalar Node.js (si no lo tenés)

1. Abrí **https://nodejs.org**
2. Descargá la versión **LTS** (botón verde grande)
3. Instalalo (siguiente → siguiente → finalizar)
4. Verificá abriendo una terminal y escribiendo:
```bash
node --version
npm --version
```
Si aparecen números de versión, estás listo.

---

## PASO 2: Crear cuenta en GitHub (2 minutos)

1. Abrí **https://github.com**
2. Click en **Sign Up**
3. Completá email, contraseña, nombre de usuario
4. Verificá el email

---

## PASO 3: Crear cuenta en Vercel (2 minutos)

1. Abrí **https://vercel.com**
2. Click en **Sign Up** → **Continue with GitHub**
3. Autorizá el acceso

---

## PASO 4: Crear cuenta en Supabase (2 minutos)

1. Abrí **https://supabase.com**
2. Click en **Start your project** → registrate con GitHub
3. Click en **New Project**
   - Organization: "TURNAPP"
   - Project name: `turnapp`
   - Database Password: **elegí una y anotala**
   - Region: **South America (São Paulo)**
4. Click **Create new project** → esperá 2 minutos

---

## PASO 5: Ejecutar el esquema SQL (3 minutos)

1. En Supabase, andá a **SQL Editor** (menú lateral)
2. Click **New query**
3. Abrí el archivo `database-schema.sql` de este paquete
4. Copiá TODO el contenido y pegalo en el editor
5. Click **Run**
6. Verificá en **Table Editor** que aparezcan las tablas:
   `super_admin`, `profesionales`, `pacientes`, `turnos`, `bloqueos`, etc.

---

## PASO 6: Crear tu usuario Super Admin (2 minutos)

1. En Supabase → **Authentication** → **Users** → **Add user**
2. Poné tu email y contraseña
3. Click **Create user**
4. Copiá el **User UID** que aparece
5. Andá a **SQL Editor** y ejecutá:
```sql
INSERT INTO super_admin (user_id, nombre, email)
VALUES ('PEGAR-TU-UID-ACÁ', 'Martín', 'tu-email@mail.com');
```

---

## PASO 7: Guardar credenciales de Supabase (1 minuto)

1. En Supabase → **Settings** → **API**
2. Anotá estos dos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...`

(Los vas a necesitar en la Sesión 2 para conectar el frontend)

---

## PASO 8: Subir el proyecto a GitHub (5 minutos)

### Opción A: Desde la terminal (recomendado)

1. Abrí la terminal en la carpeta `turnapp-deploy`
2. Ejecutá estos comandos:

```bash
cd turnapp-deploy
npm install
git init
git add .
git commit -m "TURNAPP v1 - Sesión 1"
```

3. En GitHub, creá un nuevo repositorio llamado `turnapp` (dejá todo por defecto)
4. Volvé a la terminal:

```bash
git remote add origin https://github.com/TU-USUARIO/turnapp.git
git branch -M main
git push -u origin main
```

### Opción B: Subir archivos manualmente en GitHub

1. En GitHub → **New repository** → nombre: `turnapp`
2. Click **uploading an existing file**
3. Arrastrá TODOS los archivos de la carpeta `turnapp-deploy`
4. Click **Commit changes**

---

## PASO 9: Deploy en Vercel (3 minutos)

1. En Vercel → **Add New** → **Project**
2. Importá el repositorio `turnapp` de GitHub
3. Vercel detecta automáticamente que es Vite
4. Click **Deploy**
5. En 1-2 minutos tu app está viva en: `turnapp-TU-USUARIO.vercel.app`

---

## PASO 10: Verificar que funciona

Abrí la URL que te dio Vercel en:
- [ ] Tu computadora (Chrome/Firefox)
- [ ] Tu celular (Chrome Android / Safari iPhone)

Verificá:
- [ ] La landing page carga con el diseño TURNAPP
- [ ] Click en "Ver demo del profesional" → ves las 4 pestañas (Hoy, Agenda, Pacientes, Alertas)
- [ ] Click en "Panel Super Admin" → login → ves Dashboard, Profesionales, Plataforma
- [ ] Desde Pacientes → click "👁 Ver portal" → se abre el portal del paciente correcto
- [ ] Desde el portal del paciente → cancelar un turno → aparece push notification
- [ ] Desde el panel profesional → "Enviar recordatorios" → aparece push
- [ ] El botón "← Volver" funciona correctamente en todas las pantallas

---

## PASO 11 (Opcional): Dominio personalizado

1. Comprá un dominio en **namecheap.com** (ej: `turnapp.com.ar`, ~USD 10/año)
2. En Vercel → Settings → Domains → Add
3. Seguí las instrucciones de DNS

---

## ¿Qué tenemos al final de la Sesión 1?

| Componente | Estado |
|---|---|
| Landing page | ✅ Online |
| Panel profesional (4 pestañas) | ✅ Funcionando |
| Portal paciente (ultra simple) | ✅ Funcionando |
| Super Admin (Modelo A) | ✅ Funcionando |
| Base de datos (Supabase) | ✅ Creada |
| Push notifications (simuladas) | ✅ UI lista |
| PWA instalable en celular | ✅ Manifest configurado |

---

## ¿Qué falta para la Sesión 2?

1. **Conectar frontend con Supabase real** (reemplazar datos mock por datos de la DB)
2. **Login real con Supabase Auth** (el login actual es simulado)
3. **Crear profesional REAL desde el admin** (que se guarde en la DB)
4. **Turnos reales que se generan desde la función SQL**

Tiempo estimado Sesión 2: 2-3 horas de trabajo conmigo.

---

## Costos de todo lo implementado

| Servicio | Costo |
|---|---|
| GitHub | $0 |
| Vercel (hosting) | $0 |
| Supabase (base de datos) | $0 |
| Push notifications | $0 |
| Node.js / React / Vite | $0 |
| **TOTAL** | **$0** |
