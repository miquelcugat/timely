# TIMELY - CHECKLIST PASO A PASO

**SIGUE ESTO EXACTO. SI COMPLETAS TODO, TIENES APP EN PRODUCCIÓN EN 2 HORAS.**

---

## PREPARACIÓN (5 MIN)

- [ ] Abre NotePad y escribe todas tus contraseñas (email, GitHub, Stripe, Supabase)
- [ ] Ten este checklist abierto en otra ventana
- [ ] Abre Terminal/PowerShell

---

## FASE 1: CREAR CUENTAS (15 MINUTOS)

### GitHub
- [ ] Ve a github.com
- [ ] Click "Sign up"
- [ ] Email: cugat23@gmail.com
- [ ] Username: algo tipo "cugat23" o "timely-dev"
- [ ] Contraseña: escribe en NotePad
- [ ] Verifica email (Inbox)
- [ ] LISTO

### Supabase
- [ ] Ve a supabase.com
- [ ] Click "Sign up"
- [ ] Email: cugat23@gmail.com
- [ ] Contraseña: nueva
- [ ] Verifica email
- [ ] Click "New project"
- [ ] Nombre: "timely"
- [ ] Region: "Frankfurt" (Europa)
- [ ] Database password: genera una aleatoria, anótala
- [ ] ESPERA 3-5 MINUTOS a que se cree
- [ ] Cuando veas el dashboard con SQL editor = LISTO

### Stripe
- [ ] Ve a stripe.com
- [ ] "Sign up"
- [ ] Email: cugat23@gmail.com
- [ ] Contraseña: nueva
- [ ] País: España
- [ ] Business name: "Timely"
- [ ] Verifica email
- [ ] LISTO

### Vercel
- [ ] Ve a vercel.com
- [ ] Click "Sign up"
- [ ] Click "Continue with GitHub"
- [ ] Autoriza Vercel
- [ ] LISTO (conectado automáticamente)

---

## FASE 2: CONFIGURAR BASE DE DATOS (10 MINUTOS)

### En Supabase Dashboard

- [ ] Click en "SQL Editor" (izquierda)
- [ ] Click "New Query"
- [ ] **COPIA TODO el archivo `supabase-setup.sql`**
  - (Es el archivo que creé con CREATE TABLE, etc)
- [ ] PEGA en el SQL editor
- [ ] Click "Run"
- [ ] Si dice "success" = perfecto
- [ ] Si dice "error" = notifícame

### Copiar credenciales

- [ ] Ve a "Settings" (rueda abajo a la izquierda)
- [ ] Click "API"
- [ ] Copia: **Project URL**
  - Guárdalo como `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copia: **anon public** (la key debajo)
  - Guárdalo como `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] NOTA: no cierres esta ventana aún

---

## FASE 3: OBTENER STRIPE KEYS (5 MINUTOS)

### En Stripe Dashboard

- [ ] Ve a stripe.com
- [ ] Entra en tu dashboard
- [ ] Busca "API Keys" (o Settings → Developers)
- [ ] Copia: **Publishable key** (empieza con "pk_test_")
  - Guárdalo como `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Copia: **Secret key** (empieza con "sk_test_")
  - Guárdalo como `STRIPE_SECRET_KEY`

---

## FASE 4: DESCARGAR CÓDIGO (5 MINUTOS)

### En Terminal:

```bash
cd Desktop
mkdir timely
cd timely
```

(Esto crea una carpeta en tu Desktop)

### Copiar archivos

**OPCIÓN A: Si sabes usar Git**
```bash
git clone https://github.com/TU_USUARIO/timely.git .
```

**OPCIÓN B: Si no sabes Git (MEJOR)**
- Ve a la carpeta que creaste: Desktop/timely
- Copia TODOS estos archivos aquí:
  - package.json
  - next.config.js
  - tailwind.config.js
  - postcss.config.js
  - .gitignore
  - .env.local (ver abajo)
  - Carpeta "pages" (con todos los .js)
  - Carpeta "styles" (con globals.css)
  - Carpeta "lib" (con supabaseClient.js)
  - Archivos: README.md, LAUNCH-STRATEGY.md, supabase-setup.sql

---

## FASE 5: CONFIGURAR .env.local (5 MINUTOS)

### En la carpeta timely:

- [ ] Abre `.env.local` con NotePad
- [ ] Reemplaza:

```
NEXT_PUBLIC_SUPABASE_URL=PEGA_AQUI_LA_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=PEGA_AQUI_LA_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX
NEXTAUTH_SECRET=tmjGF7kR9mP2xL5wQ8nB1cV4dJ6fH9kL
NEXTAUTH_URL=http://localhost:3000
```

Con tus valores reales.

- [ ] Guarda archivo (Ctrl+S)
- [ ] IMPORTANTE: **NO SUBAS ESTO A GITHUB** (está en .gitignore)

---

## FASE 6: INSTALAR DEPENDENCIAS (10 MINUTOS)

### En Terminal (en carpeta timely):

```bash
npm install
```

ESPERA. Dirá cosas. Cuando termine dirá "added 300+ packages" o algo así.

Si dice error type:
```
npm install --legacy-peer-deps
```

---

## FASE 7: TEST LOCAL (5 MINUTOS)

### En Terminal (carpeta timely):

```bash
npm run dev
```

- [ ] Abre navegador: http://localhost:3000
- [ ] Deberías ver landing page azul
- [ ] Si ves la página = ¡FUNCIONA!
- [ ] Click "Entra" → deberías ver login form
- [ ] Prueba regístrate: test@timely.app / demo123
- [ ] Si entras al dashboard = FUNCIONA COMPLETAMENTE

Si algo falla aquí: DETENTE Y AVÍSAME.

---

## FASE 8: SUBIR A GITHUB (5 MINUTOS)

### En Terminal:

```bash
git init
git add .
git commit -m "Initial commit - Timely MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/timely.git
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu usuario de GitHub.

