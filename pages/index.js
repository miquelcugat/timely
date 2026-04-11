import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Timely - Sabes cuánto ganas por hora</title>
        <meta name="description" content="Track tus horas, calcula tus ingresos reales. Para freelancers que quieren saber de verdad cuánto ganan." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">⏱</span>
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Timely</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all"
            >
              Entra
            </button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              🚀 Para freelancers ambiciosos
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Sabes cuánto ganas<br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">de verdad</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              La mayoría de freelancers terminan el mes sin saber si ganaron €800 o €2000. 
              <strong> Timely te muestra en tiempo real cuánto dinero estás haciendo.</strong>
            </p>

            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={() => router.push('/pricing')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
              >
                🎯 Prueba gratis ahora
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all"
              >
                Entrar
              </button>
            </div>

            <p className="text-sm text-gray-500">✨ Sin tarjeta de crédito • Acceso inmediato • Cancelable en cualquier momento</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500 text-sm">Freelancers activos</p>
              <p className="text-3xl font-bold text-gray-900">1,200+</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="text-4xl mb-3">⏱</div>
              <p className="text-gray-500 text-sm">Horas registradas</p>
              <p className="text-3xl font-bold text-gray-900">45K+</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-gray-500 text-sm">Ingresos tracked</p>
              <p className="text-3xl font-bold text-gray-900">€2.5M+</p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">¿Por qué Timely?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-4">⏰</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Timer Real en Vivo</h3>
                <p className="text-gray-600">Clickea "empezar" y cada segundo cuenta. Sin complicaciones.</p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-4">💵</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Visualiza tus ingresos</h3>
                <p className="text-gray-600">Dashboard claro: horas × tarifa = dinero ganado. Números reales.</p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Análisis Profundo</h3>
                <p className="text-gray-600">Ve qué proyectos pagan mejor. Ajusta tus precios con datos.</p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-4">📱</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Acceso desde cualquier lugar</h3>
                <p className="text-gray-600">Web, mobile, desktop. Tu timer siempre en tu bolsillo.</p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Privado y Seguro</h3>
                <p className="text-gray-600">Tus datos son solo tuyos. Encriptado. Sin publicidad.</p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Crece sin límites</h3>
                <p className="text-gray-600">Hasta 2 proyectos gratis. Pro: proyectos ilimitados.</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Lo que dicen nuestros usuarios</h2>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-white text-center shadow-xl">
              <div className="text-5xl mb-6">⭐⭐⭐⭐⭐</div>
              <p className="text-xl mb-6 leading-relaxed">
                "Usé Timely una semana y descubrí que estaba cobrando €18/h cuando podría cobrar €40. 
                <strong> Subí precios y ahora gano €600 más al mes. Increíble."</strong>
              </p>
              <p className="text-blue-100">— Freelancer, Madrid (Diseño UX)</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 rounded-3xl p-16 text-white text-center shadow-2xl">
            <h2 className="text-5xl font-black mb-6">¿Listo para saber cuánto ganas?</h2>
            <p className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
              Empieza gratis. 2 proyectos. Sin tarjeta. Acceso instantáneo.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-10 py-5 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 inline-block"
            >
              🎉 Crea tu cuenta ahora (gratis)
            </button>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Preguntas frecuentes</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                <h3 className="font-bold text-lg text-gray-900 mb-2">¿Es realmente gratis?</h3>
                <p className="text-gray-600">Sí. Versión Free con 2 proyectos. Pro es €14.99/mes si necesitas más.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                <h3 className="font-bold text-lg text-gray-900 mb-2">¿Puedo cambiar de plan?</h3>
                <p className="text-gray-600">Claro. Cancela o upgrade en cualquier momento. Sin sorpresas.</p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                <h3 className="font-bold text-lg text-gray-900 mb-2">¿Mis datos son privados?</h3>
                <p className="text-gray-600">100%. Encriptados. Nunca vendemos datos. Nunca publicidad.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">⏱</span>
                  </div>
                  <span className="font-bold text-white">Timely</span>
                </div>
                <p className="text-sm">Para freelancers que quieren saber cuánto ganan.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3">Producto</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => router.push('/pricing')} className="hover:text-white transition">Planes</button></li>
                  <li><button onClick={() => router.push('/')} className="hover:text-white transition">Features</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3">Empresa</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Contacto</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
                  <li><a href="#" className="hover:text-white transition">Términos</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-center text-sm">© 2024 Timely. Hecho con ❤️ para freelancers.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
