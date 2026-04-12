// ============================================================
// ⚠️ TODO ANTES DE ACTIVAR PAGOS REALES EN STRIPE:
// Reemplaza los siguientes placeholders en este archivo:
//   [TU NOMBRE]   → tu nombre completo
//   [TU EMAIL]    → email de contacto operativo
// ============================================================

import Head from 'next/head';
import Link from 'next/link';

export default function Cookies() {
  return (
    <>
      <Head>
        <title>Política de Cookies · Timely</title>
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">⏱</span>
              </div>
              <span className="font-bold text-xl text-slate-900">Timely</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium"
            >
              ← Volver al inicio
            </Link>
          </nav>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Política de Cookies
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Última actualización: 12 de abril de 2026
          </p>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                1. ¿Qué son las cookies?
              </h2>
              <p>
                Una cookie es un pequeño archivo de texto que un sitio web
                almacena en el navegador del Usuario cuando lo visita. Las
                cookies permiten al sitio recordar información sobre la visita,
                facilitando la navegación y ofreciendo una mejor experiencia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                2. Tipos de cookies que utilizamos
              </h2>
              <p>
                En Timely utilizamos exclusivamente <strong>cookies técnicas
                estrictamente necesarias</strong> para el funcionamiento del
                Servicio. <strong>No utilizamos cookies analíticas, publicitarias
                ni de terceros con fines de marketing.</strong>
              </p>
              <p className="mt-3">Las cookies que utilizamos son:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold">Cookie</th>
                      <th className="text-left p-3 font-semibold">Tipo</th>
                      <th className="text-left p-3 font-semibold">Finalidad</th>
                      <th className="text-left p-3 font-semibold">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3 font-mono text-xs">sb-access-token</td>
                      <td className="p-3">Técnica (Supabase)</td>
                      <td className="p-3">Mantener la sesión iniciada</td>
                      <td className="p-3">1 hora</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs">sb-refresh-token</td>
                      <td className="p-3">Técnica (Supabase)</td>
                      <td className="p-3">Renovar la sesión automáticamente</td>
                      <td className="p-3">7 días</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs">__stripe_mid</td>
                      <td className="p-3">Técnica (Stripe)</td>
                      <td className="p-3">Detección de fraude en pagos</td>
                      <td className="p-3">1 año</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs">__stripe_sid</td>
                      <td className="p-3">Técnica (Stripe)</td>
                      <td className="p-3">Detección de fraude en pagos</td>
                      <td className="p-3">30 minutos</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs">timely_cookies_accepted</td>
                      <td className="p-3">Técnica (Timely)</td>
                      <td className="p-3">
                        Recordar que has aceptado este aviso
                      </td>
                      <td className="p-3">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                3. ¿Necesitamos tu consentimiento?
              </h2>
              <p>
                Las cookies estrictamente necesarias para el funcionamiento del
                servicio están exentas del requisito de consentimiento previo
                según el artículo 22.2 de la LSSI-CE. No obstante, te informamos
                de su existencia y finalidad para que tengas plena transparencia.
              </p>
              <p className="mt-3">
                Las cookies de Stripe son necesarias para procesar pagos de
                forma segura y se activan únicamente cuando el Usuario interactúa
                con el formulario de pago.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                4. ¿Cómo gestionar las cookies?
              </h2>
              <p>
                Puedes configurar tu navegador para que rechace cookies o te
                avise antes de aceptarlas. Sin embargo, ten en cuenta que si
                desactivas las cookies técnicas necesarias, no podrás iniciar
                sesión ni procesar pagos en Timely.
              </p>
              <p className="mt-3">
                Aquí tienes los enlaces para gestionar cookies en los principales
                navegadores:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/es/kb/proteccion-mejorada-contra-rastreo-firefox-escrit"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                5. Cambios en esta política
              </h2>
              <p>
                Si en el futuro incorporamos cookies de análisis o de terceros,
                actualizaremos esta política y solicitaremos tu consentimiento
                explícito mediante un banner antes de instalarlas.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
            <p>
              Para cualquier consulta sobre cookies, escríbenos a{' '}
              <a href="mailto:[TU EMAIL]" className="text-blue-600 hover:underline">
                [TU EMAIL]
              </a>
              .
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
