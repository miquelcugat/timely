import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Solo mostrar si no se ha aceptado antes
    try {
      const accepted = localStorage.getItem('Valopo_cookies_accepted');
      if (!accepted) setShow(true);
    } catch {
      // Si localStorage no está disponible (modo privado, etc.) no mostramos
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem('Valopo_cookies_accepted', new Date().toISOString());
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 sm:p-6 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              <span className="font-bold">🍪 Usamos solo cookies técnicas</span>
              {' '}necesarias para el funcionamiento del servicio (sesión, pagos
              y seguridad). No usamos cookies de análisis ni publicidad.{' '}
              <Link
                href="/cookies"
                className="text-blue-600 hover:underline font-medium"
              >
                Más información
              </Link>
            </p>
          </div>
          <button
            onClick={accept}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
