import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Timely - Sabe cuánto ganas por hora</title>
        <meta name="description" content="Track tus horas, calcula tus ingresos reales. Para freelancers que quieren saber de verdad cuánto ganan." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⏱</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Timely</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Entra
            </button>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sabe cuánto ganas <span className="text-blue-600">de verdad</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Freelancers: dejan de trabajar sin saber si ganaron €1.200 o €800 este mes.
              <br />
              <strong>Timely te muestra en tiempo real.</strong>
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700"
            >
              Prueba gratis ahora
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="font-bold text-lg mb-2">Timer real</h3>
              <p className="text-gray-600">Clickea "empezar" y listo. Cada segundo cuenta.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-bold text-lg mb-2">Ves tus ingresos</h3>
              <p className="text-gray-600">Dashboard claro: horas × tarifa = dinero ganado.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-lg mb-2">Análisis real</h3>
              <p className="text-gray-600">Ve qué proyectos te pagan mejor. Ajusta precios.</p>
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="mt-20 bg-blue-50 p-12 rounded-lg">
            <p className="text-center text-gray-700 mb-4">
              "Usé Timely una semana y descubrí que cobraba €20/h en vez de €35. Subí precios. Gano €600 más al mes."
            </p>
            <p className="text-center text-gray-500 text-sm">— Freelancer, Madrid</p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 text-white py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Empieza gratis. Sin tarjeta.</h2>
            <p className="text-lg mb-8 text-blue-100">
              Prueba toda la funcionalidad básica. Actualiza a Pro cuando quieras (€14.99/mes).
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100"
            >
              Crea tu cuenta ahora
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p>© 2024 Timely. Para freelancers que quieren saber cuánto ganan.</p>
            <p className="mt-2 text-sm">Email: hola@timely.app</p>
          </div>
        </footer>
      </div>
    </>
  );
}
