import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentProject, setCurrentProject] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      fetchProjects(data.session.user.id);
      fetchSessions(data.session.user.id);
    };
    checkAuth();
  }, [router]);

  // Timer interval
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchProjects = async (userId) => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const fetchSessions = async (userId) => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    setSessions(data || []);
  };

  const addProject = async () => {
    if (!newProjectName || !newProjectRate) return;
    
    const { error } = await supabase.from('projects').insert([
      {
        user_id: user.id,
        name: newProjectName,
        hourly_rate: parseFloat(newProjectRate),
      },
    ]);
    
    if (!error) {
      setNewProjectName('');
      setNewProjectRate('');
      fetchProjects(user.id);
    }
  };

  const startTimer = () => {
    if (!currentProject) {
      alert('Elige un proyecto primero');
      return;
    }
    setIsTimerRunning(true);
  };

  const stopTimer = async () => {
    setIsTimerRunning(false);
    
    const project = projects.find((p) => p.id === currentProject);
    if (!project) return;

    const { error } = await supabase.from('sessions').insert([
      {
        user_id: user.id,
        project_id: currentProject,
        duration_seconds: timerSeconds,
        earned: (timerSeconds / 3600) * project.hourly_rate,
      },
    ]);

    if (!error) {
      setTimerSeconds(0);
      fetchSessions(user.id);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Calculate stats
  const thisWeekSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const totalEarned = thisWeekSessions.reduce((sum, s) => sum + (s.earned || 0), 0);
  const totalHours = thisWeekSessions.reduce((sum, s) => sum + s.duration_seconds / 3600, 0);

  if (!user) return <div className="min-h-screen bg-white flex items-center justify-center">Cargando...</div>;

  return (
    <>
      <Head>
        <title>Dashboard - Timely</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⏱</span>
              </div>
              <span className="font-bold text-xl">Timely</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Timer Section */}
          <div className="bg-white rounded-lg p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Timer</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Timer Display */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-12 text-center mb-6">
                  <div className="text-6xl font-bold text-blue-600 font-mono">
                    {formatTime(timerSeconds)}
                  </div>
                </div>

                <div className="flex gap-4">
                  {!isTimerRunning ? (
                    <button
                      onClick={startTimer}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
                    >
                      ▶ Empezar
                    </button>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
                    >
                      ⏹ Parar
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto
                </label>
                <select
                  value={currentProject}
                  onChange={(e) => setCurrentProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Elige proyecto...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (€{p.hourly_rate}/h)
                    </option>
                  ))}
                </select>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    En esta sesión ganarás aproximadamente:
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    €
                    {currentProject && projects.find((p) => p.id === currentProject)
                      ? (
                          (timerSeconds / 3600) *
                          projects.find((p) => p.id === currentProject).hourly_rate
                        ).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Esta semana: Horas</p>
              <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Esta semana: Ganado</p>
              <p className="text-3xl font-bold text-green-600">€{totalEarned.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Tarifa promedio</p>
              <p className="text-3xl font-bold text-blue-600">
                €{totalHours > 0 ? (totalEarned / totalHours).toFixed(0) : '0'}/h
              </p>
            </div>
          </div>

          {/* Manage Projects */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Gestiona tus proyectos</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <input
                type="text"
                placeholder="Nombre del proyecto"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Tarifa €/hora"
                  value={newProjectRate}
                  onChange={(e) => setNewProjectRate(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <button
                  onClick={addProject}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-600">€{p.hourly_rate}/hora</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {thisWeekSessions
                      .filter((s) => s.project_id === p.id)
                      .reduce((sum, s) => sum + s.duration_seconds / 3600, 0)
                      .toFixed(1)}
                    h esta semana
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA for Premium */}
          <div className="mt-8 bg-blue-600 text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Versión Premium disponible</h3>
            <p className="mb-4">Múltiples proyectos, histórico completo, exportar datos</p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">
              Ver planes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
