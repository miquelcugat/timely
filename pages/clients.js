import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/usePlan';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  tax_id: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'España',
  notes: '',
};

export default function Clients() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { isPro } = usePlan(user?.id);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      const [{ data: clientsData, error: cErr }, { data: projectsData, error: pErr }] =
        await Promise.all([
          supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .order('name', { ascending: true }),
          supabase
            .from('projects')
            .select('id, name, client_id')
            .eq('user_id', userId),
        ]);
      if (cErr) throw cErr;
      if (pErr) throw pErr;
      setClients(clientsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      showToast('error', 'Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Form handlers ----------
  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      tax_id: client.tax_id || '',
      address: client.address || '',
      city: client.city || '',
      postal_code: client.postal_code || '',
      country: client.country || 'España',
      notes: client.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveClient = async () => {
    if (!form.name.trim()) {
      showToast('error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        tax_id: form.tax_id.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
        country: form.country.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        showToast('success', 'Cliente actualizado');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...payload, user_id: user.id }]);
        if (error) throw error;
        showToast('success', 'Cliente creado');
      }
      closeModal();
      await loadData(user.id);
    } catch (error) {
      console.error('Error saving client:', error);
      showToast('error', 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (id) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients((prev) => prev.filter((c) => c.id !== id));
      showToast('success', 'Cliente borrado');
    } catch (error) {
      console.error('Error deleting client:', error);
      showToast('error', 'No se pudo borrar');
    } finally {
      setConfirmDelete(null);
    }
  };

  // ---------- Helpers ----------
  const projectCountFor = (clientId) =>
    projects.filter((p) => p.client_id === clientId).length;

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.tax_id?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando clientes…</span>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <>
      <Head>
        <title>Mis clientes · Valopo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">⏱</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900">Valopo</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isPro
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isPro ? 'PRO' : 'FREE'}
                </span>
              </div>
            </Link>
          <div className="flex items-center gap-2 sm:gap-4">
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
                href="/invoices"
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Facturas
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
          {/* Page header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Mis clientes</h1>
              <p className="text-sm text-slate-500">
                {clients.length === 0
                  ? 'Aún no tienes clientes guardados.'
                  : `Tienes ${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}.`}
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition shadow-sm"
            >
              + Nuevo cliente
            </button>
          </div>

          {/* Search */}
          {clients.length > 0 && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nombre, NIF, email o ciudad…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          )}

          {/* Empty state */}
          {clients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Aún no tienes clientes
              </h2>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Crea tu primer cliente para tenerlo siempre a mano cuando crees un
                proyecto o generes una factura.
              </p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition"
              >
                + Crear mi primer cliente
              </button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Ningún cliente coincide con tu búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => {
                const projectCount = projectCountFor(client.id);
                return (
                  <div
                    key={client.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">
                          {client.name}
                        </h3>
                        {projectCount > 0 && (
                          <span className="shrink-0 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            {projectCount}{' '}
                            {projectCount === 1 ? 'proy.' : 'proys.'}
                          </span>
                        )}
                      </div>
                      {client.tax_id && (
                        <p className="text-xs text-slate-500 mb-1">
                          NIF: <span className="font-mono">{client.tax_id}</span>
                        </p>
                      )}
                      {client.email && (
                        <p className="text-sm text-slate-600 truncate mb-1">
                          ✉ {client.email}
                        </p>
                      )}
                      {client.city && (
                        <p className="text-sm text-slate-600 truncate">
                          📍 {client.city}
                          {client.country && client.country !== 'España'
                            ? `, ${client.country}`
                            : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(client)}
                        className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            id: client.id,
                            label: client.name,
                            projectCount,
                          })
                        }
                        className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

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
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                ¿Borrar este cliente?
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                Vas a borrar{' '}
                <span className="font-semibold">{confirmDelete.label}</span>.
                {confirmDelete.projectCount > 0 && (
                  <>
                    {' '}
                    Tiene{' '}
                    <span className="font-semibold">
                      {confirmDelete.projectCount}{' '}
                      {confirmDelete.projectCount === 1 ? 'proyecto' : 'proyectos'}
                    </span>{' '}
                    asociado{confirmDelete.projectCount === 1 ? '' : 's'}, que
                    quedarán sin cliente asignado pero NO se borrarán.
                  </>
                )}{' '}
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteClient(confirmDelete.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-2xl text-slate-900 mb-1">
                {editingId ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Los campos marcados con * son obligatorios. El resto puedes
                rellenarlos después.
              </p>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Nombre o razón social *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Acme S.L."
                    autoFocus
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                {/* NIF + Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      NIF / CIF
                    </label>
                    <input
                      type="text"
                      value={form.tax_id}
                      onChange={(e) => handleChange('tax_id', e.target.value)}
                      placeholder="B12345678"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contacto@acme.com"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Calle Mayor 1, 2º A"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                {/* Ciudad + CP + País */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Madrid"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      Código postal
                    </label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      placeholder="28001"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    País
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="España"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Notas internas
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Cualquier nota privada que quieras recordar sobre este cliente…"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveClient}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {saving
                    ? 'Guardando…'
                    : editingId
                    ? 'Guardar cambios'
                    : 'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
