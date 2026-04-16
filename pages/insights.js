import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/usePlan';
import MobileNav from '../components/MobileNav';
import {
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Zap,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function Insights() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [isPro, setIsPro] = useState(false);

  const { isPro: planPro, loading: planLoading } = usePlan(user?.id);

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

  useEffect(() => {
    if (!planLoading) setIsPro(planPro);
  }, [planPro, planLoading]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Error generando el análisis');
        return;
      }

      setAnalysis(json.analysis);
      setIsPro(json.isPro);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setAnalyzing(false);
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
        <title>Insights IA · Valopo</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-slate-900">Valopo</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Proyectos
              </Link>
              <Link
                href="/insights"
                className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg font-semibold"
              >
                Insights
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Salir
              </button>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="md:hidden px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
            >
              Salir
            </button>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8 sm:py-10 pb-24 md:pb-10">
          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-7 h-7 text-blue-600" strokeWidth={2.25} />
              <h1 className="text-3xl font-bold text-slate-900">Insights IA</h1>
            </div>
            <p className="text-slate-500">
              Tu asesor financiero analiza tus datos reales y te dice exactamente
              qué hacer para ganar más.
            </p>
            {!isPro && (
              <p className="text-xs text-slate-400 mt-2">
                Plan Free: 1 análisis al día. Pro: análisis ilimitados.
              </p>
            )}
          </div>

          {/* CTA or results */}
          {!analysis && !analyzing && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-blue-600" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Analiza tu rentabilidad
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto mb-8">
                Valopo analizará tus proyectos, sesiones e ingresos para decirte
                qué proyectos son rentables, cuáles no, y qué deberías hacer hoy.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-lg mx-auto text-left">
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes('Upgrade') && (
                    <button
                      onClick={() => router.push('/account')}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" strokeWidth={2.5} />
                      Upgrade a Pro
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={runAnalysis}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-sm inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                Analizar mi rentabilidad
              </button>
            </div>
          )}

          {/* Loading state */}
          {analyzing && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Analizando tu rentabilidad…
              </h2>
              <p className="text-slate-500">
                Revisando tus proyectos, sesiones e ingresos. Esto tarda unos segundos.
              </p>
            </div>
          )}

          {/* Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Resumen</h2>
                    <p className="text-slate-600 mt-2 leading-relaxed">{analysis.summary}</p>
                  </div>
                </div>
              </div>

              {/* Daily tip */}
              {analysis.daily_tip && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                    <div>
                      <h2 className="font-bold text-blue-900">Qué hacer hoy</h2>
                      <p className="text-blue-900 mt-1 text-sm leading-relaxed opacity-90">
                        {analysis.daily_tip}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Two columns: profitable + problematic */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Profitable */}
                {analysis.profitable_projects?.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-emerald-600" strokeWidth={2.25} />
                      <h2 className="font-bold text-emerald-900">Proyectos rentables</h2>
                    </div>
                    <div className="space-y-3">
                      {analysis.profitable_projects.map((p, i) => (
                        <div key={i} className="bg-white/60 rounded-lg p-3">
                          <p className="font-semibold text-emerald-900 text-sm">{p.name}</p>
                          <p className="text-emerald-800 text-xs mt-1 leading-relaxed opacity-80">
                            {p.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Problematic */}
                {analysis.problematic_projects?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-red-600" strokeWidth={2.25} />
                      <h2 className="font-bold text-red-900">Proyectos problemáticos</h2>
                    </div>
                    <div className="space-y-3">
                      {analysis.problematic_projects.map((p, i) => (
                        <div key={i} className="bg-white/60 rounded-lg p-3">
                          <p className="font-semibold text-red-900 text-sm">{p.name}</p>
                          <p className="text-red-800 text-xs mt-1 leading-relaxed opacity-80">
                            {p.problem}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {analysis.alerts?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2.25} />
                    <h2 className="font-bold text-amber-900">Alertas</h2>
                  </div>
                  <div className="space-y-2">
                    {analysis.alerts.map((alert, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                        <p className="text-amber-900 text-sm leading-relaxed">{alert}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-blue-600" strokeWidth={2.25} />
                    <h2 className="font-bold text-slate-900">Recomendaciones</h2>
                  </div>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <p className="text-slate-700 text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze again */}
              <div className="text-center pt-4">
                <button
                  onClick={runAnalysis}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
                  Analizar de nuevo
                </button>
                {!isPro && (
                  <p className="text-xs text-slate-400 mt-3">
                    Free: 1 análisis al día. Upgrade a Pro para análisis ilimitados.
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        <MobileNav />
      </div>
    </>
  );
}
