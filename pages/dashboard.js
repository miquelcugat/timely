import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('week');
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (!newProjectName || !newProjectRate) return;

    try {
      const { error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: newProjectName,
            rate: parseFloat(newProjectRate),
          }
        ]);

      if (!error) {
        setNewProjectName('');
        setNewProjectRate('');
        setShowNewProject(false);
        loadData(user.id);
      }
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('¿Eliminar este proyecto? Se borrará todo el historial.')) return;

    try {
      await supabase.from('sessions').delete().eq('project_id', projectId);
      await supabase.from('projects').delete().eq('id', projectId);
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
      loadData(user.id);
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const exportToCSV = () => {
    if (sessions.length === 0) return;

    const headers = ['Proyecto', 'Inicio', 'Fin', 'Duración (horas)', 'Tarifa €/h', 'Ingresos €'];
    const rows = sessions.map(session => {
      const project = projects.find(p => p.id === session.project_id);
      const duration = (session.end_time - session.start_time) / 3600;
      const earnings = duration * (project?.rate || 0);
      return [
        project?.name || 'N/A',
        new Date(session.created_at).toLocaleString('es-ES'),
        session.end_time ? new Date(session.end_time * 1000).toLocaleString('es-ES') : 'En curso',
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

  // Calcular estadísticas
  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, s) => sum + (s.end_time - s.start_time) / 3600, 0);
  const totalEarnings = sessions.reduce((sum, s) => {
    const project = projects.find(p => p.id === s.project_id);
    const duration = (s.end_time - s.start_time) / 3600;
    return sum + duration * (project?.rate || 0);
  }, 0);
  const avgRate = projects.length > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;

  // Datos para gráficos
  const projectStats = projects.filter(p => !p.archived).map(project => {
    const projectSessions = sessions.filter(s => s.project_id === project.id);
    const hours = projectSessions.reduce((sum, s) => sum + (s.end_time - s.start_time) / 3600, 0);
    const earnings = hours * project.rate;
    return {
      name: project.name,
      hours: parseFloat(hours.toFixed(2)),
      earnings: parseFloat(earnings.toFixed(2))
    };
  });

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <>
      <Head>
        <title>Dashboard - Timely</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
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

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-6 flex gap-8 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 border-b-2 transition ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Proyectos
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 border-b-2 transition ${
                activeTab === 'sessions'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⏰ Sesiones
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">⏱ Horas totales</p>
                  <p className="text-4xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">💰 Ingresos totales</p>
                  <p className="text-4xl font-bold text-green-600">€{totalEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">📊 Tarifa promedio</p>
                  <p className="text-4xl font-bold text-blue-600">€{avgRate}/h</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">🎯 Sesiones</p>
                  <p className="text-4xl font-bold text-purple-600">{totalSessions}</p>
                </div>
              </div>

              {/* Charts */}
              {projectStats.length > 0 && (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Ingresos por proyecto */}
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">Ingresos por proyecto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectStats}
                          dataKey="earnings"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {projectStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Horas por proyecto */}
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">Horas por proyecto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toFixed(2)}h`} />
                        <Bar dataKey="hours" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4">
                <button
                  onClick={exportToCSV}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📥 Exportar CSV
                </button>
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-8">
              {/* Nuevo proyecto */}
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

              {/* Listado de proyectos */}
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
                        <p className="text-gray-600">
                          <strong>Horas:</strong> {hours.toFixed(2)}h
                        </p>
                        <p className="text-gray-600">
                          <strong>Ingresos:</strong> <span className="text-green-600 font-semibold">€{earnings.toFixed(2)}</span>
                        </p>
                        <p className="text-gray-600">
                          <strong>Sesiones:</strong> {projectSessions.length}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {projects.filter(p => p.archived).length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Proyectos archivados</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {projects.filter(p => p.archived).map(project => (
                      <div key={project.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 opacity-60">
                        <p className="font-semibold text-gray-600">{project.name}</p>
                        <p className="text-sm text-gray-500">Archivado</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
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
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(session.created_at).toLocaleString('es-ES')}
                          </td>
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
          )}
        </main>
      </div>
    </>
  );
}
