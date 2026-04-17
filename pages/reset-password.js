import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import ValopoLogo from '../components/ValopoLogo';
import { Clock, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error('Reset error:', err);
      setError('No se pudo enviar el email. Verifica que la dirección es correcta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recuperar contraseña · Valopo</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <ValopoLogo size={40} />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
            </Link>
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {!sent ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-blue-600" strokeWidth={2} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Recuperar contraseña
                  </h1>
                  <p className="text-sm text-slate-500">
                    Introduce tu email y te enviaremos un enlace para crear una
                    nueva contraseña.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-blue-600 font-medium inline-flex items-center gap-1 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Volver al login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Email enviado
                </h1>
                <p className="text-sm text-slate-500 mb-2">
                  Si existe una cuenta con <strong>{email}</strong>, recibirás un
                  enlace para restablecer tu contraseña.
                </p>
                <p className="text-xs text-slate-400 mb-8">
                  Revisa también la carpeta de spam. El enlace expira en 1 hora.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                    }}
                    className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                  >
                    Enviar de nuevo
                  </button>
                  <Link
                    href="/login"
                    className="block w-full px-6 py-3 text-blue-600 font-semibold hover:underline transition text-center"
                  >
                    Volver al login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
