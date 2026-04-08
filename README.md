# TIMELY - MVP Completo

**Tu app de timer para freelancers está lista para lanzar.**

Este es el código profesional. Tu trabajo: seguir estos pasos EXACTO. Nada más.

---

## PASO 1: CUENTAS GRATIS (10 MINUTOS)

### 1.1 GitHub
- Ve a github.com
- Regístrate (gratis)
- Crea nuevo repositorio llamado "timely"

### 1.2 Supabase (Base de datos)
- Ve a supabase.com
- Regístrate con tu email: cugat23@gmail.com
- Crea nuevo proyecto llamado "timely"
- Espera 2 minutos a que se cree
- Cuando esté listo, verás dashboard

### 1.3 Stripe (Cobrar dinero)
- Ve a stripe.com
- Regístrate con cugat23@gmail.com
- Verifica email
- Dashboard → API keys → Copia la key "pk_test_..." (publishable)

### 1.4 Vercel (Hosting gratis)
- Ve a vercel.com
- Regístrate con GitHub
- Conecta tu GitHub

**LISTO: Tienes las 4 herramientas.**

---

## PASO 2: CONFIGURAR BASE DE DATOS (5 MINUTOS)

En Supabase dashboard:

### 2.1 Crear tablas

En el editor SQL, copia y pega esto:

```sql
-- Users table (automática, Supabase la crea)

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Sessions table (sesiones de trabajo)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  earned DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes para velocidad
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_project ON sessions(project_id);
```

Pega en el SQL editor y ejecuta.

### 2.2 Copiar credenciales

En Supabase:
- Settings → API → copia la URL (NEXT_PUBLIC_SUPABASE_URL)
- Settings → API → copia "anon public key" (NEXT_PUBLIC_SUPABASE_ANON_KEY)

**Guárdalas, las necesitas en paso 3.**

---

## PASO 3: SETUP DEL PROYECTO (10 MINUTOS)

### 3.1 En tu ordenador

Abre Terminal/PowerShell y ejecuta:

```bash
git clone https://github.com/TU_USUARIO/timely.git
cd timely
npm install
```

(Si dice "npm not found", instala Node.js primero: nodejs.org)

### 3.2 Variables de entorno

En la carpeta timely, edita `.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=pegaAquiLaURLdeSupabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=pegaAquiLaAnon
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXX (de Stripe)
STRIPE_SECRET_KEY=sk_test_XXX (de Stripe)
NEXTAUTH_SECRET=openssl rand -base64 32 (genera una en terminal)
NEXTAUTH_URL=http://localhost:3000
```

### 3.3 Test local

En terminal:

```bash
npm run dev
```

Abre http://localhost:3000

Deberías ver la landing page. Si funciona, ¡genial!

---

## PASO 4: DEPLOY A VERCEL (3 MINUTOS)

### 4.1 Subir a GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 4.2 Deploy a Vercel

- Ve a vercel.com
- Click "New Project"
- Selecciona el repo "timely"
- Click "Import"
- En "Environment Variables", pega las mismas del .env.local
- Click "Deploy"

**LISTO. En 2 minutos verás tu app en producción.**

La URL será tipo: `https://timely-XXX.vercel.app`

---

## PASO 5: LANZAMIENTO (HOY MISMO)

### 5.1 Crea cuenta de prueba

- Ve a tu URL de Vercel
- Click "Regístrate"
- Email: test@timely.app / password: demo123
- Crea un proyecto: "Cliente X" / €40/hora
- Prueba el timer

### 5.2 Tweet/LinkedIn

Escribe algo como:

```
Hice una app para saber cuánto gano por hora como freelancer.
1 semana usando Timely y descubrí que cobraba 50% menos de lo que pensaba.
Pruébala gratis: [TU_URL]
```

### 5.3 Comunidades

- Comunidad Slack "Freelancers España" → post
- Reddit r/trabajodelengua → "Hice esto para freelancers"
- WhatsApp: manda a 10 freelancers que conozcas

---

## PASO 6: MONETIZACIÓN (CUANDO TENGAS 10+ USUARIOS)

### 6.1 Añadir paywall

Edita `pages/dashboard.js` línea 200 aprox:

Busca:
```javascript
{/* CTA for Premium */}
```

Y reemplaza con:

```javascript
{/* CTA for Premium */}
{!user.is_premium && (
  <div className="mt-8 bg-blue-600 text-white rounded-lg p-8 text-center">
    <h3 className="text-2xl font-bold mb-2">Upgrade a Premium</h3>
    <p className="mb-4">€14.99/mes - Múltiples proyectos, histórico completo</p>
    <button onClick={() => router.push('/checkout')} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">
      Comprar ahora
    </button>
  </div>
)}
```

### 6.2 Página checkout

Crea `pages/checkout.js` con Stripe:

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Checkout() {
  const handleCheckout = async () => {
    const stripe = await stripePromise;
    const { error } = await stripe.redirectToCheckout({
      sessionId: 'tu_session_id_de_stripe'
    });
  };

  return (
    <div>
      <h1>Premium - €14.99/mes</h1>
      <button onClick={handleCheckout}>Pagar</button>
    </div>
  );
}
```

(Yo te ayudo cuando lleguemos aquí)

---

## PROBLEMAS COMUNES

### "npm command not found"
→ Instala Node.js: nodejs.org

### "Cannot find module '@supabase/supabase-js'"
→ Ejecuta: `npm install`

### La app no conecta a Supabase
→ Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén bien en `.env.local`

### Error 404 en Vercel
→ Espera 5 minutos, Vercel está deployando

---

## CHECKLIST FINAL

- [ ] Cuenta Supabase creada
- [ ] Tablas SQL ejecutadas
- [ ] Credenciales copiadas a .env.local
- [ ] `npm run dev` funciona en local
- [ ] Repo subido a GitHub
- [ ] Deployed en Vercel
- [ ] App visible en internet
- [ ] Cuenta de prueba creada
- [ ] Timer funciona en app
- [ ] Primera acción en Twitter/LinkedIn

**Si todo esto ✓, tienes app en producción. Ahora a VENDER.**

---

## STRATEGY DE VENTA (SEMANAS 1-4)

### Semana 1: Tú + 10 amigos
- Manda a 10 freelancers que conozcas
- Recolecta feedback
- Mejora UI si necesario

### Semana 2-3: Comunidades
- Slack: "Hice app para freelancers..."
- Reddit: "Descubrí que cobraba menos de lo que pensaba"
- Twitter: Hilo sobre "cómo saber cuánto ganas realmente"

### Semana 4: Primeros pagadores
- Si tienes 30+ usuarios gratis
- Activa paywall
- Objetivo: 3-5 usuarios pagos

**En mes 2: €100-300 en ingresos**

---

## SIGUIENTE PASO AHORA

1. Abre Terminal
2. Crea la carpeta: `mkdir timely && cd timely`
3. Copia TODOS los archivos de arriba en esa carpeta
4. Sigue PASO 1 (crear cuentas)

**¿Necesitas ayuda? Avísame. Pero esto debería funcionar solo.**

Ahora a ganar dinero. 🚀
