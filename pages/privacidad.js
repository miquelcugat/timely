// ============================================================
// ⚠️ TODO ANTES DE ACTIVAR PAGOS REALES EN STRIPE:
// Reemplaza los siguientes placeholders en este archivo:
//   [TU NOMBRE]   → tu nombre completo (ej: Miquel Cugat López)
//   [TU NIF]      → tu NIF/DNI con letra (ej: 12345678A)
//   [TU CIUDAD]   → ciudad de residencia (ej: Barcelona)
//   [TU EMAIL]    → email de contacto operativo
//   [TU DOMINIO]  → URL final de tu app (ej: https://timely.app)
// Sin estos datos rellenados, esta página NO es válida legalmente.
// ============================================================

import Head from 'next/head';
import Link from 'next/link';

export default function Privacidad() {
  return (
    <>
      <Head>
        <title>Política de Privacidad · Timely</title>
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
            Política de Privacidad
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Última actualización: 12 de abril de 2026
          </p>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <section>
              <p>
                En Timely valoramos tu privacidad y nos comprometemos a proteger
                tus datos personales. Esta política explica qué datos recogemos,
                cómo los usamos y qué derechos tienes sobre ellos, en cumplimiento
                del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de
                Protección de Datos Personales y garantía de los derechos
                digitales (LOPDGDD).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                1. Responsable del tratamiento
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Identidad:</strong> [TU NOMBRE]</li>
                <li><strong>NIF:</strong> [TU NIF]</li>
                <li><strong>Domicilio:</strong> [TU CIUDAD], España</li>
                <li><strong>Email de contacto:</strong> [TU EMAIL]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                2. Datos que recogemos
              </h2>
              <p>Solo recogemos los datos estrictamente necesarios para prestar el servicio:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Datos de registro:</strong> dirección de correo
                  electrónico y contraseña (almacenada de forma cifrada mediante
                  hash, nunca en texto plano).
                </li>
                <li>
                  <strong>Datos de uso del servicio:</strong> proyectos creados,
                  tarifas configuradas, sesiones de tiempo, notas y cualquier
                  contenido que el Usuario introduzca voluntariamente en la
                  aplicación.
                </li>
                <li>
                  <strong>Datos de facturación:</strong> en caso de contratar el
                  Plan Pro, los datos de pago son tratados directamente por
                  Stripe Payments Europe, Ltd. Timely no almacena datos
                  bancarios ni de tarjeta.
                </li>
                <li>
                  <strong>Datos técnicos:</strong> dirección IP, tipo de
                  navegador, sistema operativo y fecha y hora de acceso, para
                  fines de seguridad y diagnóstico.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                3. Finalidad del tratamiento
              </h2>
              <p>Utilizamos tus datos para:</p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>Crear y gestionar tu cuenta de usuario.</li>
                <li>Prestarte el servicio de seguimiento de tiempo y facturación.</li>
                <li>Gestionar tu suscripción y procesar los pagos.</li>
                <li>
                  Enviarte comunicaciones operativas (cambios de servicio,
                  recordatorios, recibos).
                </li>
                <li>Cumplir obligaciones legales (fiscales, contables).</li>
                <li>Garantizar la seguridad del Servicio y prevenir fraudes.</li>
              </ul>
              <p className="mt-3">
                <strong>
                  No utilizamos tus datos para publicidad, perfilado comercial
                  ni los vendemos a terceros bajo ninguna circunstancia.
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                4. Base legal del tratamiento
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Ejecución de un contrato</strong> (Art. 6.1.b RGPD)
                  para la prestación del servicio y la gestión de la
                  suscripción.
                </li>
                <li>
                  <strong>Cumplimiento de obligaciones legales</strong>
                  {' '}(Art. 6.1.c RGPD) para la conservación de datos fiscales y
                  contables.
                </li>
                <li>
                  <strong>Interés legítimo</strong> (Art. 6.1.f RGPD) para
                  garantizar la seguridad del Servicio y prevenir el fraude.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                5. Conservación de los datos
              </h2>
              <p>
                Conservamos tus datos durante el tiempo que mantengas tu cuenta
                activa. Si cancelas la cuenta, los datos serán eliminados de
                forma permanente en un plazo máximo de 30 días, salvo aquellos
                que deban conservarse por obligación legal (por ejemplo, datos
                de facturación durante 6 años conforme al Código de Comercio).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                6. Encargados del tratamiento
              </h2>
              <p>
                Para prestar el servicio compartimos algunos datos con los
                siguientes proveedores, todos ellos con garantías adecuadas de
                protección de datos:
              </p>
              <ul className="list-disc pl-6 space-y-3 mt-3">
                <li>
                  <strong>Supabase Inc.</strong> (Estados Unidos) — proveedor de
                  base de datos y autenticación. Datos transferidos: email y
                  datos generados en el uso de la app. Las transferencias se
                  amparan en las cláusulas contractuales tipo aprobadas por la
                  Comisión Europea (Decisión 2021/914).
                </li>
                <li>
                  <strong>Stripe Payments Europe, Ltd.</strong> (Irlanda) —
                  procesador de pagos. Datos transferidos: email, datos de
                  facturación y de tarjeta. Stripe es una entidad europea sujeta
                  al RGPD.
                </li>
                <li>
                  <strong>Vercel Inc.</strong> (Estados Unidos) — hosting de la
                  aplicación. Datos transferidos: logs técnicos y dirección IP.
                  Las transferencias se amparan en las cláusulas contractuales
                  tipo.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                7. Derechos del usuario
              </h2>
              <p>Como titular de los datos, puedes ejercer los siguientes derechos:</p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>
                  <strong>Acceso:</strong> conocer qué datos tuyos tratamos.
                </li>
                <li>
                  <strong>Rectificación:</strong> corregir datos inexactos.
                </li>
                <li>
                  <strong>Supresión:</strong> solicitar el borrado de tus datos.
                </li>
                <li>
                  <strong>Limitación:</strong> restringir el tratamiento de tus datos.
                </li>
                <li>
                  <strong>Portabilidad:</strong> recibir tus datos en formato
                  estructurado y legible.
                </li>
                <li>
                  <strong>Oposición:</strong> oponerte al tratamiento de tus datos.
                </li>
                <li>
                  <strong>No ser objeto de decisiones automatizadas</strong> con
                  efectos legales significativos.
                </li>
              </ul>
              <p className="mt-3">
                Para ejercer cualquiera de estos derechos, escríbenos a{' '}
                <a href="mailto:[TU EMAIL]" className="text-blue-600 hover:underline">
                  [TU EMAIL]
                </a>
                {' '}adjuntando una copia de tu DNI o documento equivalente. Te
                responderemos en un plazo máximo de un mes.
              </p>
              <p className="mt-3">
                Si consideras que tus derechos no han sido atendidos
                adecuadamente, tienes derecho a presentar una reclamación ante la
                Agencia Española de Protección de Datos ({' '}
                <a
                  href="https://www.aepd.es"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.aepd.es
                </a>
                ).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                8. Seguridad
              </h2>
              <p>
                Aplicamos medidas técnicas y organizativas adecuadas para
                proteger tus datos contra accesos no autorizados, pérdida,
                alteración o divulgación. Estas medidas incluyen el cifrado en
                tránsito (HTTPS), el almacenamiento seguro de contraseñas
                mediante hash, el aislamiento de datos por usuario en la base de
                datos (Row Level Security) y copias de seguridad periódicas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                9. Menores de edad
              </h2>
              <p>
                Timely no está dirigido a menores de 14 años. Si detectamos que
                hemos recogido datos de un menor sin el consentimiento de sus
                padres o tutores, los eliminaremos de forma inmediata.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                10. Cambios en esta política
              </h2>
              <p>
                Podemos actualizar esta política de privacidad ocasionalmente.
                Cualquier cambio sustancial será comunicado al Usuario por
                correo electrónico con al menos 15 días de antelación.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
            <p>
              Para cualquier consulta sobre privacidad, escríbenos a{' '}
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
