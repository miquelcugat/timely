import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ValopoLogo from '../../components/ValopoLogo';
import { supabase } from '../../lib/supabaseClient';
import { usePlan } from '../../lib/usePlan';
import MobileNav from '../../components/MobileNav';
import { Clock } from 'lucide-react';

const STATUS_LABELS = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-500' },
};

export default function InvoicesIndex() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const { isPro, loading: planLoading } = usePlan(user?.id);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardClientId, setWizardClientId] = useState('');
  const [wizardPeriod, setWizardPeriod] = useState('last-month');
  const [wizardFrom, setWizardFrom] = useState('');
  const [wizardTo, setWizardTo] = useState('');
  const [wizardLineMode, setWizardLineMode] = useState('grouped');
  const [manualLines, setManualLines] = useState([]);
  const [wizardVatRate, setWizardVatRate] = useState(21);
  const [wizardIrpfRate, setWizardIrpfRate] = useState(15);
  const [wizardIssueDate, setWizardIssueDate] = useState('');
  const [wizardDueDate, setWizardDueDate] = useState('');
  const [wizardNotes, setWizardNotes] = useState('');
  const [wizardPaymentTerms, setWizardPaymentTerms] = useState('');
  const [creating, setCreating] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---------- Auth & data load ----------
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      if (!mounted) return;
      setUser(data.session.user);
      await loadData(data.session.user.id);
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (userId) => {
    try {
      const [
        { data: profileData },
        { data: clientsData },
        { data: projectsData },
        { data: sessionsData },
        { data: invoicesData },
      ] = await Promise.all([
        supabase.from('freelancer_profile').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('clients').select('*').eq('user_id', userId).order('name'),
        supabase.from('projects').select('*').eq('user_id', userId),
        supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: false, nullsFirst: false }),
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('issue_date', { ascending: false }),
      ]);

      setProfile(profileData);
      setClients(clientsData || []);
      setProjects(projectsData || []);
      setSessions(sessionsData || []);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error cargando los datos');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Stats ----------
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const thisYearInvoices = invoices.filter(
      (i) => i.year === currentYear && i.status !== 'cancelled'
    );
    const totalThisYear = thisYearInvoices.reduce((a, i) => a + Number(i.total || 0), 0);
    const pending = invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce((a, i) => a + Number(i.total || 0), 0);
    const paid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((a, i) => a + Number(i.total || 0), 0);
    return {
      totalThisYear,
      pending,
      paid,
      count: invoices.filter((i) => i.status !== 'cancelled').length,
    };
  }, [invoices]);

  // ---------- Filtered invoices ----------
  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  // ---------- Wizard helpers ----------
  const profileComplete =
    profile?.legal_name && profile?.tax_id && profile?.address && profile?.city && profile?.postal_code;

  const clientsWithTaxId = clients.filter((c) => c.tax_id?.trim());

  const openWizard = () => {
    if (!profileComplete) {
      showToast('error', 'Completa tus datos fiscales antes de facturar');
      router.push('/account');
      return;
    }
    if (clientsWithTaxId.length === 0) {
      showToast('error', 'Necesitas al menos un cliente con NIF');
      return;
    }
    // Reset wizard
    setWizardStep(1);
    setWizardClientId(clientsWithTaxId[0]?.id || '');
    setWizardPeriod('last-month');
    applyPeriod('last-month');
    setWizardLineMode('grouped');
    setWizardVatRate(profile?.default_vat_rate ?? 21);
    setWizardIrpfRate(profile?.default_irpf_rate ?? 15);
    const today = new Date().toISOString().slice(0, 10);
    setWizardIssueDate(today);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setWizardDueDate(due.toISOString().slice(0, 10));
    setWizardNotes('');
    setWizardPaymentTerms(profile?.default_payment_terms || '');
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setManualLines([]);
  };

  const applyPeriod = (period) => {
    const now = new Date();
    let from, to;
    if (period === 'this-month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'last-month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'last-30') {
      to = new Date(now);
      from = new Date(now);
      from.setDate(from.getDate() - 30);
    } else {
      return;
    }
    setWizardFrom(from.toISOString().slice(0, 10));
    setWizardTo(to.toISOString().slice(0, 10));
  };

  const handlePeriodChange = (period) => {
    setWizardPeriod(period);
    if (period !== 'custom') applyPeriod(period);
  };

  // Sessions matching wizard filters
  const wizardSessions = useMemo(() => {
    if (!wizardClientId || !wizardFrom || !wizardTo) return [];
    const fromDate = new Date(wizardFrom);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(wizardTo);
    toDate.setHours(23, 59, 59, 999);

    // Projects of this client
    const clientProjectIds = projects
      .filter((p) => p.client_id === wizardClientId)
      .map((p) => p.id);

    return sessions.filter((s) => {
      if (!clientProjectIds.includes(s.project_id)) return false;
      const d = new Date(s.start_time || s.created_at);
      return d >= fromDate && d <= toDate;
    });
  }, [wizardClientId, wizardFrom, wizardTo, sessions, projects]);

  // Build invoice lines preview (sessions)
  const sessionLines = useMemo(() => {
    if (wizardSessions.length === 0) return [];

    if (wizardLineMode === 'detailed') {
      // 1 line per session
      return wizardSessions.map((s) => {
        const project = projects.find((p) => p.id === s.project_id);
        const hours = (s.duration_seconds || 0) / 3600;
        const rate = project?.rate || 0;
        const date = new Date(s.start_time || s.created_at);
        const dateStr = date.toLocaleDateString('es-ES');
        const desc = s.notes
          ? `${dateStr} · ${project?.name || 'Sesión'} — ${s.notes}`
          : `${dateStr} · ${project?.name || 'Sesión'}`;
        return {
          description: desc,
          quantity: Number(hours.toFixed(2)),
          unit_price: Number(rate.toFixed(2)),
          amount: Number((hours * rate).toFixed(2)),
          project_id: s.project_id,
          session_ids: [s.id],
          source: 'session',
        };
      });
    } else {
      // Grouped: 1 line per project
      const byProject = {};
      wizardSessions.forEach((s) => {
        if (!byProject[s.project_id]) {
          byProject[s.project_id] = {
            project_id: s.project_id,
            sessions: [],
            totalHours: 0,
            rate: projects.find((p) => p.id === s.project_id)?.rate || 0,
          };
        }
        byProject[s.project_id].sessions.push(s);
        byProject[s.project_id].totalHours += (s.duration_seconds || 0) / 3600;
      });
      return Object.values(byProject).map((g) => {
        const project = projects.find((p) => p.id === g.project_id);
        const fromMonth = new Date(wizardFrom).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return {
          description: `${project?.name || 'Servicios'} — ${fromMonth}`,
          quantity: Number(g.totalHours.toFixed(2)),
          unit_price: Number(g.rate.toFixed(2)),
          amount: Number((g.totalHours * g.rate).toFixed(2)),
          project_id: g.project_id,
          session_ids: g.sessions.map((s) => s.id),
          source: 'session',
        };
      });
    }
  }, [wizardSessions, wizardLineMode, projects, wizardFrom]);

  // Combine session lines + manual lines
  const wizardLines = useMemo(() => {
    return [...sessionLines, ...manualLines.map(l => ({
      description: l.description,
      quantity: Number(l.quantity),
      unit_price: Number(l.unit_price),
      amount: Number((Number(l.quantity) * Number(l.unit_price)).toFixed(2)),
      project_id: null,
      session_ids: null,
      source: 'manual',
    }))];
  }, [sessionLines, manualLines]);

  const addManualLine = () => {
    setManualLines(prev => [...prev, {
      id: Date.now() + Math.random(),
      description: '',
      quantity: 1,
      unit_price: 0,
    }]);
  };

  const updateManualLine = (id, field, value) => {
    setManualLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeManualLine = (id) => {
    setManualLines(prev => prev.filter(l => l.id !== id));
  };

  const wizardTotals = useMemo(() => {
    const subtotal = wizardLines.reduce((a, l) => a + l.amount, 0);
    const vatAmount = (subtotal * wizardVatRate) / 100;
    const irpfAmount = (subtotal * wizardIrpfRate) / 100;
    const total = subtotal + vatAmount - irpfAmount;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      irpfAmount: Number(irpfAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [wizardLines, wizardVatRate, wizardIrpfRate]);

  // ---------- Create invoice ----------
  const createInvoice = async () => {
    if (wizardLines.length === 0) {
      showToast('error', 'Añade al menos una línea a la factura');
      return;
    }
    // Validate manual lines
    for (const l of manualLines) {
      if (!l.description.trim()) {
        showToast('error', 'Todas las líneas manuales necesitan descripción');
        return;
      }
      if (Number(l.quantity) <= 0 || Number(l.unit_price) < 0) {
        showToast('error', 'Revisa cantidades y precios de las líneas manuales');
        return;
      }
    }
    setCreating(true);
    try {
      const year = new Date(wizardIssueDate).getFullYear();

      // Get next sequence number
      const { data: seqData, error: seqError } = await supabase.rpc('next_invoice_number', {
        p_user_id: user.id,
        p_year: year,
      });
      if (seqError) throw seqError;
      const sequence = seqData;

      const prefix = profile?.invoice_prefix || '';
      const invoiceNumber = `${prefix}${year}-${String(sequence).padStart(3, '0')}`;

      const client = clients.find((c) => c.id === wizardClientId);

      // Snapshots
      const freelancerSnapshot = {
        legal_name: profile.legal_name,
        tax_id: profile.tax_id,
        trade_name: profile.trade_name,
        address: profile.address,
        postal_code: profile.postal_code,
        city: profile.city,
        province: profile.province,
        country: profile.country,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        iban: profile.iban,
        bank_name: profile.bank_name,
        logo_url: profile.logo_url,
        invoice_footer: profile.invoice_footer,
      };
      const clientSnapshot = {
        name: client.name,
        tax_id: client.tax_id,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        postal_code: client.postal_code,
        country: client.country,
      };

      // Insert invoice
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .insert([
          {
            user_id: user.id,
            client_id: wizardClientId,
            invoice_number: invoiceNumber,
            year,
            sequence,
            issue_date: wizardIssueDate,
            due_date: wizardDueDate || null,
            status: 'draft',
            line_mode: wizardLineMode,
            freelancer_snapshot: freelancerSnapshot,
            client_snapshot: clientSnapshot,
            subtotal: wizardTotals.subtotal,
            vat_rate: wizardVatRate,
            vat_amount: wizardTotals.vatAmount,
            irpf_rate: wizardIrpfRate,
            irpf_amount: wizardTotals.irpfAmount,
            total: wizardTotals.total,
            notes: wizardNotes.trim() || null,
            payment_terms: wizardPaymentTerms.trim() || null,
          },
        ])
        .select()
        .single();

      if (invError) throw invError;

      // Insert lines
      const linesPayload = wizardLines.map((l, idx) => ({
        invoice_id: invData.id,
        position: idx,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        amount: l.amount,
        project_id: l.project_id,
        session_ids: l.session_ids,
      }));
      const { error: linesError } = await supabase.from('invoice_lines').insert(linesPayload);
      if (linesError) throw linesError;

      showToast('success', `Factura ${invoiceNumber} creada`);
      closeWizard();
      await loadData(user.id);
      router.push(`/invoices/${invData.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('error', error.message || 'No se pudo crear la factura');
    } finally {
      setCreating(false);
    }
  };

  // ---------- Helpers ----------
  const formatEUR = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  };

  // ---------- Loading ----------
  if (loading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando facturas…</span>
        </div>
      </div>
    );
  }

  // ---------- FREE: blurred mockup ----------
  if (!isPro) {
    return (
      <>
        <Head>
          <title>Mis facturas · Valopo</title>
        </Head>
        <div className="min-h-screen bg-slate-50">
          <Header isPro={isPro} active="invoices" />
          <main className="max-w-6xl mx-auto px-6 py-10 pb-24 md:pb-10 relative">
            <div className="filter blur-sm pointer-events-none select-none">
              <h1 className="text-3xl font-bold text-slate-900 mb-8">Mis facturas</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Facturado este año', value: '12.450 €' },
                  { label: 'Pendiente de cobro', value: '3.200 €' },
                  { label: 'Cobrado', value: '9.250 €' },
                  { label: 'Total facturas', value: '18' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 uppercase">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {[
                  { num: '2026-018', client: 'Acme S.L.', total: '1.250 €', status: 'Pagada', color: 'bg-emerald-100 text-emerald-700' },
                  { num: '2026-017', client: 'Beta Corp', total: '850 €', status: 'Enviada', color: 'bg-blue-100 text-blue-700' },
                  { num: '2026-016', client: 'Gamma Studio', total: '2.400 €', status: 'Pagada', color: 'bg-emerald-100 text-emerald-700' },
                  { num: '2026-015', client: 'Delta Inc.', total: '700 €', status: 'Vencida', color: 'bg-red-100 text-red-700' },
                ].map((i) => (
                  <div key={i.num} className="p-5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{i.num}</p>
                      <p className="text-sm text-slate-500">{i.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{i.total}</p>
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${i.color}`}>
                        {i.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 mt-20">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mb-4">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h2 className="font-bold text-2xl text-slate-900 mb-2">
                    Facturas profesionales
                  </h2>
                  <p className="text-sm text-slate-600">
                    Genera facturas con tu logo, datos fiscales, IVA, IRPF y numeración legal correlativa. Listas para enviar a tus clientes.
                  </p>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-emerald-600 font-bold">✓</span>
                    PDF profesional con tu marca
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-emerald-600 font-bold">✓</span>
                    Numeración correlativa legal
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-emerald-600 font-bold">✓</span>
                    Genera desde tus sesiones automáticamente
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-emerald-600 font-bold">✓</span>
                    Marca como pagada / enviada / vencida
                  </li>
                </ul>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-slate-900">
                    14,99 €<span className="text-base font-normal text-slate-500">/mes</span>
                  </p>
                </div>
                <button
                  onClick={() => router.push('/account')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Upgrade a Pro
                </button>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  // ---------- PRO: full UI ----------
  return (
    <>
      <Head>
        <title>Mis facturas · Valopo</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Header isPro={isPro} active="invoices" />

        <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10 pb-24 md:pb-10">
          {/* Page header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Mis facturas</h1>
              <p className="text-sm text-slate-500">
                {invoices.length === 0
                  ? 'Aún no has creado ninguna factura.'
                  : `${invoices.length} ${invoices.length === 1 ? 'factura' : 'facturas'} en total.`}
              </p>
            </div>
            <button
              onClick={openWizard}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition shadow-sm"
            >
              + Nueva factura
            </button>
          </div>

          {/* Profile completeness warning */}
          {!profileComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-900">
                <strong>⚠ Datos fiscales incompletos.</strong> Antes de crear facturas necesitas
                rellenar tus datos fiscales en{' '}
                <Link href="/account" className="underline font-semibold">
                  Mi cuenta
                </Link>
                .
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Facturado este año" value={formatEUR(stats.totalThisYear)} />
            <StatCard label="Pendiente de cobro" value={formatEUR(stats.pending)} accent="amber" />
            <StatCard label="Cobrado" value={formatEUR(stats.paid)} accent="emerald" />
            <StatCard label="Total facturas" value={String(stats.count)} />
          </div>

          {/* Status filter */}
          {invoices.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'draft', label: 'Borradores' },
                { key: 'sent', label: 'Enviadas' },
                { key: 'paid', label: 'Pagadas' },
                { key: 'overdue', label: 'Vencidas' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    statusFilter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Aún no tienes facturas
              </h2>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Genera tu primera factura desde las sesiones de tiempo registradas. Solo
                tarda 30 segundos.
              </p>
              <button
                onClick={openWizard}
                disabled={!profileComplete || clientsWithTaxId.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                + Crear mi primera factura
              </button>
              {clientsWithTaxId.length === 0 && (
                <p className="text-xs text-slate-500 mt-3">
                  Necesitas al menos un cliente con NIF.{' '}
                  <Link href="/clients" className="text-blue-600 hover:underline font-semibold">
                    Crear cliente
                  </Link>
                </p>
              )}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                No hay facturas con ese filtro.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const status = STATUS_LABELS[inv.status] || STATUS_LABELS.draft;
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="block p-5 hover:bg-slate-50/50 transition"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-slate-900 font-mono">
                              {inv.invoice_number}
                            </p>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {inv.client_snapshot?.name || 'Cliente borrado'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Emitida: {formatDate(inv.issue_date)}
                            {inv.due_date && ` · Vence: ${formatDate(inv.due_date)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900 tabular-nums">
                            {formatEUR(inv.total)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-20 md:bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

        <MobileNav />

        {/* Wizard modal */}
        {showWizard && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
              {/* Wizard header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Paso {wizardStep} de 4
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {wizardStep === 1 && 'Cliente'}
                      {wizardStep === 2 && 'Periodo y sesiones'}
                      {wizardStep === 3 && 'Líneas y modo de detalle'}
                      {wizardStep === 4 && 'Impuestos y revisión'}
                    </h2>
                  </div>
                  <button
                    onClick={closeWizard}
                    className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                {/* Progress bar */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`flex-1 h-1.5 rounded-full ${
                        s <= wizardStep ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Wizard body */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Step 1: Client */}
                {wizardStep === 1 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-4">
                      Elige el cliente al que vas a facturar.
                    </p>
                    {clientsWithTaxId.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-900 mb-3">
                          <strong>No tienes clientes facturables.</strong> Para facturar, el cliente
                          debe tener NIF rellenado.
                        </p>
                        <button
                          onClick={() => router.push('/clients')}
                          className="text-sm text-blue-600 font-semibold hover:underline"
                        >
                          Ir a Mis clientes →
                        </button>
                      </div>
                    ) : (
                      <select
                        value={wizardClientId}
                        onChange={(e) => setWizardClientId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                      >
                        {clientsWithTaxId.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} · NIF: {c.tax_id}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-slate-500 mt-3">
                      💡 Solo aparecen clientes con NIF rellenado. Para facturar es obligatorio.
                    </p>
                  </div>
                )}

                {/* Step 2: Period */}
                {wizardStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Periodo
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { key: 'this-month', label: 'Este mes' },
                          { key: 'last-month', label: 'Mes anterior' },
                          { key: 'last-30', label: 'Últimos 30 días' },
                          { key: 'custom', label: 'Personalizado' },
                        ].map((p) => (
                          <button
                            key={p.key}
                            onClick={() => handlePeriodChange(p.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              wizardPeriod === p.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Desde</label>
                          <input
                            type="date"
                            value={wizardFrom}
                            onChange={(e) => {
                              setWizardFrom(e.target.value);
                              setWizardPeriod('custom');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Hasta</label>
                          <input
                            type="date"
                            value={wizardTo}
                            onChange={(e) => {
                              setWizardTo(e.target.value);
                              setWizardPeriod('custom');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sessions preview */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-slate-900">
                          🔍 Sesiones encontradas: {wizardSessions.length}
                        </p>
                      </div>
                      {wizardSessions.length === 0 ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-slate-700">
                            No hay sesiones de este cliente en este periodo.
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Puedes continuar y añadir líneas manualmente en el siguiente paso (ej: servicios cerrados, materiales, etc.)
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">Total horas</p>
                              <p className="font-bold text-slate-900 tabular-nums">
                                {wizardSessions
                                  .reduce((a, s) => a + (s.duration_seconds || 0) / 3600, 0)
                                  .toFixed(1)}
                                h
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Importe (sin IVA)</p>
                              <p className="font-bold text-emerald-600 tabular-nums">
                                {formatEUR(
                                  wizardSessions.reduce((a, s) => a + Number(s.earned || 0), 0)
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600">
                            <p className="font-semibold mb-1">De los proyectos:</p>
                            {Object.entries(
                              wizardSessions.reduce((acc, s) => {
                                const p = projects.find((p) => p.id === s.project_id);
                                const name = p?.name || 'Desconocido';
                                if (!acc[name]) acc[name] = { hours: 0 };
                                acc[name].hours += (s.duration_seconds || 0) / 3600;
                                return acc;
                              }, {})
                            ).map(([name, d]) => (
                              <p key={name}>
                                • {name} ({d.hours.toFixed(1)}h)
                              </p>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Lines preview */}
                {wizardStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Modo de detalle
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setWizardLineMode('grouped')}
                          className={`p-4 rounded-lg border-2 text-left transition ${
                            wizardLineMode === 'grouped'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="font-bold text-sm text-slate-900">Agrupadas</p>
                          <p className="text-xs text-slate-500 mt-1">
                            1 línea por proyecto. Factura limpia y corta.
                          </p>
                        </button>
                        <button
                          onClick={() => setWizardLineMode('detailed')}
                          className={`p-4 rounded-lg border-2 text-left transition ${
                            wizardLineMode === 'detailed'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="font-bold text-sm text-slate-900">Detalladas</p>
                          <p className="text-xs text-slate-500 mt-1">
                            1 línea por sesión, con notas. Máximo detalle.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Lines preview */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Vista previa de líneas ({wizardLines.length})
                      </p>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 grid grid-cols-[1fr_60px_70px_80px] gap-2 text-xs font-bold text-slate-600 uppercase">
                          <div>Descripción</div>
                          <div className="text-right">Cant.</div>
                          <div className="text-right">€/u</div>
                          <div className="text-right">Importe</div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                          {wizardLines.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-slate-400">
                              Selecciona un período con sesiones o añade líneas manualmente
                            </div>
                          )}
                          {wizardLines.map((l, i) => (
                            <div
                              key={i}
                              className={`px-3 py-2 grid grid-cols-[1fr_60px_70px_80px] gap-2 text-sm ${l.source === 'manual' ? 'bg-blue-50/40' : ''}`}
                            >
                              <div className="text-slate-700 truncate flex items-center gap-1.5">
                                {l.source === 'manual' && (
                                  <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase flex-shrink-0">Manual</span>
                                )}
                                <span className="truncate">{l.description}</span>
                              </div>
                              <div className="text-right tabular-nums text-slate-600">
                                {l.quantity}
                              </div>
                              <div className="text-right tabular-nums text-slate-600">
                                {l.unit_price}
                              </div>
                              <div className="text-right tabular-nums font-semibold text-slate-900">
                                {formatEUR(l.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Manual lines editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Líneas manuales {manualLines.length > 0 && `(${manualLines.length})`}
                        </p>
                        <button
                          type="button"
                          onClick={addManualLine}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition inline-flex items-center gap-1"
                        >
                          <span className="text-base leading-none">+</span>
                          Añadir línea
                        </button>
                      </div>
                      {manualLines.length === 0 ? (
                        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                          Para cobrar cosas que no vienen del cronómetro: materiales, retainers, gastos reembolsables, etc.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {manualLines.map((l) => (
                            <div
                              key={l.id}
                              className="border-2 border-blue-100 bg-blue-50/30 rounded-lg p-3 space-y-2"
                            >
                              <input
                                type="text"
                                placeholder="Descripción (ej: Diseño de logo, Hosting anual…)"
                                value={l.description}
                                onChange={(e) => updateManualLine(l.id, 'description', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                              />
                              <div className="grid grid-cols-[80px_100px_1fr_36px] gap-2 items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Cant."
                                  value={l.quantity}
                                  onChange={(e) => updateManualLine(l.id, 'quantity', e.target.value)}
                                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm tabular-nums text-center focus:outline-none focus:border-blue-500 transition"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="€ unitario"
                                  value={l.unit_price}
                                  onChange={(e) => updateManualLine(l.id, 'unit_price', e.target.value)}
                                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm tabular-nums text-center focus:outline-none focus:border-blue-500 transition"
                                />
                                <div className="text-right text-sm font-bold text-slate-900 tabular-nums">
                                  {formatEUR((Number(l.quantity) || 0) * (Number(l.unit_price) || 0))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeManualLine(l.id)}
                                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  aria-label="Eliminar línea"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Taxes & Review */}
                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          Fecha emisión
                        </label>
                        <input
                          type="date"
                          value={wizardIssueDate}
                          onChange={(e) => setWizardIssueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          Vencimiento
                        </label>
                        <input
                          type="date"
                          value={wizardDueDate}
                          onChange={(e) => setWizardDueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          IVA (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={wizardVatRate}
                          onChange={(e) => setWizardVatRate(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          IRPF (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={wizardIrpfRate}
                          onChange={(e) => setWizardIrpfRate(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm tabular-nums"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Condiciones de pago (en la factura)
                      </label>
                      <textarea
                        value={wizardPaymentTerms}
                        onChange={(e) => setWizardPaymentTerms(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Notas internas (NO aparecen en el PDF)
                      </label>
                      <textarea
                        value={wizardNotes}
                        onChange={(e) => setWizardNotes(e.target.value)}
                        rows={2}
                        placeholder="Notas privadas para ti…"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm resize-none"
                      />
                    </div>

                    {/* Totals */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-slate-700">
                          <span>Subtotal</span>
                          <span className="font-semibold tabular-nums">
                            {formatEUR(wizardTotals.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>+ IVA ({wizardVatRate}%)</span>
                          <span className="font-semibold tabular-nums">
                            {formatEUR(wizardTotals.vatAmount)}
                          </span>
                        </div>
                        {wizardIrpfRate > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>− IRPF ({wizardIrpfRate}%)</span>
                            <span className="font-semibold tabular-nums">
                              −{formatEUR(wizardTotals.irpfAmount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-blue-200 mt-2">
                          <span>TOTAL</span>
                          <span className="tabular-nums text-blue-700">
                            {formatEUR(wizardTotals.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard footer */}
              <div className="p-6 border-t border-slate-100 flex justify-between gap-3">
                <button
                  onClick={() => {
                    if (wizardStep === 1) closeWizard();
                    else setWizardStep(wizardStep - 1);
                  }}
                  disabled={creating}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-60"
                >
                  {wizardStep === 1 ? 'Cancelar' : '← Anterior'}
                </button>
                <button
                  onClick={() => {
                    if (wizardStep < 4) {
                      // Validations
                      if (wizardStep === 1 && !wizardClientId) {
                        showToast('error', 'Elige un cliente');
                        return;
                      }
                      // Step 2 no longer blocks — user may create invoice with only manual lines
                      setWizardStep(wizardStep + 1);
                    } else {
                      createInvoice();
                    }
                  }}
                  disabled={creating}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {wizardStep < 4
                    ? 'Siguiente →'
                    : creating
                    ? 'Generando…'
                    : '✓ Generar factura'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Subcomponents ----------
function Header({ isPro, active }) {
  const router = useRouter();
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-3">
          <ValopoLogo size={40} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isPro ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Proyectos
          </Link>
          <Link
            href="/clients"
            className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Clientes
          </Link>
          <Link
            href="/invoices"
            className={`px-3 sm:px-4 py-2 text-sm rounded-lg transition font-medium ${
              active === 'invoices'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Facturas
          </Link>
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
  );
}

function StatCard({ label, value, accent }) {
  const colors = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    default: 'text-slate-900',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-2 tabular-nums ${colors[accent] || colors.default}`}>
        {value}
      </p>
    </div>
  );
}