- [ ] Ve a github.com/TU_USUARIO/timely
- [ ] Deberías ver los archivos en el repo
- [ ] LISTO

---

## FASE 9: DEPLOY EN VERCEL (3 MINUTOS)

### En Vercel:

- [ ] Ve a vercel.com
- [ ] Click "New Project"
- [ ] Busca "timely" (tu repo)
- [ ] Click "Import"
- [ ] En "Environment Variables" (importante):
  - [ ] Añade todas las variables de `.env.local`
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - [ ] STRIPE_SECRET_KEY
  - [ ] NEXTAUTH_SECRET
  - [ ] NEXTAUTH_URL = https://tu-proyecto.vercel.app (NO localhost)
- [ ] Click "Deploy"
- [ ] ESPERA 2-3 MINUTOS

### Cuando esté listo:

- [ ] Vercel te muestra URL tipo: https://timely-XXXXX.vercel.app
- [ ] Click en URL
- [ ] Deberías ver tu app en producción
- [ ] PRUEBA: Regístrate con otro email
- [ ] PRUEBA: Crea proyecto, usa timer
- [ ] ¿FUNCIONA? ¡LISTO!

---

## FASE 10: LANZAMIENTO (1 HORA)

### Tweet/LinkedIn:

- [ ] Abre Twitter
- [ ] Escribe post: "Lancé Timely, app para freelancers..."
- [ ] Enlaza tu URL de Vercel
- [ ] Publica
- [ ] Pinea el tweet

### Slack:

- [ ] Busca servidor "Freelancers España" (Google)
- [ ] En canal #general o #proyectos
- [ ] Escribe: "Hice Timely para saber cuánto gano por hora. Gratis. Feedback?"
- [ ] Enlaza app

### WhatsApp:

- [ ] Manda a 10 freelancers que conozcas
- [ ] "Hice una app, pruébala 2 min, dame feedback"
- [ ] Enlaza URL

### Espera 24h

- [ ] Revisa cuántos usuarios tiene
- [ ] Recolecta feedback

---

## CHECKLIST FINAL

- [ ] GitHub cuenta creada
- [ ] Supabase proyecto creado
- [ ] BD con tablas creadas
- [ ] Stripe keys obtenidas
- [ ] .env.local configurado
- [ ] npm install ejecutado
- [ ] App funciona en localhost:3000
- [ ] Código en GitHub
- [ ] Deployed en Vercel
- [ ] URL en producción funciona
- [ ] Cuenta de prueba creada
- [ ] Timer probado
- [ ] Primera publicación en redes

**Si todo ✓ = TIENES APP LISTA.**

---

## SI ALGO FALLA

**Error common 1:** "npm: command not found"
→ Instala Node.js: nodejs.org

**Error common 2:** Vercel dice "Build failed"
→ Verifica que .env.local tenga valores correctos
→ Verifica que NEXTAUTH_URL no sea localhost

**Error common 3:** "Cannot find Supabase"
→ Verifica que NEXT_PUBLIC_SUPABASE_URL sea correcto
→ Sin espacios, sin caracteres raros

**Error common 4:** Login no funciona
→ Verifica que Supabase estés sin error
→ Verifica que auth.users tabla exista

---

## SIGUIENTE PASO

Cuando todo esté deployado y funcionando:

1. Espera 1 día
2. Recolecta feedback de primeros usuarios
3. Mándame captura con números de users
4. Pasamos a MONETIZACIÓN (mes 2)

---

**¿LISTO? ABRE TERMINAL Y EMPIEZA CON FASE 1.**

Cuando termines cada fase, actualiza el checklist.

¿Necesitas ayuda? Avísame en qué fase fallas.
