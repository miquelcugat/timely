import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timer');
  const [activeProject, setActiveProject] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      loadData(data.session.user.id);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const loadData = async (userId) => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);
      setSessions(sessionsData || []);
      if (projectsData?.length > 0) {
        setActiveProject(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startSession = async () => {
    if (!activeProject) {
      alert('Selecciona un proyecto primero');
      return;
    }
    setIsRunning(true);
  };

  const stopSession = async () => {
    if (!isRunning) return;
    setIsRunning(false);

    try {
      await supabase.from('sessions').insert([
        {
          user_id: user.id,
          project_id: activeProject,
          start_time: Math.floor(Date.now() / 1000) - timerSeconds,
          end_time: Math.floor(Date.now() / 1000),
        }
      ]);
      setTimerSeconds(0);
      loadData(user.id);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const addProject = async () => {
    if (!newProjectName || !newProjectRate) return;

    try {
      const { data } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: newProjectName,
            rate: parseFloat(newProjectRate),
          }
        ])
        .select();

      if (data?.[0]) {
        setActiveProject(data[0].id);
      }
      setNewProjectName('');
      setNewProjectRate('');
      setShowNewProject(false);
      loadData(user.id);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('¿Eliminar este proyecto? Se borrará todo el historial.')) return;

    try {
      await supabase.from('sessions').delete().eq('project_id', projectId);
      await supabase.from('projects').delete().eq('id', projectId);
      if (activeProject === projectId) {
        setActiveProject(projects.find(p => p.id !== projectId)?.id || null);
      }
      loadData(user.id);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const archiveProject = async (projectId) => {
    try {
      await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', projectId);
      if (activeProject === projectId) {
        const newActive = projects.find(p => p.id !== projectId && !p.archived);
        setActiveProject(newActive?.id || null);
      }
      loadData(user.id);
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const exportToCSV = () => {
    if (sessions.length === 0) return;

    const headers = ['Proyecto', 'Inicio', 'Duración (horas)', 'Tarifa €/h', 'Ingresos €'];
    const rows = sessions.map(session => {
      const project = projects.find(p => p.id === session.project_id);
      const duration = (session.end_time - session.start_time) / 3600;
      const earnings = duration * (project?.rate || 0);
      return [
        project?.name || 'N/A',
        new Date(session.created_at).toLocaleString('es-ES'),
        duration.toFixed(2),
        project?.rate || 0,
        earnings.toFixed(2)
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timely-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Estadísticas semana
  const weekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const weekHours = weekSessions.reduce((sum, s) => sum + (s.end_time - s.start_time) / 3600, 0);
  const weekEarnings = weekSessions.reduce((sum, s) => {
    const project = projects.find(p => p.id === s.project_id);
    const duration = (s.end_time - s.start_time) / 3600;
    return sum + duration * (project?.rate || 0);
  }, 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <>
      <Head>
        <title>Dashboard - Timely</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⏱</span>
              </div>
              <span className="font-bold text-xl">Timely</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  router.push('/');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          {/* Timer Section */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-12 rounded-2xl shadow-sm border border-blue-200 mb-10">
            <div className="text-center">
              {/* Timer Grande */}
              <div className="text-7xl font-bold text-blue-600 font-mono mb-6 tracking-wider">
                {formatTime(timerSeconds)}
              </div>

              {/* Selector de Proyecto */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Proyecto activo</label>
                <select
                  value={activeProject || ''}
                  onChange={(e) => setActiveProject(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-center font-semibold"
                >
                  <option value="">Selecciona un proyecto</option>
                  {projects.filter(p => !p.archived).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (€{p.rate}/h)</option>
                  ))}
                </select>
              </div>

              {/* Botones Timer */}
              <div className="flex gap-4 justify-center mb-8">
                {!isRunning ? (
                  <button
                    onClick={startSession}
                    className="px-10 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform hover:scale-105"
                  >
                    ▶ Empezar
                  </button>
                ) : (
                  <button
                    onClick={stopSession}
                    className="px-10 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition transform hover:scale-105"
                  >
                    ⏹ Parar
                  </button>
                )}
              </div>

              {/* Stats Esta Semana */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1">Esta semana: Horas</p>
                  <p className="text-3xl font-bold text-gray-900">{weekHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1">Esta semana: Ganado</p>
                  <p className="text-3xl font-bold text-green-600">€{weekEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1">Tarifa promedio</p>
                  <p className="text-3xl font-bold text-blue-600">
                    €{weekHours > 0 ? (weekEarnings / weekHours).toFixed(0) : 0}/h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('timer')}
              className={`py-3 px-6 font-semibold border-b-2 transition ${
                activeTab === 'timer'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⏱ Timer
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-3 px-6 font-semibold border-b-2 transition ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Proyectos
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-3 px-6 font-semibold border-b-2 transition ${
                activeTab === 'sessions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⏰ Sesiones
            </button>
          </div>

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {showNewProject && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-blue-200">
                  <h3 className="font-bold text-lg mb-6">Nuevo proyecto</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre del proyecto"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="number"
                      placeholder="Tarifa €/hora"
                      value={newProjectRate}
                      onChange={(e) => setNewProjectRate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={addProject}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => setShowNewProject(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showNewProject && (
                <button
                  onClick={() => setShowNewProject(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  + Nuevo proyecto
                </button>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {projects.filter(p => !p.archived).map(project => {
                  const projectSessions = sessions.filter(s => s.project_id === project.id);
                  const hours = projectSessions.reduce((sum, s) => sum + (s.end_time - s.start_time) / 3600, 0);
                  const earnings = hours * project.rate;

                  return (
                    <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                          <p className="text-gray-600">€{project.rate}/h</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => archiveProject(project.id)}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                          >
                            Pausar
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-600"><strong>Horas:</strong> {hours.toFixed(2)}h</p>
                        <p className="text-gray-600"><strong>Ingresos:</strong> <span className="text-green-600 font-semibold">€{earnings.toFixed(2)}</span></p>
                        <p className="text-gray-600"><strong>Sesiones:</strong> {projectSessions.length}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <button
                onClick={exportToCSV}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                📥 Exportar CSV
              </button>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Proyecto</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Inicio</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duración</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tarifa</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => {
                        const project = projects.find(p => p.id === session.project_id);
                        const duration = (session.end_time - session.start_time) / 3600;
                        const earnings = duration * (project?.rate || 0);
                        return (
                          <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{project?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(session.created_at).toLocaleString('es-ES')}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{duration.toFixed(2)}h</td>
                            <td className="px-6 py-4 text-sm text-gray-600">€{project?.rate || 0}/h</td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">€{earnings.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
