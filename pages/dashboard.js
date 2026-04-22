import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/usePlan';
import OnboardingTour from '../components/OnboardingTour';
import MobileNav from '../components/MobileNav';
import ValopoLogo from '../components/ValopoLogo';
import {
  Clock,
  Target,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Check,
  Play,
  Square,
  X,
  FileText,
  User,
  AlertTriangle,
  Sparkles,
  Plus,
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();

  // ---------- State ----------
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState('');

  // Plan
  const { plan, limits, isPro, loading: planLoading } = usePlan(user?.id);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedAtRef = useRef(null);

  // Forms
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');
  const [newProjectClientId, setNewProjectClientId] = useState('');
  const [newProjectBillingType, setNewProjectBillingType] = useState('hourly');
  const [newProjectFixedPrice, setNewProjectFixedPrice] = useState('');
  const [newProjectEstimatedHours, setNewProjectEstimatedHours] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // Edit project
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editBillingType, setEditBillingType] = useState('hourly');
  const [editFixedPrice, setEditFixedPrice] = useState('');
  const [editEstimatedHours, setEditEstimatedHours] = useState('');

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Manual entry modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualProjectId, setManualProjectId] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseProjectId, setExpenseProjectId] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseNotes, setExpenseNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [expensesListOpen, setExpensesListOpen] = useState(null); // projectId whose expenses are shown

  // Expanded project card
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // Stripe loading
  const [opening, setOpening] = useState(false);

  // Onboarding tour
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Profile (goals)
  const [profile, setProfile] = useState(null);

  // Notes modal: when stopping timer (pending) or editing existing session
  const [pendingSession, setPendingSession] = useState(null);
  const [editingNoteSession, setEditingNoteSession] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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

  // Detect ?upgraded=true after returning from Stripe
  useEffect(() => {
    if (router.query.upgraded === 'true') {
      showToast('success', '¡Bienvenido a Pro!');
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router.query.upgraded, router, showToast]);

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
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
        supabase
          .from('freelancer_profile')
          .select('onboarded_at, monthly_income_goal, hourly_rate_goal')
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

      // Detect if onboarding should be shown
      const hasNoProjects = (projectsData || []).length === 0;
      const neverOnboarded = !profileData?.onboarded_at;
      if (hasNoProjects && neverOnboarded && !onboardingChecked) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);

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

  // ---------- Stripe actions ----------
  const openCheckout = async () => {
    setOpening(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        showToast('error', 'Sesión expirada');
        return;
      }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        showToast('error', json.error || 'Error abriendo el checkout');
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Error abriendo el checkout');
    } finally {
      setOpening(false);
    }
  };

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        showToast('error', json.error || 'Error abriendo el portal');
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Error abriendo el portal');
    } finally {
      setOpening(false);
    }
  };

  const triggerUpgrade = (reason) => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  };

  const completeOnboarding = async () => {
    try {
      await supabase
        .from('freelancer_profile')
        .upsert(
          {
            user_id: user.id,
            onboarded_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    } catch (error) {
      console.error('Error saving onboarding:', error);
    } finally {
      setShowOnboarding(false);
    }
  };

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

  const stopSession = () => {
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

    setPendingSession({
      startedAt,
      endedAt,
      duration,
      projectId: activeProject,
    });
    setNoteText('');
  };

  const confirmSession = async (withNote = true) => {
    if (!pendingSession) return;
    setSavingNote(true);
    try {
      const project = projects.find((p) => p.id === pendingSession.projectId);
      // For fixed-price projects, earned is 0 per session (total = fixed_price at project level)
      const isFixed = project?.billing_type === 'fixed';
      const earned = isFixed ? 0 : (pendingSession.duration / 3600) * (project?.rate || 0);
      const noteToSave = withNote ? noteText.trim() || null : null;

      const { error } = await supabase.from('sessions').insert([
        {
          user_id: user.id,
          project_id: pendingSession.projectId,
          duration_seconds: pendingSession.duration,
          earned: Number(earned.toFixed(2)),
          start_time: new Date(pendingSession.startedAt * 1000).toISOString(),
          end_time: new Date(pendingSession.endedAt * 1000).toISOString(),
          notes: noteToSave,
        },
      ]);
      if (error) throw error;

      setTimerSeconds(0);
      setPendingSession(null);
      setNoteText('');
      await loadData(user.id);
      showToast(
        'success',
        `Sesión guardada: ${formatTime(pendingSession.duration)}`
      );
    } catch (error) {
      console.error('Error saving session:', error);
      showToast('error', 'No se pudo guardar la sesión');
    } finally {
      setSavingNote(false);
    }
  };

  const discardPendingSession = () => {
    setPendingSession(null);
    setNoteText('');
    setTimerSeconds(0);
    showToast('error', 'Sesión descartada');
  };

  const openManualModal = () => {
    setManualProjectId(activeProject || (projects[0]?.id ?? ''));
    setManualDate(new Date().toISOString().slice(0, 10));
    setManualHours('');
    setManualMinutes('');
    setManualNotes('');
    setManualModalOpen(true);
  };

  const saveManualSession = async () => {
    const hours = parseFloat(manualHours) || 0;
    const minutes = parseFloat(manualMinutes) || 0;

    if (!manualProjectId) {
      showToast('error', 'Selecciona un proyecto');
      return;
    }
    if (hours === 0 && minutes === 0) {
      showToast('error', 'Introduce una duración válida');
      return;
    }
    if (!manualDate) {
      showToast('error', 'Selecciona una fecha');
      return;
    }

    setSavingManual(true);
    try {
      const durationSeconds = Math.round(hours * 3600 + minutes * 60);
      const project = projects.find((p) => p.id === manualProjectId);
      const isFixed = project?.billing_type === 'fixed';
      const earned = isFixed ? 0 : (durationSeconds / 3600) * (project?.rate || 0);

      // Use the selected date with current time as end_time
      const endDate = new Date(manualDate + 'T' + new Date().toTimeString().slice(0, 8));
      const startDate = new Date(endDate.getTime() - durationSeconds * 1000);

      const { error } = await supabase.from('sessions').insert([
        {
          user_id: user.id,
          project_id: manualProjectId,
          duration_seconds: durationSeconds,
          earned: Number(earned.toFixed(2)),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          notes: manualNotes.trim() || null,
        },
      ]);
      if (error) throw error;

      await loadData(user.id);
      setManualModalOpen(false);
      showToast('success', `Sesión registrada: ${formatTime(durationSeconds)}`);
    } catch (error) {
      console.error('Error saving manual session:', error);
      showToast('error', 'No se pudo guardar la sesión');
    } finally {
      setSavingManual(false);
    }
  };

  const openExpenseModal = (projectId) => {
    setExpenseProjectId(projectId || '');
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseNotes('');
    setExpenseModalOpen(true);
  };

  const saveExpense = async () => {
    if (!expenseProjectId) {
      showToast('error', 'Selecciona un proyecto');
      return;
    }
    const desc = expenseDescription.trim();
    if (!desc) {
      showToast('error', 'Introduce una descripción');
      return;
    }
    const amount = parseFloat(expenseAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      showToast('error', 'Introduce un importe válido');
      return;
    }

    setSavingExpense(true);
    try {
      const { data, error } = await supabase
        .from('project_expenses')
        .insert([
          {
            user_id: user.id,
            project_id: expenseProjectId,
            description: desc,
            amount,
            expense_date: expenseDate,
            notes: expenseNotes.trim() || null,
          },
        ])
        .select();
      if (error) throw error;

      if (data?.[0]) {
        setExpenses((prev) => [data[0], ...prev]);
      }
      setExpenseModalOpen(false);
      showToast('success', `Gasto registrado: ${formatEUR(amount)}`);
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('error', 'No se pudo guardar el gasto');
    } finally {
      setSavingExpense(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      const { error } = await supabase
        .from('project_expenses')
        .delete()
        .eq('id', expenseId);
      if (error) throw error;

      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      showToast('success', 'Gasto eliminado');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('error', 'No se pudo eliminar el gasto');
    }
  };

  const openEditNote = (session) => {
    setEditingNoteSession(session);
    setNoteText(session.notes || '');
  };

  const saveEditedNote = async () => {
    if (!editingNoteSession) return;
    setSavingNote(true);
    try {
      const newNote = noteText.trim() || null;
      const { error } = await supabase
        .from('sessions')
        .update({ notes: newNote })
        .eq('id', editingNoteSession.id);
      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingNoteSession.id ? { ...s, notes: newNote } : s
        )
      );
      setEditingNoteSession(null);
      setNoteText('');
      showToast('success', 'Nota actualizada');
    } catch (error) {
      console.error('Error updating note:', error);
      showToast('error', 'No se pudo guardar la nota');
    } finally {
      setSavingNote(false);
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

    if (!isPro && projects.length >= limits.maxProjects) {
      triggerUpgrade(
        `Has alcanzado el límite de ${limits.maxProjects} proyectos del plan Free.`
      );
      return;
    }

    setSavingProject(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name,
            rate: rate || 0,
            client_id: newProjectClientId || null,
            billing_type: newProjectBillingType,
            fixed_price: fixedPrice,
            estimated_hours: estimatedHours,
          },
        ])
        .select();

      if (error) throw error;

      const created = data?.[0];
      if (created) {
        setProjects((prev) => [created, ...prev]);
        setActiveProject(created.id);
      }
      setNewProjectName('');
      setNewProjectRate('');
      setNewProjectClientId('');
      setNewProjectFixedPrice('');
      setNewProjectEstimatedHours('');
      setNewProjectBillingType('hourly');
      showToast('success', 'Proyecto creado');
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
    setEditRate(String(project.rate || ''));
    setEditClientId(project.client_id || '');
    setEditBillingType(project.billing_type || 'hourly');
    setEditFixedPrice(project.fixed_price ? String(project.fixed_price) : '');
    setEditEstimatedHours(project.estimated_hours ? String(project.estimated_hours) : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRate('');
    setEditClientId('');
    setEditBillingType('hourly');
    setEditFixedPrice('');
    setEditEstimatedHours('');
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!name) {
      showToast('error', 'Nombre vacío');
      return;
    }

    let updates = {
      name,
      client_id: editClientId || null,
      billing_type: editBillingType,
    };

    if (editBillingType === 'hourly') {
      const rate = parseFloat(editRate);
      if (Number.isNaN(rate) || rate <= 0) {
        showToast('error', 'Introduce una tarifa válida');
        return;
      }
      updates.rate = rate;
      updates.fixed_price = null;
      updates.estimated_hours = null;
    } else if (editBillingType === 'fixed') {
      const fixedPrice = parseFloat(editFixedPrice);
      if (Number.isNaN(fixedPrice) || fixedPrice <= 0) {
        showToast('error', 'Introduce un precio válido');
        return;
      }
      updates.fixed_price = fixedPrice;
      updates.rate = 0;
      if (editEstimatedHours) {
        const est = parseFloat(editEstimatedHours);
        updates.estimated_hours = (!Number.isNaN(est) && est > 0) ? est : null;
      } else {
        updates.estimated_hours = null;
      }
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', editingId);
      if (error) throw error;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, ...updates }
            : p
        )
      );
      cancelEdit();
      showToast('success', 'Proyecto actualizado');
    } catch (error) {
      console.error('Error updating project:', error);
      showToast('error', 'No se pudo actualizar');
    }
  };

  const toggleProjectComplete = async (project) => {
    const isCompleting = !project.completed_at;
    const newValue = isCompleting ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ completed_at: newValue })
        .eq('id', project.id);
      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, completed_at: newValue } : p
        )
      );

      showToast(
        'success',
        isCompleting
          ? `Proyecto completado · +${formatEUR(Number(project.fixed_price) || 0)} al mes`
          : 'Proyecto reabierto'
      );
    } catch (error) {
      console.error('Error toggling complete:', error);
      showToast('error', 'No se pudo actualizar el proyecto');
    }
  };

  const deleteProject = async (id) => {
    try {
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
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sessionDuration = (s) => Math.max(0, (s.duration_seconds || 0) / 3600);
  const sessionEarnings = (s) => Number(s.earned || 0);

  const inRange = (s, from) => new Date(s.start_time || s.created_at) >= from;

  // Fixed-price earnings: only count completed projects within the date range
  const fixedEarnings = (from) => projects
    .filter((p) => p.billing_type === 'fixed' && p.completed_at && new Date(p.completed_at) >= from)
    .reduce((a, p) => a + Number(p.fixed_price || 0), 0);

  const allFixedEarnings = () => projects
    .filter((p) => p.billing_type === 'fixed' && p.completed_at)
    .reduce((a, p) => a + Number(p.fixed_price || 0), 0);

  // Expenses within date range (by expense_date)
  const expensesInRange = (from) => expenses
    .filter((e) => new Date(e.expense_date) >= from)
    .reduce((a, e) => a + Number(e.amount || 0), 0);

  const allExpenses = () => expenses.reduce((a, e) => a + Number(e.amount || 0), 0);

  const todayHours = sessions.filter((s) => inRange(s, startOfToday)).reduce((a, s) => a + sessionDuration(s), 0);
  const todayGross =
    sessions.filter((s) => inRange(s, startOfToday)).reduce((a, s) => a + sessionEarnings(s), 0) +
    fixedEarnings(startOfToday);
  const todayEarnings = todayGross - expensesInRange(startOfToday);

  const weekHours = sessions.filter((s) => inRange(s, startOfWeek)).reduce((a, s) => a + sessionDuration(s), 0);
  const weekGross =
    sessions.filter((s) => inRange(s, startOfWeek)).reduce((a, s) => a + sessionEarnings(s), 0) +
    fixedEarnings(startOfWeek);
  const weekEarnings = weekGross - expensesInRange(startOfWeek);

  const monthHours = sessions.filter((s) => inRange(s, startOfMonth)).reduce((a, s) => a + sessionDuration(s), 0);
  const monthGross =
    sessions.filter((s) => inRange(s, startOfMonth)).reduce((a, s) => a + sessionEarnings(s), 0) +
    fixedEarnings(startOfMonth);
  const monthExpenses = expensesInRange(startOfMonth);
  const monthEarnings = monthGross - monthExpenses;

  const totalGross =
    sessions.reduce((a, s) => a + sessionEarnings(s), 0) +
    allFixedEarnings();
  const totalEarnings = totalGross - allExpenses();

  const currentProject = projects.find((p) => p.id === activeProject);
  const currentEarnings = (timerSeconds / 3600) * (currentProject?.rate || 0);

  const recentSessions = sessions.slice(0, 8);

  // ---------- Goals (Nivel 1.5) ----------
  const monthlyGoal = profile?.monthly_income_goal ? Number(profile.monthly_income_goal) : null;
  const hourlyGoal = profile?.hourly_rate_goal ? Number(profile.hourly_rate_goal) : null;
  const hasAnyGoal = monthlyGoal != null || hourlyGoal != null;

  // Monthly progress
  const monthProgress = monthlyGoal && monthlyGoal > 0
    ? Math.min(100, (monthEarnings / monthlyGoal) * 100)
    : 0;
  const monthRemaining = monthlyGoal ? Math.max(0, monthlyGoal - monthEarnings) : 0;

  // Days remaining in month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDayOfMonth = now.getDate();
  const daysRemaining = lastDayOfMonth - currentDayOfMonth;

  // Expected progress (based on day of the month)
  const expectedProgress = (currentDayOfMonth / lastDayOfMonth) * 100;
  const progressDelta = monthProgress - expectedProgress;

  // Color of the progress bar based on how user is doing vs expected pace
  let monthBarColor = 'from-blue-500 to-blue-600';
  let monthStatusLabel = '';
  let monthStatusColor = 'text-slate-500';
  let monthStatusDot = 'bg-slate-400';
  if (monthlyGoal) {
    if (monthProgress >= 100) {
      monthBarColor = 'from-emerald-500 to-emerald-600';
      monthStatusLabel = '¡Objetivo alcanzado!';
      monthStatusColor = 'text-emerald-700';
      monthStatusDot = 'bg-emerald-500';
    } else if (progressDelta >= 5) {
      monthBarColor = 'from-emerald-500 to-emerald-600';
      monthStatusLabel = `Por encima del ritmo (+${progressDelta.toFixed(0)}%)`;
      monthStatusColor = 'text-emerald-700';
      monthStatusDot = 'bg-emerald-500';
    } else if (progressDelta >= -5) {
      monthBarColor = 'from-blue-500 to-blue-600';
      monthStatusLabel = 'En el ritmo esperado';
      monthStatusColor = 'text-blue-700';
      monthStatusDot = 'bg-blue-500';
    } else if (progressDelta >= -15) {
      monthBarColor = 'from-amber-500 to-amber-600';
      monthStatusLabel = `Algo por debajo (${progressDelta.toFixed(0)}%)`;
      monthStatusColor = 'text-amber-700';
      monthStatusDot = 'bg-amber-500';
    } else {
      monthBarColor = 'from-red-500 to-red-600';
      monthStatusLabel = `Lejos del ritmo (${progressDelta.toFixed(0)}%)`;
      monthStatusColor = 'text-red-700';
      monthStatusDot = 'bg-red-500';
    }
  }

  // Real €/h this month
  const realHourlyRate = monthHours > 0 ? monthEarnings / monthHours : 0;
  let hourlyDelta = null;
  let hourlyColor = 'text-slate-900';
  let hourlyBg = 'bg-slate-50';
  let hourlyBorder = 'border-slate-200';
  let hourlyLabel = '';
  let hourlyDot = 'bg-slate-400';
  if (hourlyGoal && monthHours > 0) {
    hourlyDelta = ((realHourlyRate - hourlyGoal) / hourlyGoal) * 100;
    if (realHourlyRate >= hourlyGoal) {
      hourlyColor = 'text-emerald-700';
      hourlyBg = 'bg-emerald-50';
      hourlyBorder = 'border-emerald-200';
      hourlyLabel = `+${hourlyDelta.toFixed(0)}% sobre tu objetivo`;
      hourlyDot = 'bg-emerald-500';
    } else if (hourlyDelta >= -10) {
      hourlyColor = 'text-amber-700';
      hourlyBg = 'bg-amber-50';
      hourlyBorder = 'border-amber-200';
      hourlyLabel = `${hourlyDelta.toFixed(0)}% del objetivo`;
      hourlyDot = 'bg-amber-500';
    } else {
      hourlyColor = 'text-red-700';
      hourlyBg = 'bg-red-50';
      hourlyBorder = 'border-red-200';
      hourlyLabel = `${hourlyDelta.toFixed(0)}% del objetivo`;
      hourlyDot = 'bg-red-500';
    }
  }

  const atProjectLimit = !isPro && projects.length >= limits.maxProjects;
  const projectsRemaining = isPro ? Infinity : Math.max(0, limits.maxProjects - projects.length);

  // ---------- Loading ----------
  if (loading || planLoading) {
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
        <title>Dashboard · Valopo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ValopoLogo size={40} />
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isPro
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isPro ? 'PRO' : 'FREE'}
                </span>
                {isRunning && (
                  <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    EN CURSO
                  </span>
                )}
              </div>
            </div>
            {/* Desktop nav - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push('/projects')}
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Mis proyectos
              </button>
              <button
                onClick={() => router.push('/clients')}
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Mis clientes
              </button>
              <button
                onClick={() => router.push('/invoices')}
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Facturas
              </button>
              <button
                onClick={() => router.push('/account')}
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Mi cuenta
              </button>
              <span className="text-sm text-slate-600 hidden lg:inline">{user?.email}</span>
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
            {/* Mobile: sign out button only */}
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
          {/* ============= GOALS BLOCK (Nivel 1.5) ============= */}
          {hasAnyGoal ? (
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              {/* Monthly progress (2/3 width) */}
              {monthlyGoal && (
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-start gap-3">
                      <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={2.25} />
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Tu objetivo del mes
                        </p>
                        <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
                          {formatEUR(monthEarnings)}
                          <span className="text-base font-normal text-slate-400">
                            {' '}/ {formatEUR(monthlyGoal)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 tabular-nums">
                        {monthProgress.toFixed(0)}%
                      </p>
                      {monthStatusLabel && (
                        <p className={`text-xs font-semibold mt-0.5 inline-flex items-center gap-1.5 ${monthStatusColor}`}>
                          {monthProgress >= 100 ? (
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${monthStatusDot}`} />
                          )}
                          {monthStatusLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${monthBarColor} rounded-full transition-all duration-500`}
                      style={{ width: `${monthProgress}%` }}
                    />
                  </div>
                  {/* Footer info */}
                  <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                    <span>
                      Te faltan{' '}
                      <strong className="text-slate-700 tabular-nums">
                        {formatEUR(monthRemaining)}
                      </strong>
                    </span>
                    <span>
                      Quedan <strong className="text-slate-700">{daysRemaining}</strong>{' '}
                      días en {now.toLocaleDateString('es-ES', { month: 'long' })}
                    </span>
                  </div>
                  {monthExpenses > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        Facturado bruto:{' '}
                        <strong className="text-slate-700 tabular-nums">{formatEUR(monthGross)}</strong>
                      </span>
                      <span className="text-red-600">
                        Gastos: <strong className="tabular-nums">-{formatEUR(monthExpenses)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Real €/h card (1/3 width) */}
              {hourlyGoal && (
                <div
                  className={`${hourlyBg} ${hourlyBorder} border rounded-2xl p-6 shadow-sm`}
                >
                  <div className="flex items-start gap-3 mb-1">
                    <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={2.25} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Tu €/h real
                      </p>
                      {monthHours > 0 ? (
                        <p className={`text-3xl font-bold tabular-nums mt-1 ${hourlyColor}`}>
                          {realHourlyRate.toFixed(2)}
                          <span className="text-base font-normal"> €/h</span>
                        </p>
                      ) : (
                        <p className="text-3xl font-bold text-slate-400 tabular-nums mt-1">
                          — €/h
                        </p>
                      )}
                    </div>
                  </div>
                  {monthHours > 0 ? (
                    <>
                      <p className="text-xs text-slate-500 mt-1">
                        Objetivo:{' '}
                        <strong className="text-slate-700 tabular-nums">
                          {hourlyGoal} €/h
                        </strong>
                      </p>
                      {hourlyLabel && (
                        <p className={`text-xs font-semibold mt-3 inline-flex items-center gap-1.5 ${hourlyColor}`}>
                          <span className={`w-2 h-2 rounded-full ${hourlyDot}`} />
                          {hourlyLabel}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      Sin sesiones este mes
                    </p>
                  )}
                </div>
              )}

              {/* If only monthly goal is set, show a CTA card to also configure hourly */}
              {monthlyGoal && !hourlyGoal && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-700" strokeWidth={2.5} />
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      Tip
                    </p>
                  </div>
                  <p className="text-sm text-blue-900 mb-3">
                    Configura también tu objetivo €/h para ver si tu trabajo está
                    bien valorado.
                  </p>
                  <button
                    onClick={() => router.push('/account')}
                    className="text-xs font-semibold text-blue-700 hover:underline self-start"
                  >
                    Configurar →
                  </button>
                </div>
              )}

              {/* If only hourly goal is set, show CTA for monthly */}
              {hourlyGoal && !monthlyGoal && (
                <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-700" strokeWidth={2.5} />
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      Tip
                    </p>
                  </div>
                  <p className="text-sm text-blue-900 mb-3">
                    Configura tu objetivo mensual de facturación para ver tu
                    progreso del mes con barra visual.
                  </p>
                  <button
                    onClick={() => router.push('/account')}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Configurar →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={2.25} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Define tus objetivos de ingresos
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configúralos en Mi cuenta para ver tu progreso real del mes y
                    saber si tu trabajo está bien valorado.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/account')}
                className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap"
              >
                Configurar objetivos →
              </button>
            </div>
          )}

          {/* Insights CTA */}
          <div
            onClick={() => router.push('/insights')}
            className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 cursor-pointer hover:from-slate-800 hover:to-slate-700 transition group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" strokeWidth={2.25} />
              <div>
                <p className="text-white font-bold text-sm">Analiza tu rentabilidad con IA</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Descubre qué proyectos te compensan y cuáles te cuestan dinero.
                </p>
              </div>
            </div>
            <span className="text-slate-400 text-sm font-semibold group-hover:text-white transition whitespace-nowrap">
              Analizar →
            </span>
          </div>

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
                          {p.name} · {p.billing_type === 'fixed'
                            ? `Precio cerrado ${Number(p.fixed_price || 0)}€`
                            : `€${p.rate}/h`}
                        </option>
                      ))}
                    </select>

                    {!isRunning ? (
                      <button
                        onClick={startSession}
                        disabled={!activeProject}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 active:scale-[0.99] transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm inline-flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                        Empezar a contar
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={stopSession}
                          className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 active:scale-[0.99] transition shadow-sm inline-flex items-center justify-center gap-2"
                        >
                          <Square className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                          Parar y guardar
                        </button>
                        <button
                          onClick={cancelSession}
                          className="px-5 py-4 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                          title="Cancelar sin guardar"
                        >
                          <X className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}

                    {!activeProject && projects.length === 0 && (
                      <p className="text-sm text-slate-500 mt-4">
                        Crea tu primer proyecto abajo para empezar.
                      </p>
                    )}

                    {!isRunning && projects.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <button
                          onClick={openManualModal}
                          className="w-full px-4 py-3 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold inline-flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                          Añadir tiempo manualmente
                        </button>
                        <p className="text-xs text-slate-400 text-center mt-2">
                          Para trabajo ya realizado, reuniones o sesiones sin cronómetro
                        </p>
                      </div>
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
                      className="p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3 hover:bg-slate-50/50 transition cursor-pointer group"
                      onClick={() => openEditNote(s)}
                      title="Click para editar la nota"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {project?.name || 'Proyecto borrado'}
                        </p>
                        {s.notes ? (
                          <p className="text-sm text-slate-600 truncate mt-0.5 inline-flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.25} />
                            <span className="truncate">{s.notes}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic mt-0.5 group-hover:text-slate-500 transition">
                            + Añadir nota
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(s.start_time || s.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 tabular-nums">
                        <span className="text-sm font-semibold text-slate-700">
                          {formatTime(duration * 3600)}
                        </span>
                        <span className="text-sm font-bold text-emerald-600">
                          {formatEUR(earnings)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({
                              type: 'session',
                              id: s.id,
                              label: 'esta sesión',
                            });
                          }}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Borrar sesión"
                        >
                          <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          {isPro ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-3">
                PRO ACTIVO
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Eres miembro Pro</h3>
              <p className="mb-5 text-slate-600">Gracias por confiar en Valopo. Gestiona tu suscripción cuando quieras.</p>
              <button
                onClick={openPortal}
                disabled={opening}
                className="bg-slate-100 text-slate-700 px-8 py-3 rounded-lg font-bold hover:bg-slate-200 active:scale-[0.99] transition disabled:opacity-60"
              >
                {opening ? 'Abriendo…' : 'Gestionar suscripción'}
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 text-center shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Upgrade a Pro</h3>
              <p className="mb-5 text-blue-100">14,99 €/mes · Proyectos ilimitados, facturación, exportar PDF, asesor IA ilimitado</p>
              <button
                onClick={openCheckout}
                disabled={opening}
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 active:scale-[0.99] transition disabled:opacity-60"
              >
                {opening ? 'Abriendo Stripe…' : 'Empezar ahora'}
              </button>
            </div>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-20 md:bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Mobile bottom nav */}
        <MobileNav />

        {/* Confirm delete modal */}
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

        {/* Manual entry modal */}
        {manualModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setManualModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">
                    Añadir tiempo manualmente
                  </h3>
                  <p className="text-sm text-slate-500">
                    Registra trabajo que no cronometraste en vivo
                  </p>
                </div>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Proyecto
                  </label>
                  <select
                    value={manualProjectId}
                    onChange={(e) => setManualProjectId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                  >
                    <option value="">— Selecciona un proyecto —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.billing_type === 'fixed'
                          ? `Precio cerrado ${Number(p.fixed_price || 0)}€`
                          : `€${p.rate}/h`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Duración
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                      />
                      <p className="text-xs text-slate-400 text-center mt-1">horas</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                      />
                      <p className="text-xs text-slate-400 text-center mt-1">minutos</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="¿En qué trabajaste?"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition resize-none"
                  />
                </div>

                {manualProjectId && (manualHours || manualMinutes) && (() => {
                  const selectedProject = projects.find((p) => p.id === manualProjectId);
                  const totalHours = (parseFloat(manualHours) || 0) + (parseFloat(manualMinutes) || 0) / 60;
                  const isFixed = selectedProject?.billing_type === 'fixed';

                  if (isFixed) {
                    const price = Number(selectedProject?.fixed_price || 0);
                    const sessionsForProject = sessions.filter(s => s.project_id === manualProjectId);
                    const existingHours = sessionsForProject.reduce((a, s) => a + sessionDuration(s), 0);
                    const newTotalHours = existingHours + totalHours;
                    const effectiveRate = newTotalHours > 0 ? price / newTotalHours : 0;
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="text-blue-900">
                          Proyecto a precio cerrado. Con esta sesión llevarás{' '}
                          <strong className="tabular-nums">{newTotalHours.toFixed(1)}h</strong> en total.
                          Tu €/h real será <strong className="tabular-nums">{effectiveRate.toFixed(2)} €/h</strong>.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <p className="text-blue-900">
                        Ganarás{' '}
                        <strong className="tabular-nums">
                          {formatEUR(totalHours * (selectedProject?.rate || 0))}
                        </strong>
                        {' '}con esta sesión.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveManualSession}
                  disabled={savingManual || !manualProjectId || (!manualHours && !manualMinutes)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingManual ? 'Guardando…' : 'Guardar sesión'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expense modal */}
        {expenseModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpenseModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">
                    Añadir gasto al proyecto
                  </h3>
                  <p className="text-sm text-slate-500">
                    Material, transporte, subcontratación... Todo lo que reste a tu beneficio.
                  </p>
                </div>
                <button
                  onClick={() => setExpenseModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Proyecto
                  </label>
                  <select
                    value={expenseProjectId}
                    onChange={(e) => setExpenseProjectId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                  >
                    <option value="">— Selecciona un proyecto —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Ej: Material de impresión, Transporte, Subcontratación..."
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Importe €
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    placeholder="Detalles adicionales..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setExpenseModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveExpense}
                  disabled={savingExpense || !expenseProjectId || !expenseDescription || !expenseAmount}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingExpense ? 'Guardando…' : 'Guardar gasto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade modal */}
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
                  <Sparkles className="w-7 h-7 text-white" strokeWidth={2.25} />
                </div>
                <h3 className="font-bold text-2xl text-slate-900 mb-2">
                  Upgrade a Pro
                </h3>
                <p className="text-sm text-slate-600">{upgradeReason}</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Proyectos ilimitados
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Exportar a PDF con gráficos
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Histórico completo sin límites
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Soporte prioritario
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
                  onClick={() => {
                    setShowUpgradeModal(false);
                    openCheckout();
                  }}
                  disabled={opening}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {opening ? 'Abriendo…' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending session modal (after stopping timer) */}
        {pendingSession && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-full mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2.25} />
                </div>
                <h3 className="font-bold text-2xl text-slate-900 mb-1">
                  ¡Sesión completada!
                </h3>
                <p className="text-sm text-slate-500">
                  {formatTime(pendingSession.duration)} en{' '}
                  {projects.find((p) => p.id === pendingSession.projectId)?.name ||
                    'proyecto'}
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  ¿Qué hiciste en esta sesión? <span className="text-slate-400 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ej: Diseño del logo, primera versión. Revisión de paleta de colores con cliente."
                  rows={4}
                  autoFocus
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition resize-none text-sm"
                />
                <p className="text-xs text-slate-500 mt-2 inline-flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 mt-0.5" strokeWidth={2.25} />
                  Las notas aparecerán en tus informes y facturas.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={discardPendingSession}
                  disabled={savingNote}
                  className="px-4 py-3 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-60 text-sm"
                >
                  Descartar
                </button>
                <button
                  onClick={() => confirmSession(false)}
                  disabled={savingNote}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-60"
                >
                  {savingNote ? 'Guardando…' : 'Guardar sin nota'}
                </button>
                <button
                  onClick={() => confirmSession(true)}
                  disabled={savingNote}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {savingNote ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding tour */}
        {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}

        {/* Edit note of existing session modal */}
        {editingNoteSession && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!savingNote) {
                setEditingNoteSession(null);
                setNoteText('');
              }
            }}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5">
                <h3 className="font-bold text-2xl text-slate-900 mb-1">
                  Editar nota
                </h3>
                <p className="text-sm text-slate-500">
                  {projects.find((p) => p.id === editingNoteSession.project_id)?.name ||
                    'Proyecto borrado'}{' '}
                  ·{' '}
                  {formatDate(editingNoteSession.start_time || editingNoteSession.created_at)}
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Nota
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe qué hiciste en esta sesión…"
                  rows={4}
                  autoFocus
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition resize-none text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Deja el campo vacío para borrar la nota.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingNoteSession(null);
                    setNoteText('');
                  }}
                  disabled={savingNote}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditedNote}
                  disabled={savingNote}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {savingNote ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
