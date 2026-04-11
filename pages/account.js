import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/usePlan';

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const { subscription, plan, isPro, loading: planLoading } = usePlan(user?.id);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      setLoading(false);
    };
    init();
  }, [router]);

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error || 'Error abriendo el portal');
    } catch (e) {
      alert('Error abriendo el portal');
    } finally {
      setOpening(false);
    }
  };

  const upgrade = async () => {
    setOpening(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error || 'Error abriendo el checkout');
    } catch (e) {
      alert('Error abriendo el checkout');
    } finally {
      setOpening(false);
    }
  };

  if (loading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Cargando…</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mi cuenta · Timely</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">⏱</span>
              </div>
              <span className="font-bold text-xl text-slate-900">Timely</span>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium"
            >
              ← Volver al dashboard
            </Link>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Mi cuenta</h1>

          {/* Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Perfil</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{user?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cuenta creada</span>
                <span className="font-medium text-slate-900">
                  {new Date(user?.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Suscripción</h2>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500">Plan actual</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {isPro ? 'Pro' : 'Free'}
                </p>
                {isPro && subscription?.current_period_end && (
                  <p className="text-xs text-slate-500 mt-2">
                    {subscription.cancel_at_period_end
                      ? `Cancelará el ${new Date(
                          subscription.current_period_end
                        ).toLocaleDateString('es-ES')}`
                      : `Renovación el ${new Date(
                          subscription.current_period_end
                        ).toLocaleDateString('es-ES')}`}
                  </p>
                )}
                {subscription?.status === 'past_due' && (
                  <p className="text-xs text-red-600 font-semibold mt-2">
                    ⚠ Pago pendiente — actualiza tu método de pago
                  </p>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-full text-xs font-bold ${
                  isPro
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isPro ? 'PRO' : 'FREE'}
              </div>
            </div>

            {isPro ? (
              <button
                onClick={openPortal}
                disabled={opening}
                className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-60"
              >
                {opening ? 'Abriendo…' : 'Gestionar suscripción'}
              </button>
            ) : (
              <button
                onClick={upgrade}
                disabled={opening}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {opening ? 'Abriendo…' : 'Upgrade a Pro · 14,99 €/mes'}
              </button>
            )}
          </div>

          {/* What Pro includes */}
          {!isPro && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Pro incluye</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Proyectos ilimitados</li>
                <li>✓ Histórico completo (sin límite de días)</li>
                <li>✓ Exportar a PDF con gráficos</li>
                <li>✓ Soporte prioritario</li>
              </ul>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
