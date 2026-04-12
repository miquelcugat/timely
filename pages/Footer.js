import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">⏱</span>
            </div>
            <span className="text-sm text-slate-600">
              © {new Date().getFullYear()} Timely. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/terminos"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Términos
            </Link>
            <Link
              href="/privacidad"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Privacidad
            </Link>
            <Link
              href="/cookies"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
