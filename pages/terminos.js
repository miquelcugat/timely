import Head from 'next/head';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function Terminos() {
  return (
    <>
      <Head>
        <title>Términos y Condiciones · Valopo</title>
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-slate-900">Valopo</span>
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
            Términos y Condiciones
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Última actualización: 12 de abril de 2026
          </p>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                1. Información del prestador del servicio
              </h2>
              <p>
                En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de
                la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se
                informa al usuario de los siguientes datos identificativos del
                titular del sitio web:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li><strong>Titular:</strong> Miquel Cugat Ruiz</li>
                <li><strong>NIF:</strong> —</li>
                <li><strong>Domicilio:</strong> Barcelona, España</li>
                <li><strong>Email de contacto:</strong> info@valopo.com</li>
                <li><strong>Sitio web:</strong> https://valopo.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                2. Objeto y aceptación
              </h2>
              <p>
                Los presentes Términos y Condiciones (en adelante, &quot;los Términos&quot;)
                regulan el uso de la aplicación Valopo (en adelante, &quot;el Servicio&quot;),
                una herramienta SaaS de seguimiento de tiempo y facturación
                destinada a profesionales autónomos y freelancers.
              </p>
              <p className="mt-3">
                El acceso al Servicio implica la aceptación expresa, plena y sin
                reservas de todos los Términos aquí establecidos. Si el Usuario no
                está de acuerdo con alguno de ellos, deberá abstenerse de utilizar
                el Servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                3. Registro y cuenta de usuario
              </h2>
              <p>
                Para acceder al Servicio el Usuario deberá registrarse facilitando
                una dirección de correo electrónico válida y una contraseña. El
                Usuario es el único responsable de mantener la confidencialidad de
                sus credenciales y de todas las actividades realizadas desde su
                cuenta.
              </p>
              <p className="mt-3">
                El Usuario debe ser mayor de edad y tener capacidad legal para
                contratar. Al registrarse declara que toda la información facilitada
                es veraz, exacta y actualizada.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                4. Planes y condiciones económicas
              </h2>
              <p>Valopo ofrece dos modalidades de uso:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Plan Free:</strong> gratuito, con funcionalidades
                  limitadas (máximo 2 proyectos, sin exportación a PDF).
                </li>
                <li>
                  <strong>Plan Pro:</strong> suscripción mensual de 14,99 € con
                  acceso a todas las funcionalidades, incluyendo proyectos
                  ilimitados, exportación a PDF y soporte prioritario.
                </li>
              </ul>
              <p className="mt-3">
                Los pagos del Plan Pro se procesan a través de Stripe Payments
                Europe, Ltd. La suscripción se renueva automáticamente cada mes
                hasta que el Usuario la cancele. El Usuario puede cancelar en
                cualquier momento desde su panel de cuenta, sin penalización. La
                cancelación surte efecto al final del periodo de facturación
                actual.
              </p>
              <p className="mt-3">
                <strong>Derecho de desistimiento:</strong> de conformidad con el
                artículo 103.m) del Real Decreto Legislativo 1/2007, al tratarse
                de un servicio digital de ejecución inmediata, el Usuario renuncia
                expresamente al derecho de desistimiento una vez comenzada la
                prestación del servicio (es decir, una vez activada la suscripción
                Pro). No obstante, el Usuario puede cancelar la renovación
                automática en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                5. Uso aceptable
              </h2>
              <p>El Usuario se compromete a utilizar el Servicio:</p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>Conforme a la legislación vigente y de buena fe.</li>
                <li>
                  Sin realizar actos que puedan dañar, sobrecargar o deteriorar el
                  Servicio o impedir su uso normal por otros usuarios.
                </li>
                <li>
                  Sin intentar acceder a áreas restringidas, vulnerar mecanismos de
                  seguridad o realizar ingeniería inversa del Servicio.
                </li>
                <li>
                  Sin utilizar el Servicio para almacenar o transmitir contenido
                  ilegal, difamatorio, obsceno o que infrinja derechos de terceros.
                </li>
              </ul>
              <p className="mt-3">
                El incumplimiento de estas condiciones podrá dar lugar a la
                suspensión inmediata de la cuenta sin derecho a reembolso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                6. Propiedad intelectual
              </h2>
              <p>
                Todos los derechos de propiedad intelectual e industrial sobre el
                Servicio (código, diseño, marca, logotipos, textos, imágenes)
                pertenecen al Titular o a sus licenciantes. El Usuario no adquiere
                ningún derecho sobre los mismos por el uso del Servicio.
              </p>
              <p className="mt-3">
                Los datos introducidos por el Usuario (proyectos, sesiones,
                clientes, facturas) son propiedad del Usuario, quien concede al
                Titular una licencia limitada para almacenarlos y procesarlos con
                la única finalidad de prestar el Servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                7. Limitación de responsabilidad
              </h2>
              <p>
                El Servicio se presta &quot;tal cual&quot; y &quot;según disponibilidad&quot;. El
                Titular no garantiza la disponibilidad ininterrumpida del Servicio,
                ni la ausencia total de errores, ni que el Servicio sea adecuado
                para una finalidad concreta del Usuario.
              </p>
              <p className="mt-3">
                El Titular no será responsable de los daños indirectos, lucro
                cesante o pérdida de datos derivados del uso o imposibilidad de uso
                del Servicio, salvo en los casos en que la legislación aplicable no
                permita dicha exclusión.
              </p>
              <p className="mt-3">
                La responsabilidad máxima del Titular en cualquier caso no superará
                el importe pagado por el Usuario en los 12 meses anteriores al
                hecho que generó la reclamación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                8. Modificaciones
              </h2>
              <p>
                El Titular se reserva el derecho a modificar los presentes Términos
                en cualquier momento. Las modificaciones serán comunicadas al
                Usuario con al menos 15 días de antelación a través del correo
                electrónico facilitado. Si el Usuario no acepta las nuevas
                condiciones, podrá cancelar su cuenta antes de que entren en vigor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                9. Terminación
              </h2>
              <p>
                El Usuario podrá dar de baja su cuenta en cualquier momento desde
                el panel de configuración. Tras la baja, los datos del Usuario
                serán eliminados de forma permanente en un plazo máximo de 30
                días, salvo aquellos que deban conservarse por obligación legal
                (por ejemplo, datos de facturación durante 6 años conforme al
                Código de Comercio).
              </p>
              <p className="mt-3">
                El Titular podrá suspender o cancelar la cuenta del Usuario en
                caso de incumplimiento grave de los presentes Términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                10. Ley aplicable y jurisdicción
              </h2>
              <p>
                Los presentes Términos se rigen por la legislación española. Para
                la resolución de cualquier controversia, las partes se someten,
                con renuncia expresa a cualquier otro fuero, a los Juzgados y
                Tribunales de Barcelona, salvo que la legislación aplicable de
                consumidores establezca lo contrario.
              </p>
              <p className="mt-3">
                De conformidad con el Reglamento (UE) 524/2013, se informa al
                Usuario de la existencia de la plataforma europea de resolución
                de litigios en línea, accesible en{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
            <p>
              Si tienes dudas sobre estos términos, escríbenos a{' '}
              <a href="mailto:info@valopo.com" className="text-blue-600 hover:underline">
                info@valopo.com
              </a>
              .
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
