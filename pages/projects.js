import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Mail,
  MapPin,
  Lock,
  FileText,
  Check,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ValopoLogo from '../components/ValopoLogo';
import { usePlan } from '../lib/usePlan';
import MobileNav from '../components/MobileNav';

export default function Projects() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState('project');
  const [selectedId, setSelectedId] = useState('');

  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Create project modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');
  const [newProjectClientId, setNewProjectClientId] = useState('');
  const [newProjectBillingType, setNewProjectBillingType] = useState('hourly');
  const [newProjectFixedPrice, setNewProjectFixedPrice] = useState('');
  const [newProjectEstimatedHours, setNewProjectEstimatedHours] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const { isPro, loading: planLoading, limits } = usePlan(user?.id);

  const dailyChartRef = useRef(null);
  const weeklyChartRef = useRef(null);
  const hourlyChartRef = useRef(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const formatEUR = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

  const formatHours = (h) => `${(h || 0).toFixed(1)}h`;

  const formatDate = (iso) =>
    new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  const formatDateShort = (d) =>
    new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(d);

  const addProject = async () => {
    const name = newProjectName.trim();
    if (!name) {
      showToast('error', 'Introduce un nombre de proyecto');
      return;
    }

    let rate = null;
    let fixedPrice = null;
    let estimatedHours = null;

    if (newProjectBillingType === 'hourly') {
      rate = parseFloat(newProjectRate);
      if (Number.isNaN(rate) || rate <= 0) {
        showToast('error', 'Introduce una tarifa válida');
        return;
      }
    } else if (newProjectBillingType === 'fixed') {
      fixedPrice = parseFloat(newProjectFixedPrice);
      if (Number.isNaN(fixedPrice) || fixedPrice <= 0) {
        showToast('error', 'Introduce un precio válido');
        return;
      }
      rate = 0;
      if (newProjectEstimatedHours) {
        const est = parseFloat(newProjectEstimatedHours);
        if (!Number.isNaN(est) && est > 0) estimatedHours = est;
      }
    }

    if (!isPro && limits && projects.length >= limits.maxProjects) {
      setShowUpgradeModal(true);
      return;
    }

    setSavingProject(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          name,
          rate: rate || 0,
          client_id: newProjectClientId || null,
          billing_type: newProjectBillingType,
          fixed_price: fixedPrice,
          estimated_hours: estimatedHours,
        }])
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setProjects((prev) => [data[0], ...prev]);
        setSelectedId(data[0].id);
      }
      setNewProjectName('');
      setNewProjectRate('');
      setNewProjectClientId('');
      setNewProjectFixedPrice('');
      setNewProjectEstimatedHours('');
      setNewProjectBillingType('hourly');
      setCreateModalOpen(false);
      showToast('success', 'Proyecto creado');
    } catch (error) {
      console.error('Error adding project:', error);
      showToast('error', 'No se pudo crear el proyecto');
    } finally {
      setSavingProject(false);
    }
  };

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
        { data: projectsData, error: pErr },
        { data: sessionsData, error: sErr },
        { data: clientsData, error: cErr },
        { data: profileData },
        { data: expensesData },
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: false, nullsFirst: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
        supabase
          .from('freelancer_profile')
          .select('hourly_rate_goal, monthly_income_goal')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('project_expenses')
          .select('*')
          .eq('user_id', userId)
          .order('expense_date', { ascending: false }),
      ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;
      if (cErr) throw cErr;

      setProjects(projectsData || []);
      setSessions(sessionsData || []);
      setClients(clientsData || []);
      setProfile(profileData || null);
      setExpenses(expensesData || []);

      const fromQuery = router.query.id;
      if (fromQuery && (projectsData || []).some((p) => p.id === fromQuery)) {
        setSelectedId(fromQuery);
      } else if (projectsData?.length > 0) {
        setSelectedId(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error cargando los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'project') {
      setSelectedId(projects[0]?.id || '');
    } else if (mode === 'client') {
      const clientsWithProjects = clients.filter((c) =>
        projects.some((p) => p.client_id === c.id)
      );
      setSelectedId(clientsWithProjects[0]?.id || '');
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProject = mode === 'project' ? projects.find((p) => p.id === selectedId) : null;
  const selectedClient = mode === 'client' ? clients.find((c) => c.id === selectedId) : null;
  const projectClient =
    selectedProject && selectedProject.client_id
      ? clients.find((c) => c.id === selectedProject.client_id)
      : null;

  const analysisSessions = useMemo(() => {
    if (mode === 'project') {
      return sessions.filter((s) => s.project_id === selectedId);
    } else {
      const clientProjectIds = projects
        .filter((p) => p.client_id === selectedId)
        .map((p) => p.id);
      return sessions.filter((s) => clientProjectIds.includes(s.project_id));
    }
  }, [mode, selectedId, sessions, projects]);

  const clientProjects = useMemo(() => {
    if (mode !== 'client') return [];
    return projects.filter((p) => p.client_id === selectedId);
  }, [mode, selectedId, projects]);

  const sessionDate = (s) => new Date(s.start_time || s.created_at);
  const sessionHours = (s) => Math.max(0, (s.duration_seconds || 0) / 3600);
  const sessionEarnings = (s) => Number(s.earned || 0);

  const stats = useMemo(() => {
    const totalHours = analysisSessions.reduce((a, s) => a + sessionHours(s), 0);
    const totalEarnings = analysisSessions.reduce((a, s) => a + sessionEarnings(s), 0);
    const sessionCount = analysisSessions.length;
    const avgSessionMin = sessionCount > 0 ? (totalHours * 60) / sessionCount : 0;
    const avgEarningsPerSession = sessionCount > 0 ? totalEarnings / sessionCount : 0;
    const effectiveRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    const sortedByDate = [...analysisSessions].sort(
      (a, b) => sessionDate(a) - sessionDate(b)
    );
    const firstSession = sortedByDate[0];
    const lastSession = sortedByDate[sortedByDate.length - 1];

    return {
      totalHours,
      totalEarnings,
      sessionCount,
      avgSessionMin,
      avgEarningsPerSession,
      effectiveRate,
      firstSession,
      lastSession,
    };
  }, [analysisSessions]);

  // ---------- Profitability analysis (Nivel 1.5) ----------
  const hourlyGoal = profile?.hourly_rate_goal ? Number(profile.hourly_rate_goal) : null;

  const profitability = useMemo(() => {
    if (!hourlyGoal) return null;

    let effectiveRate = 0;
    if (mode === 'project' && selectedProject) {
      effectiveRate = Number(selectedProject.rate) || 0;
    } else if (mode === 'client' && clientProjects.length > 0) {
      const totalH = analysisSessions.reduce((a, s) => a + sessionHours(s), 0);
      if (totalH > 0) {
        effectiveRate = analysisSessions.reduce((a, s) => a + sessionEarnings(s), 0) / totalH;
      } else {
        effectiveRate =
          clientProjects.reduce((a, p) => a + (Number(p.rate) || 0), 0) /
          clientProjects.length;
      }
    } else {
      return null;
    }

    if (effectiveRate <= 0) return null;

    const ratio = effectiveRate / hourlyGoal;
    const deltaPct = ((effectiveRate - hourlyGoal) / hourlyGoal) * 100;

    let label, description, bgClass, borderClass, textClass, iconColor, Icon;

    if (ratio >= 1.10) {
      label = 'Excelente';
      description = `Te paga ${effectiveRate.toFixed(2)} €/h, un ${Math.abs(deltaPct).toFixed(0)}% por encima de tu objetivo de ${hourlyGoal} €/h. ¡Mantenlo!`;
      bgClass = 'bg-emerald-50';
      borderClass = 'border-emerald-200';
      textClass = 'text-emerald-900';
      iconColor = 'text-emerald-600';
      Icon = TrendingUp;
    } else if (ratio >= 1) {
      label = 'Rentable';
      description = `Te paga ${effectiveRate.toFixed(2)} €/h, justo por encima de tu objetivo de ${hourlyGoal} €/h.`;
      bgClass = 'bg-emerald-50';
      borderClass = 'border-emerald-200';
      textClass = 'text-emerald-900';
      iconColor = 'text-emerald-600';
      Icon = CheckCircle2;
    } else if (ratio >= 0.85) {
      label = 'Margen ajustado';
      description = `Te paga ${effectiveRate.toFixed(2)} €/h, un ${Math.abs(deltaPct).toFixed(0)}% por debajo de tu objetivo de ${hourlyGoal} €/h. Considera renegociar.`;
      bgClass = 'bg-amber-50';
      borderClass = 'border-amber-200';
      textClass = 'text-amber-900';
      iconColor = 'text-amber-600';
      Icon = AlertCircle;
    } else {
      label = 'Por debajo del objetivo';
      description = `Te paga solo ${effectiveRate.toFixed(2)} €/h, un ${Math.abs(deltaPct).toFixed(0)}% por debajo de tu objetivo de ${hourlyGoal} €/h. Estás perdiendo valor con este ${mode === 'project' ? 'proyecto' : 'cliente'}.`;
      bgClass = 'bg-red-50';
      borderClass = 'border-red-200';
      textClass = 'text-red-900';
      iconColor = 'text-red-600';
      Icon = TrendingDown;
    }

    return {
      label,
      description,
      bgClass,
      borderClass,
      textClass,
      iconColor,
      Icon,
      effectiveRate,
      deltaPct,
    };
  }, [hourlyGoal, mode, selectedProject, clientProjects, analysisSessions]);

  const dailyData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ date: d, hours: 0, earnings: 0 });
    }
    analysisSessions.forEach((s) => {
      const d = sessionDate(s);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - d) / 86400000);
      if (diffDays >= 0 && diffDays < 30) {
        const day = days[29 - diffDays];
        day.hours += sessionHours(s);
        day.earnings += sessionEarnings(s);
      }
    });
    return days.map((d) => ({
      label: formatDateShort(d.date),
      hours: Number(d.hours.toFixed(2)),
      earnings: Number(d.earnings.toFixed(2)),
    }));
  }, [analysisSessions]);

  const weeklyData = useMemo(() => {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);

    for (let i = 11; i >= 0; i--) {
      const start = new Date(monday);
      start.setDate(monday.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      weeks.push({ start, end, hours: 0, earnings: 0 });
    }
    analysisSessions.forEach((s) => {
      const d = sessionDate(s);
      weeks.forEach((w) => {
        if (d >= w.start && d < w.end) {
          w.hours += sessionHours(s);
          w.earnings += sessionEarnings(s);
        }
      });
    });
    return weeks.map((w) => ({
      label: formatDateShort(w.start),
      hours: Number(w.hours.toFixed(2)),
      earnings: Number(w.earnings.toFixed(2)),
    }));
  }, [analysisSessions]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}h`,
      sessions: 0,
      hoursWorked: 0,
    }));
    analysisSessions.forEach((s) => {
      const d = sessionDate(s);
      const h = d.getHours();
      hours[h].sessions += 1;
      hours[h].hoursWorked += sessionHours(s);
    });
    return hours.map((h) => ({
      ...h,
      hoursWorked: Number(h.hoursWorked.toFixed(2)),
    }));
  }, [analysisSessions]);

  const analysisTitle =
    mode === 'project' ? selectedProject?.name : selectedClient?.name;

  const exportCSV = () => {
    if (!analysisTitle) return;

    const headerInfo =
      mode === 'project'
        ? [
            ['Proyecto', selectedProject.name],
            ['Cliente', projectClient?.name || '—'],
            ['NIF cliente', projectClient?.tax_id || '—'],
            ['Tarifa €/h', selectedProject.rate],
          ]
        : [
            ['Cliente', selectedClient.name],
            ['NIF cliente', selectedClient.tax_id || '—'],
            ['Email cliente', selectedClient.email || '—'],
            ['Proyectos incluidos', clientProjects.map((p) => p.name).join('; ')],
          ];

    const rows = [
      ...headerInfo,
      ['Total horas', stats.totalHours.toFixed(2)],
      ['Total ganado €', stats.totalEarnings.toFixed(2)],
      ['Sesiones', stats.sessionCount],
      [],
      ['Fecha inicio', 'Fecha fin', 'Proyecto', 'Cliente', 'Duración (h)', 'Ganado (€)', 'Notas'],
      ...analysisSessions.map((s) => {
        const proj = projects.find((p) => p.id === s.project_id);
        const cli = proj?.client_id ? clients.find((c) => c.id === proj.client_id) : null;
        return [
          s.start_time ? new Date(s.start_time).toISOString() : '',
          s.end_time ? new Date(s.end_time).toISOString() : '',
          proj?.name || '',
          cli?.name || '',
          sessionHours(s).toFixed(2),
          sessionEarnings(s).toFixed(2),
          (s.notes || '').replace(/[\r\n,;]+/g, ' '),
        ];
      }),
    ];

    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const str = String(cell ?? '');
            return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Valopo_${analysisTitle.replace(/[^a-z0-9]/gi, '_')}_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'CSV exportado');
  };

  const exportPDF = async () => {
    if (!analysisTitle) return;
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(
        mode === 'project' ? 'Valopo - Informe de proyecto' : 'Valopo - Informe de cliente',
        margin,
        16
      );
      y = 35;

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(22);
      pdf.text(analysisTitle, margin, y);
      y += 7;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')}`,
        margin,
        y
      );
      y += 8;

      const clientForBlock = mode === 'project' ? projectClient : selectedClient;
      if (clientForBlock) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setFillColor(248, 250, 252);
        const blockHeight = 26;
        pdf.roundedRect(margin, y, pageWidth - margin * 2, blockHeight, 3, 3, 'FD');
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CLIENTE', margin + 5, y + 7);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(clientForBlock.name, margin + 5, y + 14);
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        const details = [
          clientForBlock.tax_id ? `NIF: ${clientForBlock.tax_id}` : null,
          clientForBlock.email,
          [clientForBlock.city, clientForBlock.country].filter(Boolean).join(', '),
        ].filter(Boolean).join('  -  ');
        pdf.text(details, margin + 5, y + 21);
        y += blockHeight + 5;
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'FD');
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');

      const colW = (pageWidth - margin * 2) / 4;
      const statBoxes = [
        ['HORAS TOTALES', `${stats.totalHours.toFixed(1)}h`],
        ['INGRESOS', formatEUR(stats.totalEarnings)],
        ['SESIONES', String(stats.sessionCount)],
        ['MEDIA/SESION', `${stats.avgSessionMin.toFixed(0)} min`],
      ];
      statBoxes.forEach(([label, value], i) => {
        const x = margin + colW * i + 5;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label, x, y + 10);
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text(value, x, y + 22);
      });
      y += 45;

      const chartsToCapture = [
        { ref: dailyChartRef, title: 'Horas por dia (ultimos 30 dias)' },
        { ref: weeklyChartRef, title: 'Ingresos por semana (ultimas 12 semanas)' },
        { ref: hourlyChartRef, title: 'Distribucion por hora del dia' },
      ];

      for (const { ref, title } of chartsToCapture) {
        if (!ref.current) continue;
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (y + imgHeight + 15 > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(title, margin, y);
        y += 5;
        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }

      pdf.addPage();
      y = margin;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('Detalle de sesiones', margin, y);
      y += 8;

      pdf.setFontSize(8);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fecha', margin + 2, y + 5);
      if (mode === 'client') {
        pdf.text('Proyecto', margin + 40, y + 5);
      }
      pdf.text('Duracion', margin + 110, y + 5);
      pdf.text('Ganado', margin + 145, y + 5);
      y += 9;

      pdf.setFont('helvetica', 'normal');
      const sortedSessions = [...analysisSessions].sort(
        (a, b) => sessionDate(b) - sessionDate(a)
      );
      for (const s of sortedSessions) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        const dateStr = formatDate(s.start_time || s.created_at);
        const hours = sessionHours(s);
        const dur = `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}min`;
        pdf.text(dateStr, margin + 2, y);
        if (mode === 'client') {
          const proj = projects.find((p) => p.id === s.project_id);
          const projName = (proj?.name || '').substring(0, 25);
          pdf.text(projName, margin + 40, y);
        }
        pdf.text(dur, margin + 110, y);
        pdf.text(formatEUR(sessionEarnings(s)), margin + 145, y);
        y += 5;
      }

      pdf.save(
        `Valopo_${analysisTitle.replace(/[^a-z0-9]/gi, '_')}_${
          new Date().toISOString().split('T')[0]
        }.pdf`
      );
      showToast('success', 'PDF exportado');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('error', 'No se pudo exportar el PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando…</span>
        </div>
      </div>
    );
  }

  const clientsWithProjects = clients.filter((c) =>
    projects.some((p) => p.client_id === c.id)
  );

  return (
    <>
      <Head>
        <title>Mis proyectos · Valopo</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ValopoLogo size={40} />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
            </div>
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard"
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="px-3 sm:px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg font-semibold"
              >
                Mis proyectos
              </Link>
              <Link
                href="/clients"
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Mis clientes
              </Link>
              <Link
                href="/invoices"
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Facturas
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
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

        <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10 pb-24 md:pb-10">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mis proyectos</h1>
              <p className="text-slate-500 mt-1">
                Análisis detallado, estadísticas y gestión de cada proyecto.
              </p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition inline-flex items-center gap-2 shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Nuevo proyecto
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-slate-500 mb-6">Aún no tienes proyectos.</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Crear mi primer proyecto
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex gap-2 mb-5 border-b border-slate-100">
                  <button
                    onClick={() => setMode('project')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                      mode === 'project'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Por proyecto
                  </button>
                  <button
                    onClick={() => setMode('client')}
                    disabled={clientsWithProjects.length === 0}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                      mode === 'client'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={
                      clientsWithProjects.length === 0
                        ? 'Asigna clientes a tus proyectos primero'
                        : ''
                    }
                  >
                    Por cliente
                  </button>
                </div>

                <div className="grid lg:grid-cols-[1fr_auto_auto] gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      {mode === 'project' ? 'Proyecto a analizar' : 'Cliente a analizar'}
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                    >
                      {mode === 'project'
                        ? projects.map((p) => {
                            const cli = p.client_id
                              ? clients.find((c) => c.id === p.client_id)
                              : null;
                            return (
                              <option key={p.id} value={p.id}>
                                {cli ? `${cli.name} · ` : ''}
                                {p.name} · €{p.rate}/h
                              </option>
                            );
                          })
                        : clientsWithProjects.map((c) => {
                            const count = projects.filter((p) => p.client_id === c.id).length;
                            return (
                              <option key={c.id} value={c.id}>
                                {c.name} ({count} {count === 1 ? 'proy.' : 'proys.'})
                              </option>
                            );
                          })}
                    </select>
                  </div>
                  <button
                    onClick={exportCSV}
                    disabled={!analysisTitle || analysisSessions.length === 0}
                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" strokeWidth={2.5} />
                    Exportar CSV
                  </button>
                  <button
                    onClick={exportPDF}
                    disabled={!analysisTitle || analysisSessions.length === 0 || exporting}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center gap-2"
                  >
                    {exporting ? (
                      'Generando…'
                    ) : (
                      <>
                        {!isPro && <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />}
                        <Download className="w-4 h-4" strokeWidth={2.5} />
                        Exportar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {(projectClient || selectedClient) && (
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5 mb-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                        {mode === 'project' ? 'Cliente del proyecto' : 'Cliente'}
                      </p>
                      <h3 className="text-xl font-bold text-slate-900">
                        {(projectClient || selectedClient).name}
                      </h3>
                      <div className="text-sm text-slate-600 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {(projectClient || selectedClient).tax_id && (
                          <span>
                            NIF: <span className="font-mono">{(projectClient || selectedClient).tax_id}</span>
                          </span>
                        )}
                        {(projectClient || selectedClient).email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" strokeWidth={2.25} />
                            {(projectClient || selectedClient).email}
                          </span>
                        )}
                        {(projectClient || selectedClient).city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" strokeWidth={2.25} />
                            {(projectClient || selectedClient).city}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/clients"
                      className="text-sm text-blue-600 hover:underline font-semibold whitespace-nowrap"
                    >
                      Ver / editar →
                    </Link>
                  </div>
                  {mode === 'client' && clientProjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-100">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Proyectos incluidos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {clientProjects.map((p) => (
                          <span
                            key={p.id}
                            className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full"
                          >
                            {p.name} · €{p.rate}/h
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PROFITABILITY INSIGHT (Nivel 1.5) */}
              {analysisTitle && (
                profitability ? (
                  <div className={`${profitability.bgClass} ${profitability.borderClass} border rounded-2xl p-5 mb-6`}>
                    <div className="flex items-start gap-4">
                      <profitability.Icon
                        className={`w-7 h-7 ${profitability.iconColor} flex-shrink-0 mt-0.5`}
                        strokeWidth={2.25}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <h3 className={`text-lg font-bold ${profitability.textClass}`}>
                            {profitability.label}
                          </h3>
                          <span className={`text-xs font-semibold ${profitability.iconColor}`}>
                            {profitability.deltaPct >= 0 ? '+' : ''}
                            {profitability.deltaPct.toFixed(0)}% vs objetivo
                          </span>
                        </div>
                        <p className={`text-sm ${profitability.textClass} mt-1 opacity-90`}>
                          {profitability.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Define tu objetivo €/hora
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configúralo en Mi cuenta para ver si este {mode === 'project' ? 'proyecto' : 'cliente'} es rentable según tus criterios.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/account"
                      className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Configurar objetivo →
                    </Link>
                  </div>
                )
              )}

              {analysisTitle && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard label="Horas totales" value={formatHours(stats.totalHours)} />
                    <StatCard
                      label="Ingresos"
                      value={formatEUR(stats.totalEarnings)}
                      accent="emerald"
                    />
                    <StatCard label="Sesiones" value={String(stats.sessionCount)} />
                    <StatCard
                      label="Media/sesión"
                      value={`${stats.avgSessionMin.toFixed(0)} min`}
                    />
                    {mode === 'project' && selectedProject && (
                      <>
                        <StatCard label="Tarifa" value={`€${selectedProject.rate}/h`} />
                        <StatCard
                          label="Tarifa efectiva"
                          value={`€${stats.effectiveRate.toFixed(2)}/h`}
                        />
                      </>
                    )}
                    {mode === 'client' && (
                      <StatCard
                        label="Tarifa media"
                        value={`€${stats.effectiveRate.toFixed(2)}/h`}
                      />
                    )}
                    <StatCard
                      label="Primera sesión"
                      value={
                        stats.firstSession
                          ? new Date(
                              stats.firstSession.start_time || stats.firstSession.created_at
                            ).toLocaleDateString('es-ES')
                          : '—'
                      }
                      small
                    />
                    <StatCard
                      label="Última sesión"
                      value={
                        stats.lastSession
                          ? new Date(
                              stats.lastSession.start_time || stats.lastSession.created_at
                            ).toLocaleDateString('es-ES')
                          : '—'
                      }
                      small
                    />
                  </div>

                  {analysisSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                      <p className="text-slate-500">
                        {mode === 'project'
                          ? 'Este proyecto aún no tiene sesiones. Empieza el cronómetro desde el Dashboard.'
                          : 'Este cliente aún no tiene sesiones registradas en sus proyectos.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <ChartCard
                          title="Horas por día"
                          subtitle="Últimos 30 días"
                          chartRef={dailyChartRef}
                        >
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                interval="preserveStartEnd"
                                tickMargin={6}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                width={32}
                                tickMargin={4}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  padding: '8px 12px',
                                }}
                                formatter={(v) => [`${v}h`, 'Horas']}
                                cursor={{ fill: '#f1f5f9' }}
                              />
                              <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                          title="Ingresos por semana"
                          subtitle="Últimas 12 semanas"
                          chartRef={weeklyChartRef}
                        >
                          <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                interval="preserveStartEnd"
                                tickMargin={6}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                width={42}
                                tickMargin={4}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  padding: '8px 12px',
                                }}
                                formatter={(v) => [formatEUR(v), 'Ingresos']}
                              />
                              <Line
                                type="monotone"
                                dataKey="earnings"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                          title="Distribución por hora del día"
                          subtitle="Cuándo sueles trabajar"
                          chartRef={hourlyChartRef}
                        >
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis
                                dataKey="hour"
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                interval={3}
                                tickMargin={6}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                width={32}
                                tickMargin={4}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  padding: '8px 12px',
                                }}
                                formatter={(v) => [`${v}h`, 'Horas']}
                                cursor={{ fill: '#f1f5f9' }}
                              />
                              <Bar
                                dataKey="hoursWorked"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={18}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartCard>

                        {mode === 'project' && selectedProject && (() => {
                          const projSessions = sessions.filter(s => s.project_id === selectedProject.id);
                          const isFixed = selectedProject.billing_type === 'fixed';
                          const gross = isFixed
                            ? Number(selectedProject.fixed_price || 0)
                            : projSessions.reduce((a, s) => a + Number(s.earned || 0), 0);
                          const projExp = expenses.filter(e => e.project_id === selectedProject.id);
                          const expTotal = projExp.reduce((a, e) => a + Number(e.amount || 0), 0);
                          const balance = gross - expTotal;

                          if (gross === 0 && expTotal === 0) return null;

                          const chartData = [
                            { name: 'Ingresos', value: Math.round(gross * 100) / 100, color: '#10b981' },
                            { name: 'Gastos', value: Math.round(expTotal * 100) / 100, color: '#ef4444' },
                            { name: 'Balance', value: Math.round(balance * 100) / 100, color: balance >= 0 ? '#2563eb' : '#dc2626' },
                          ];

                          return (
                            <ChartCard
                              title="Ingresos vs gastos"
                              subtitle="Rentabilidad de este proyecto"
                            >
                              <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                  <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                                    tickMargin={6}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    width={42}
                                    tickMargin={4}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#fff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 8,
                                      fontSize: 12,
                                      padding: '8px 12px',
                                    }}
                                    formatter={(v) => [formatEUR(v), '']}
                                    cursor={{ fill: '#f1f5f9' }}
                                  />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Ingresos</p>
                                  <p className="text-sm font-bold text-emerald-600 tabular-nums">{formatEUR(gross)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Gastos</p>
                                  <p className="text-sm font-bold text-red-600 tabular-nums">-{formatEUR(expTotal)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Balance</p>
                                  <p className={`text-sm font-bold tabular-nums ${balance >= 0 ? 'text-blue-600' : 'text-red-700'}`}>
                                    {formatEUR(balance)}
                                  </p>
                                </div>
                              </div>
                            </ChartCard>
                          );
                        })()}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                          <h2 className="text-xl font-bold text-slate-900">
                            Detalle de sesiones
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">
                            {analysisSessions.length} sesiones registradas
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                              <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                <th className="px-6 py-3">Fecha</th>
                                {mode === 'client' && <th className="px-6 py-3">Proyecto</th>}
                                <th className="px-6 py-3">Inicio</th>
                                <th className="px-6 py-3">Fin</th>
                                <th className="px-6 py-3 text-right">Duración</th>
                                <th className="px-6 py-3 text-right">Ganado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[...analysisSessions]
                                .sort((a, b) => sessionDate(b) - sessionDate(a))
                                .map((s) => {
                                  const start = s.start_time
                                    ? new Date(s.start_time)
                                    : new Date(s.created_at);
                                  const end = s.end_time ? new Date(s.end_time) : null;
                                  const hours = sessionHours(s);
                                  const proj = projects.find((p) => p.id === s.project_id);
                                  return (
                                    <tr key={s.id} className="hover:bg-slate-50/50">
                                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                                        {start.toLocaleDateString('es-ES')}
                                      </td>
                                      {mode === 'client' && (
                                        <td className="px-6 py-3 text-sm text-slate-700 font-medium">
                                          {proj?.name || '—'}
                                        </td>
                                      )}
                                      <td className="px-6 py-3 text-sm text-slate-600 tabular-nums">
                                        {start.toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-slate-600 tabular-nums">
                                        {end
                                          ? end.toLocaleTimeString('es-ES', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : '—'}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-slate-700 text-right tabular-nums font-semibold">
                                        {Math.floor(hours)}h {Math.round((hours % 1) * 60)}min
                                      </td>
                                      <td className="px-6 py-3 text-sm text-emerald-600 text-right tabular-nums font-bold">
                                        {formatEUR(sessionEarnings(s))}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>

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

        {/* Create project modal */}
        {createModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCreateModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">Nuevo proyecto</h3>
                  <p className="text-sm text-slate-500">Crea un proyecto y empieza a registrar tiempo</p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Billing type tabs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Tipo de facturación
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewProjectBillingType('hourly')}
                      className={`flex-1 px-3 py-3 text-sm font-semibold rounded-lg transition ${
                        newProjectBillingType === 'hourly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Por horas
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProjectBillingType('fixed')}
                      className={`flex-1 px-3 py-3 text-sm font-semibold rounded-lg transition ${
                        newProjectBillingType === 'fixed'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Precio cerrado
                    </button>
                  </div>
                </div>

                {/* Project name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Nombre del proyecto
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ej: Rediseño Web · Cliente A"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition"
                  />
                </div>

                {/* Rate or Fixed price */}
                {newProjectBillingType === 'hourly' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Tarifa por hora (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProjectRate}
                      onChange={(e) => setNewProjectRate(e.target.value)}
                      placeholder="50"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition tabular-nums"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Precio total (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newProjectFixedPrice}
                        onChange={(e) => setNewProjectFixedPrice(e.target.value)}
                        placeholder="1500"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Horas estimadas (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newProjectEstimatedHours}
                        onChange={(e) => setNewProjectEstimatedHours(e.target.value)}
                        placeholder="30"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition tabular-nums"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Si las conoces, Valopo calculará tu €/hora real
                      </p>
                    </div>
                  </>
                )}

                {/* Client */}
                {clients.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Cliente (opcional)
                    </label>
                    <select
                      value={newProjectClientId}
                      onChange={(e) => setNewProjectClientId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition"
                    >
                      <option value="">— Sin cliente asignado —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addProject}
                  disabled={savingProject}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {savingProject ? 'Creando…' : 'Crear proyecto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUpgradeModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mb-4">
                  <FileText className="w-7 h-7 text-white" strokeWidth={2.25} />
                </div>
                <h3 className="font-bold text-2xl text-slate-900 mb-2">
                  Exportar PDF es Pro
                </h3>
                <p className="text-sm text-slate-600">
                  Genera informes profesionales con gráficos y tabla detallada de sesiones, listos para enviar a tus clientes.
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                  PDF profesional con gráficos
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                  Proyectos ilimitados
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                  Histórico completo
                </li>
              </ul>

              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-slate-900">14,99 €<span className="text-base font-normal text-slate-500">/mes</span></p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Ahora no
                </button>
                <button
                  onClick={async () => {
                    setShowUpgradeModal(false);
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${sessionData.session.access_token}`,
                        },
                      });
                      const json = await res.json();
                      if (json.url) window.location.href = json.url;
                    } catch (e) {
                      showToast('error', 'Error abriendo checkout');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, accent, small }) {
  const valueColor =
    accent === 'emerald' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p
        className={`${
          small ? 'text-base' : 'text-2xl'
        } font-bold mt-2 tabular-nums ${valueColor}`}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, subtitle, chartRef, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div ref={chartRef} className="bg-white flex-1">
        {children}
      </div>
    </div>
  );
}
