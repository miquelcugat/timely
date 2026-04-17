import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ValopoLogo from '../components/ValopoLogo';
import {
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  FileText,
  Shield,
  Zap,
  ChevronRight,
  Check,
  Smartphone,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Valopo — Descubre cuánto vale realmente tu tiempo</title>
        <meta
          name="description"
          content="Define tu objetivo, registra tu trabajo, y Valopo te dice si estás ganando lo que mereces. Para freelancers que quieren cobrar lo que valen."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ValopoLogo size={40} />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition"
              >
                Entrar
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
              >
                Empieza gratis
              </button>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full mb-8">
              <Target className="w-4 h-4" strokeWidth={2.5} />
              Para freelancers que quieren cobrar lo que valen
            </p>

            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Descubre cuánto vale
              <br />
              <span className="text-blue-600">realmente tu tiempo</span>
            </h1>

            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Define tu objetivo. Registra tu trabajo. Valopo te dice si estás
              ganando lo que mereces, proyecto a proyecto.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-sm inline-flex items-center justify-center gap-2"
              >
                Empieza gratis
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => {
                  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 border border-slate-200 text-slate-700 rounded-lg font-semibold text-lg hover:bg-slate-50 transition"
              >
                Cómo funciona
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Plan Free sin compromiso. 2 proyectos gratis. Acceso inmediato.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="bg-slate-50 py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Tres pasos para saber lo que vales
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Valopo no es solo un cronómetro. Es tu herramienta para tomar
                mejores decisiones sobre tu trabajo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-blue-600" strokeWidth={2.25} />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  Paso 1
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3">
                  Define tu objetivo
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Configura cuánto quieres ganar por hora y por mes.
                  Valopo necesita saber tu meta para decirte si la estás cumpliendo.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  <Clock className="w-6 h-6 text-blue-600" strokeWidth={2.25} />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  Paso 2
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3">
                  Registra tu trabajo
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Dale al play, trabaja, y para el cronómetro.
                  Valopo calcula automáticamente cuánto has ganado en cada sesión.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  <TrendingUp className="w-6 h-6 text-blue-600" strokeWidth={2.25} />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  Paso 3
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3">
                  Descubre tu rentabilidad
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Valopo te muestra qué proyectos son rentables, cuáles no, y
                  si vas en el ritmo correcto para alcanzar tu objetivo del mes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Todo lo que necesitas, nada que sobre
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Diseñado para freelancers que quieren una herramienta profesional
                sin la complejidad de un ERP.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  Icon: Clock,
                  title: 'Cronómetro en vivo',
                  desc: 'Un click para empezar, otro para parar. Sin complicaciones.',
                },
                {
                  Icon: TrendingUp,
                  title: 'Insights de rentabilidad',
                  desc: 'Sabes al instante si un proyecto te compensa o te está costando dinero.',
                },
                {
                  Icon: BarChart3,
                  title: 'Análisis por proyecto',
                  desc: 'Gráficos de horas diarias, ingresos semanales y distribución horaria.',
                },
                {
                  Icon: FileText,
                  title: 'Facturas profesionales',
                  desc: 'Genera facturas con tus datos fiscales, logo, y líneas de detalle.',
                },
                {
                  Icon: Smartphone,
                  title: 'Desde cualquier lugar',
                  desc: 'Web responsive. Funciona en móvil, tablet y escritorio.',
                },
                {
                  Icon: Shield,
                  title: 'Privado y seguro',
                  desc: 'Tus datos son tuyos. Sin publicidad. Sin venta de datos.',
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition group"
                >
                  <Icon
                    className="w-6 h-6 text-blue-600 mb-4 group-hover:scale-110 transition-transform"
                    strokeWidth={2.25}
                  />
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-slate-50 py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Planes simples, sin sorpresas
              </h2>
              <p className="text-lg text-slate-500">
                Empieza gratis. Sube a Pro cuando quieras.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <h3 className="font-bold text-xl text-slate-900 mb-1">Free</h3>
                <p className="text-sm text-slate-500 mb-6">Para empezar y probar</p>
                <p className="text-4xl font-bold text-slate-900 mb-6">
                  0 €<span className="text-base font-normal text-slate-500">/mes</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Hasta 2 proyectos',
                    'Cronómetro en vivo',
                    'Dashboard con stats',
                    'Historial de 30 días',
                    'Exportar CSV',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-6 py-3 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Empieza gratis
                </button>
              </div>

              {/* Pro */}
              <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 relative shadow-sm">
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Recomendado
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Pro</h3>
                <p className="text-sm text-slate-500 mb-6">Para freelancers serios</p>
                <p className="text-4xl font-bold text-slate-900 mb-6">
                  14,99 €<span className="text-base font-normal text-slate-500">/mes</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Proyectos ilimitados',
                    'Todo lo de Free',
                    'Historial completo',
                    'Exportar PDF con gráficos',
                    'Facturas profesionales con logo',
                    'Insights de rentabilidad',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Empieza con Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: '¿Es realmente gratis?',
                  a: 'Sí. La versión Free incluye hasta 2 proyectos, cronómetro, dashboard y exportación CSV. Sin límite de tiempo.',
                },
                {
                  q: '¿Puedo cambiar de plan cuando quiera?',
                  a: 'Por supuesto. Puedes subir a Pro o cancelar en cualquier momento desde tu cuenta. Sin permanencia ni penalizaciones.',
                },
                {
                  q: '¿Mis datos son privados?',
                  a: 'Tus datos están encriptados y nunca se comparten con terceros. Sin publicidad, sin venta de datos.',
                },
                {
                  q: '¿Necesito instalar algo?',
                  a: 'No. Valopo funciona 100% en el navegador. Solo necesitas una conexión a internet.',
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="p-5 bg-white rounded-xl border border-slate-200"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-slate-900 py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tu tiempo tiene un precio.
              <br />
              <span className="text-blue-400">Asegúrate de que sea justo.</span>
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Empieza gratis con 2 proyectos. Configura tu objetivo y empieza a
              entender cuánto vale tu trabajo.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-500 transition shadow-lg inline-flex items-center gap-2"
            >
              Crear cuenta gratis
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ValopoLogo size={32} />
                  <span className="font-bold text-white">Valopo</span>
                </div>
                <p className="text-sm text-slate-500">
                  Para freelancers que quieren saber cuánto vale su tiempo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Producto</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>
                    <button onClick={() => router.push('/login')} className="hover:text-white transition">
                      Empieza gratis
                    </button>
                  </li>
                  <li>
                    <button onClick={() => router.push('/login')} className="hover:text-white transition">
                      Entrar
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>
                    <Link href="/terminos" className="hover:text-white transition">
                      Términos y condiciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="hover:text-white transition">
                      Política de privacidad
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="hover:text-white transition">
                      Política de cookies
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Contacto</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>
                    <a href="mailto:hola@valopo.com" className="hover:text-white transition">
                      hola@valopo.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8">
              <p className="text-center text-sm text-slate-600">
                © {new Date().getFullYear()} Valopo. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
