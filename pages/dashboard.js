import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();

  // ---------- State ----------
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState('');

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedAtRef = useRef(null); // epoch seconds when current run started

  // Forms
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // Edit project
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'project'|'session', id, label }

  // Toast
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  // ---------- Helpers ----------
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const formatEUR = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

  const formatDate = (iso) =>
    new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  // ---------- Auth & data load ----------
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      if (!mounted) return;
      setUser(data.session.user);
      await loadData(data.session.user.id);

      // Restore in-progress timer if any
      try {
        const saved = JSON.parse(localStorage.getItem('timely_timer') || 'null');
        if (saved?.startedAt && saved?.projectId) {
          startedAtRef.current = saved.startedAt;
          setActiveProject(saved.projectId);
          setTimerSeconds(Math.floor(Date.now() / 1000) - saved.startedAt);
          setIsRunning(true);
        }
      } catch {}
    };
    checkAuth();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (userId) => {
    try {
      const [{ data: projectsData, error: pErr }, { data: sessionsData, error: sErr }] =
        await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        ]);

      if (pErr) throw pErr;
      if (sErr) throw sErr;

      setProjects(projectsData || []);
      setSessions(sessionsData || []);

      // Keep the active project if still valid; otherwise pick the first one
      setActiveProject((prev) => {
        if (prev && (projectsData || []).some((p) => p.id === prev)) return prev;
        return projectsData?.[0]?.id || '';
      });
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error cargando los datos');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Timer tick ----------
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setTimerSeconds(Math.floor(Date.now() / 1000) - startedAtRef.current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Warn before closing if timer is running
  useEffect(() => {
    const handler = (e) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isRunning]);

  // ---------- Timer actions ----------
  const startSession = () => {
    if (!activeProject) {
      showToast('error', 'Selecciona un proyecto primero');
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    startedAtRef.current = now;
    setTimerSeconds(0);
    setIsRunning(true);
    localStorage.setItem(
      'timely_timer',
      JSON.stringify({ startedAt: now, projectId: activeProject })
    );
  };

  const stopSession = async () => {
    if (!isRunning) return;
    const startedAt = startedAtRef.current;
    const endedAt = Math.floor(Date.now() / 1000);
    const duration = endedAt - startedAt;

    setIsRunning(false);
    startedAtRef.current = null;
    localStorage.removeItem('timely_timer');

    if (duration < 1) {
      setTimerSeconds(0);
      showToast('error', 'Sesión demasiado corta para guardar');
      return;
    }

    try {
      const { error } = await supabase.from('sessions').insert([
        {
          user_id: user.id,
          project_id: activeProject,
          start_time: startedAt,
          end_time: endedAt,
        },
      ]);
      if (error) throw error;
      setTimerSeconds(0);
      await loadData(user.id);
      showToast('success', `Sesión guardada: ${formatTime(duration)}`);
    } catch (error) {
      console.error('Error saving session:', error);
      showToast('error', 'No se pudo guardar la sesión');
    }
  };

  const cancelSession = () => {
    setIsRunning(false);
    startedAtRef.current = null;
    setTimerSeconds(0);
    localStorage.removeItem('timely_timer');
  };

  // ---------- Project actions ----------
  const addProject = async () => {
    const name = newProjectName.trim();
    const rate = parseFloat(newProjectRate);

    if (!name) {
      showToast('error', 'Introduce un nombre de proyecto');
      return;
    }
    if (Number.isNaN(rate) || rate <= 0) {
      showToast('error', 'Introduce una tarifa válida');
      return;
    }

    setSavingProject(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ user_id: user.id, name, rate }])
        .select();

      if (error) throw error;

      const created = data?.[0];
      if (created) {
        // Update local state immediately so it appears in the selector
        setProjects((prev) => [created, ...prev]);
        setActiveProject(created.id);
      }
      setNewProjectName('');
      setNewProjectRate('');
      showToast('success', 'Proyecto creado');
      // Re-sync from DB in the background
      loadData(user.id);
    } catch (error) {
      console.error('Error adding project:', error);
      showToast('error', 'No se pudo crear el proyecto');
    } finally {
      setSavingProject(false);
    }
  };

  const startEdit = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditRate(String(project.rate));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRate('');
  };

  const saveEdit = async () => {
    const name = editName.trim();
    const rate = parseFloat(editRate);
    if (!name || Number.isNaN(rate) || rate <= 0) {
      showToast('error', 'Datos inválidos');
      return;
    }
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name, rate })
        .eq('id', editingId);
      if (error) throw error;
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, name, rate } : p))
      );
      cancelEdit();
      showToast('success', 'Proyecto actualizado');
    } catch (error) {
      console.error('Error updating project:', error);
      showToast('error', 'No se pudo actualizar');
    }
  };

  const deleteProject = async (id) => {
    try {
      // Delete sessions of this project first (in case no FK cascade)
      await supabase.from('sessions').delete().eq('project_id', id);
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSessions((prev) => prev.filter((s) => s.project_id !== id));
      if (activeProject === id) {
        setActiveProject('');
        if (isRunning) cancelSession();
      }
      showToast('success', 'Proyecto borrado');
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('error', 'No se pudo borrar');
    } finally {
      setConfirmDelete(null);
    }
  };

  const deleteSession = async (id) => {
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('success', 'Sesión borrada');
    } catch (error) {
      console.error('Error deleting session:', error);
      showToast('error', 'No se pudo borrar');
    } finally {
      setConfirmDelete(null);
    }
  };

  // ---------- Stats ----------
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7)); // Monday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sessionDuration = (s) => Math.max(0, (s.end_time - s.start_time) / 3600);
  const sessionEarnings = (s) => {
    const project = projects.find((p) => p.id === s.project_id);
    return sessionDuration(s) * (project?.rate || 0);
  };

  const inRange = (s, from) => new Date(s.created_at) >= from;

  const todayHours = sessions.filter((s) => inRange(s, startOfToday)).reduce((a, s) => a + sessionDuration(s), 0);
  const todayEarnings = sessions.filter((s) => inRange(s, startOfToday)).reduce((a, s) => a + sessionEarnings(s), 0);

  const weekHours = sessions.filter((s) => inRange(s, startOfWeek)).reduce((a, s) => a + sessionDuration(s), 0);
  const weekEarnings = sessions.filter((s) => inRange(s, startOfWeek)).reduce((a, s) => a + sessionEarnings(s), 0);

  const monthHours = sessions.filter((s) => inRange(s, startOfMonth)).reduce((a, s) => a + sessionDuration(s), 0);
  const monthEarnings = sessions.filter((s) => inRange(s, startOfMonth)).reduce((a, s) => a + sessionEarnings(s), 0);

  const totalEarnings = sessions.reduce((a, s) => a + sessionEarnings(s), 0);

  const currentProject = projects.find((p) => p.id === activeProject);
  const currentEarnings = (timerSeconds / 3600) * (currentProject?.rate || 0);

  const recentSessions = sessions.slice(0, 8);

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando tu dashboard…</span>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <>
      <Head>
        <title>Dashboard · Timely</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">⏱</span>
              </div>
              <div>
                <span className="font-bold text-xl text-slate-900">Timely</span>
                {isRunning && (
                  <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    EN CURSO
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:inline">{user?.email}</span>
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
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
          {/* Top stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Hoy', hours: todayHours, earnings: todayEarnings },
              { label: 'Esta semana', hours: weekHours, earnings: weekEarnings },
              { label: 'Este mes', hours: monthHours, earnings: monthEarnings },
              { label: 'Total', hours: sessions.reduce((a, s) => a + sessionDuration(s), 0), earnings: totalEarnings },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{formatEUR(stat.earnings)}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.hours.toFixed(1)}h trabajadas</p>
              </div>
            ))}
          </div>

          {/* Timer + sidebar */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Timer */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    {isRunning ? 'Cronómetro activo' : 'Cronómetro'}
                  </p>
                  <div className="text-6xl sm:text-7xl font-bold text-slate-900 font-mono mb-2 tabular-nums tracking-tight">
                    {formatTime(timerSeconds)}
                  </div>
                  <p className="text-2xl font-semibold text-emerald-600 mb-8 tabular-nums">
                    {formatEUR(currentEarnings)}
                  </p>

                  <div className="max-w-md mx-auto">
                    <label className="block text-left text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Proyecto
                    </label>
                    <select
                      value={activeProject || ''}
                      onChange={(e) => setActiveProject(e.target.value)}
                      disabled={isRunning}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white mb-6 font-semibold text-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">— Selecciona un proyecto —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · €{p.rate}/h
                        </option>
                      ))}
                    </select>

                    {!isRunning ? (
                      <button
                        onClick={startSession}
                        disabled={!activeProject}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 active:scale-[0.99] transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
                      >
                        ▶ Empezar a contar
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={stopSession}
                          className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 active:scale-[0.99] transition shadow-sm"
                        >
                          ⏹ Parar y guardar
                        </button>
                        <button
                          onClick={cancelSession}
                          className="px-5 py-4 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                          title="Cancelar sin guardar"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {!activeProject && projects.length === 0 && (
                      <p className="text-sm text-slate-500 mt-4">
                        Crea tu primer proyecto abajo para empezar.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: project breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Resumen por proyecto</h3>
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500">Sin proyectos aún.</p>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 6).map((project) => {
                    const projectSessions = sessions.filter((s) => s.project_id === project.id);
                    const hours = projectSessions.reduce((a, s) => a + sessionDuration(s), 0);
                    const earnings = hours * project.rate;
                    const maxEarnings = Math.max(
                      ...projects.map((p) => {
                        const ps = sessions.filter((s) => s.project_id === p.id);
                        return ps.reduce((a, s) => a + sessionDuration(s), 0) * p.rate;
                      }),
                      1
                    );
                    const pct = (earnings / maxEarnings) * 100;
                    return (
                      <div key={project.id}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-semibold text-slate-900 truncate pr-2">
                            {project.name}
                          </span>
                          <span className="text-sm font-bold text-slate-700 tabular-nums">
                            {formatEUR(earnings)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 tabular-nums">
                          {hours.toFixed(1)}h · €{project.rate}/h
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Projects management */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
            <div className="p-6 sm:p-8 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Tus proyectos</h2>
              <p className="text-sm text-slate-500">Crea, edita y borra los proyectos que facturas.</p>
            </div>

            {/* Add form */}
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3">
                <input
                  type="text"
                  placeholder="Nombre del proyecto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addProject()}
                  className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Tarifa €/hora"
                  value={newProjectRate}
                  onChange={(e) => setNewProjectRate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addProject()}
                  className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition tabular-nums"
                />
                <button
                  onClick={addProject}
                  disabled={savingProject}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-60 whitespace-nowrap"
                >
                  {savingProject ? 'Creando…' : '+ Añadir'}
                </button>
              </div>
            </div>

            {/* Project list */}
            <div className="divide-y divide-slate-100">
              {projects.length === 0 && (
                <div className="p-10 text-center text-slate-500 text-sm">
                  Aún no tienes proyectos. Crea el primero arriba.
                </div>
              )}
              {projects.map((project) => {
                const projectSessions = sessions.filter((s) => s.project_id === project.id);
                const hours = projectSessions.reduce((a, s) => a + sessionDuration(s), 0);
                const earnings = hours * project.rate;
                const isEditing = editingId === project.id;

                return (
                  <div key={project.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition">
                    {isEditing ? (
                      <div className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 tabular-nums"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{project.name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5 tabular-nums">
                            €{project.rate}/h · {hours.toFixed(1)}h ·{' '}
                            <span className="text-emerald-600 font-semibold">{formatEUR(earnings)}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(project)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                type: 'project',
                                id: project.id,
                                label: project.name,
                              })
                            }
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Sesiones recientes</h2>
                <p className="text-sm text-slate-500">Tus últimas {recentSessions.length} sesiones.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {recentSessions.map((s) => {
                  const project = projects.find((p) => p.id === s.project_id);
                  const duration = sessionDuration(s);
                  const earnings = sessionEarnings(s);
                  return (
                    <div
                      key={s.id}
                      className="p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3 hover:bg-slate-50/50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {project?.name || 'Proyecto borrado'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(s.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-4 tabular-nums">
                        <span className="text-sm font-semibold text-slate-700">{formatTime(duration * 3600)}</span>
                        <span className="text-sm font-bold text-emerald-600">{formatEUR(earnings)}</span>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: 'session',
                              id: s.id,
                              label: 'esta sesión',
                            })
                          }
                          className="text-slate-400 hover:text-red-600 transition text-sm"
                          title="Borrar sesión"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 text-center shadow-sm">
            <h3 className="text-2xl font-bold mb-2">Upgrade a Pro</h3>
            <p className="mb-5 text-blue-100">€14.99/mes · Proyectos ilimitados, histórico completo, exportar a CSV</p>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 active:scale-[0.99] transition"
            >
              Ver planes
            </button>
          </div>
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Confirm modal */}
        {confirmDelete && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">¿Seguro que quieres borrar?</h3>
              <p className="text-sm text-slate-600 mb-5">
                Vas a borrar <span className="font-semibold">{confirmDelete.label}</span>.
                {confirmDelete.type === 'project' && ' Esto borrará también todas sus sesiones.'} Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.type === 'project') deleteProject(confirmDelete.id);
                    else deleteSession(confirmDelete.id);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
