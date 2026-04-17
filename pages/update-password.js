import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import ValopoLogo from '../components/ValopoLogo';
import { Clock, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Supabase handles the token exchange automatically when the user
  // clicks the reset link. We just need to wait for the session.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setSessionReady(true);
        }
      }
    );

    // Also check if there's already a session (user might have landed here
    // and the event already fired)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    // If after 5 seconds there's no session, show error
    const timeout = setTimeout(() => {
      setSessionReady((prev) => {
        if (!prev) setSessionError(true);
        return prev;
      });
    }, 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error('Update password error:', err);
      setError(err.message || 'No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nueva contraseña · Valopo</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <ValopoLogo size={40} />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
            </Link>
          </nav>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Session error - invalid or expired link */}
            {sessionError && !sessionReady && (
              <div className="text-center">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-red-600" strokeWidth={2} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Enlace inválido o expirado
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                  El enlace de recuperación ha expirado o no es válido. Solicita
                  uno nuevo.
                </p>
                <Link
                  href="/reset-password"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Solicitar nuevo enlace
                </Link>
              </div>
            )}

            {/* Waiting for session */}
            {!sessionReady && !sessionError && (
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Verificando enlace…</p>
              </div>
            )}

            {/* Ready to set new password */}
            {sessionReady && !success && (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-blue-600" strokeWidth={2} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Nueva contraseña
                  </h1>
                  <p className="text-sm text-slate-500">
                    Introduce tu nueva contraseña. Mínimo 6 caracteres.
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
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Repetir contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Actualizando…' : 'Guardar nueva contraseña'}
                  </button>
                </form>
              </>
            )}

            {/* Success */}
            {success && (
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Contraseña actualizada
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                  Tu contraseña se ha cambiado correctamente. Ya puedes entrar con
                  tu nueva contraseña.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Ir al Dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
