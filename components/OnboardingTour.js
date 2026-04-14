import { useState } from 'react';

const STEPS = [
  {
    icon: '👋',
    title: '¡Bienvenido a Timely!',
    subtitle: 'Vamos a darte un tour rápido (1 minuto)',
    body: (
      <p className="text-slate-600 leading-relaxed">
        Timely es la app que ayuda a freelancers a saber{' '}
        <strong>cuánto ganan de verdad</strong> y a generar facturas
        profesionales en segundos. Vamos a enseñarte lo esencial.
      </p>
    ),
  },
  {
    icon: '⏱',
    title: 'El cronómetro',
    subtitle: 'Tu mejor amigo del día a día',
    body: (
      <div className="space-y-3 text-slate-600 leading-relaxed">
        <p>
          Pulsa <strong>Empezar a contar</strong> cuando trabajes en un
          proyecto. El cronómetro corre en tiempo real y guarda la sesión
          al pararlo.
        </p>
        <p>
          Al parar, te pediremos una nota corta sobre lo que hiciste — útil
          para acordarte y para detallar después en tus facturas.
        </p>
      </div>
    ),
  },
  {
    icon: '📂',
    title: 'Tus proyectos',
    subtitle: 'Cada uno con su tarifa por hora',
    body: (
      <div className="space-y-3 text-slate-600 leading-relaxed">
        <p>
          Crea un proyecto por cada cliente o tipo de trabajo. Cada proyecto
          tiene su <strong>tarifa por hora</strong>, así Timely calcula
          automáticamente cuánto vas ganando.
        </p>
        <p>
          Plan Free: hasta 2 proyectos. Plan Pro: ilimitados.
        </p>
      </div>
    ),
  },
  {
    icon: '💰',
    title: 'Mis ingresos en tiempo real',
    subtitle: 'Por fin sabes cuánto ganas',
    body: (
      <div className="space-y-3 text-slate-600 leading-relaxed">
        <p>
          Mientras trabajas, ves <strong>en directo</strong> cuánto dinero
          estás generando. Y los stats de arriba te muestran tus ingresos
          de hoy, esta semana, este mes y total.
        </p>
        <p>
          Si quieres analizar a fondo, en{' '}
          <strong>Mis proyectos</strong> tienes gráficos por día, semana y
          hora.
        </p>
      </div>
    ),
  },
  {
    icon: '📄',
    title: 'Y cuando toca cobrar...',
    subtitle: 'Facturas profesionales en 30 segundos',
    body: (
      <div className="space-y-3 text-slate-600 leading-relaxed">
        <p>
          Convierte tus sesiones en <strong>facturas legales en PDF</strong>{' '}
          con tu logo, datos fiscales, IVA, IRPF y numeración correlativa.
          Listas para enviar a tu cliente.
        </p>
        <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
          💡 La facturación es una feature del plan Pro (14,99 €/mes).
        </p>
      </div>
    ),
  },
  {
    icon: '🎉',
    title: '¡Listo para empezar!',
    subtitle: 'Tu primer proyecto te espera',
    body: (
      <div className="space-y-3 text-slate-600 leading-relaxed">
        <p>
          Si tienes dudas, todas las secciones están en el menú superior:{' '}
          <strong>Dashboard, Proyectos, Clientes y Facturas</strong>.
        </p>
        <p>
          Vamos a empezar creando tu primer proyecto.
        </p>
      </div>
    ),
  },
];

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep(step - 1);
  };

  const finish = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
    // El componente se desmonta cuando el padre actualiza el estado
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Paso {step + 1} de {STEPS.length}
            </p>
            <button
              onClick={finish}
              disabled={completing}
              className="text-xs text-slate-500 hover:text-slate-700 transition disabled:opacity-60"
            >
              Saltar tour
            </button>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full mb-4 text-5xl">
              {current.icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {current.title}
            </h2>
            <p className="text-sm text-slate-500">{current.subtitle}</p>
          </div>

          <div className="text-base">{current.body}</div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={isFirst || completing}
            className="px-4 py-2.5 text-slate-600 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            ← Anterior
          </button>
          <button
            onClick={handleNext}
            disabled={completing}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 text-sm"
          >
            {completing
              ? 'Guardando…'
              : isLast
              ? '✓ Empezar a usar Timely'
              : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
