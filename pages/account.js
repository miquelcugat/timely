import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/usePlan';
import MobileNav from '../components/MobileNav';
import { Clock } from 'lucide-react';

const EMPTY_PROFILE = {
  legal_name: '',
  tax_id: '',
  trade_name: '',
  address: '',
  postal_code: '',
  city: '',
  province: '',
  country: 'España',
  email: '',
  phone: '',
  website: '',
  iban: '',
  bank_name: '',
  invoice_prefix: '',
  default_vat_rate: 21,
  default_irpf_rate: 15,
  default_payment_terms: 'Pago a 30 días por transferencia bancaria.',
  invoice_footer: '',
  monthly_income_goal: '',
  hourly_rate_goal: '',
  logo_url: '',
};

const REQUIRED_FIELDS = ['legal_name', 'tax_id', 'address', 'postal_code', 'city'];

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const { subscription, plan, isPro, loading: planLoading } = usePlan(user?.id);

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      await loadProfile(data.session.user.id, data.session.user.email);
      setLoading(false);
    };
    init();
  }, [router]);

  const loadProfile = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('freelancer_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          legal_name: data.legal_name || '',
          tax_id: data.tax_id || '',
          trade_name: data.trade_name || '',
          address: data.address || '',
          postal_code: data.postal_code || '',
          city: data.city || '',
          province: data.province || '',
          country: data.country || 'España',
          email: data.email || userEmail || '',
          phone: data.phone || '',
          website: data.website || '',
          iban: data.iban || '',
          bank_name: data.bank_name || '',
          invoice_prefix: data.invoice_prefix || '',
          default_vat_rate: data.default_vat_rate ?? 21,
          default_irpf_rate: data.default_irpf_rate ?? 15,
          default_payment_terms:
            data.default_payment_terms ||
            'Pago a 30 días por transferencia bancaria.',
          invoice_footer: data.invoice_footer || '',
          monthly_income_goal: data.monthly_income_goal ?? '',
          hourly_rate_goal: data.hourly_rate_goal ?? '',
          logo_url: data.logo_url || '',
        });
      } else {
        setProfile((prev) => ({ ...prev, email: userEmail || '' }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('error', 'Error cargando los datos');
    }
  };

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        user_id: user.id,
        ...profile,
        legal_name: profile.legal_name.trim() || null,
        tax_id: profile.tax_id.trim() || null,
        trade_name: profile.trade_name.trim() || null,
        address: profile.address.trim() || null,
        postal_code: profile.postal_code.trim() || null,
        city: profile.city.trim() || null,
        province: profile.province.trim() || null,
        country: profile.country.trim() || null,
        email: profile.email.trim() || null,
        phone: profile.phone.trim() || null,
        website: profile.website.trim() || null,
        iban: profile.iban.replace(/\s+/g, '').trim() || null,
        bank_name: profile.bank_name.trim() || null,
        invoice_prefix: profile.invoice_prefix.trim() || null,
        default_payment_terms: profile.default_payment_terms.trim() || null,
        invoice_footer: profile.invoice_footer.trim() || null,
        monthly_income_goal:
          profile.monthly_income_goal === '' || profile.monthly_income_goal == null
            ? null
            : Number(profile.monthly_income_goal),
        hourly_rate_goal:
          profile.hourly_rate_goal === '' || profile.hourly_rate_goal == null
            ? null
            : Number(profile.hourly_rate_goal),
        logo_url: profile.logo_url || null,
      };

      const { error } = await supabase
        .from('freelancer_profile')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      showToast('success', 'Datos guardados');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('error', 'No se pudo guardar');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'El logo debe pesar menos de 2 MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${ext}`;

      if (profile.logo_url) {
        try {
          const oldPath = profile.logo_url.split('/logos/')[1];
          if (oldPath) {
            await supabase.storage.from('logos').remove([oldPath]);
          }
        } catch {}
      }

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const publicUrl = publicData.publicUrl;
      setProfile((prev) => ({ ...prev, logo_url: publicUrl }));

      await supabase
        .from('freelancer_profile')
        .upsert(
          { user_id: user.id, logo_url: publicUrl },
          { onConflict: 'user_id' }
        );

      showToast('success', 'Logo subido');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('error', 'No se pudo subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!profile.logo_url) return;
    setUploadingLogo(true);
    try {
      const oldPath = profile.logo_url.split('/logos/')[1];
      if (oldPath) {
        await supabase.storage.from('logos').remove([oldPath]);
      }
      setProfile((prev) => ({ ...prev, logo_url: '' }));
      await supabase
        .from('freelancer_profile')
        .upsert(
          { user_id: user.id, logo_url: null },
          { onConflict: 'user_id' }
        );
      showToast('success', 'Logo eliminado');
    } catch (error) {
      console.error('Error removing logo:', error);
      showToast('error', 'No se pudo eliminar');
    } finally {
      setUploadingLogo(false);
    }
  };

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else showToast('error', json.error || 'Error abriendo el portal');
    } catch (e) {
      showToast('error', 'Error abriendo el portal');
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
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else showToast('error', json.error || 'Error abriendo el checkout');
    } catch (e) {
      showToast('error', 'Error abriendo el checkout');
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

  const missingFields = REQUIRED_FIELDS.filter((f) => !profile[f]?.trim());
  const isProfileComplete = missingFields.length === 0;

  return (
    <>
      <Head>
        <title>Mi cuenta · Valopo</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-slate-900">Valopo</span>
            </div>
            <Link
              href="/dashboard"
              className="hidden md:inline-flex text-sm text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium"
            >
              ← Volver al dashboard
            </Link>
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

        <main className="max-w-4xl mx-auto px-6 py-10 pb-24 md:pb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Mi cuenta</h1>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Cuenta</h2>
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-lg font-bold text-slate-900">Datos fiscales y objetivos</h2>
              {isProfileComplete ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                  ✓ Completo
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                  Faltan {missingFields.length} campos
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Estos datos aparecerán en la cabecera de cada factura. Los objetivos te
              ayudan a saber si estás ganando lo que realmente quieres.
            </p>

            {!isProfileComplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
                <p className="text-sm text-amber-900">
                  <strong>⚠ Datos incompletos.</strong> Para poder generar facturas
                  necesitas al menos: nombre legal, NIF, dirección, código postal y
                  ciudad.
                </p>
              </div>
            )}

            <FormGroup title="Identidad fiscal">
              <Field label="Nombre legal o razón social *">
                <input
                  type="text"
                  value={profile.legal_name}
                  onChange={(e) => updateField('legal_name', e.target.value)}
                  placeholder="Miquel Cugat López"
                  className="form-input"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="NIF / CIF *">
                  <input
                    type="text"
                    value={profile.tax_id}
                    onChange={(e) => updateField('tax_id', e.target.value)}
                    placeholder="12345678A"
                    className="form-input font-mono"
                  />
                </Field>
                <Field label="Nombre comercial">
                  <input
                    type="text"
                    value={profile.trade_name}
                    onChange={(e) => updateField('trade_name', e.target.value)}
                    placeholder="Valopo Studio (opcional)"
                    className="form-input"
                  />
                </Field>
              </div>
            </FormGroup>

            <FormGroup title="Dirección fiscal">
              <Field label="Dirección *">
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Calle Mayor 1, 2º A"
                  className="form-input"
                />
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Código postal *">
                  <input
                    type="text"
                    value={profile.postal_code}
                    onChange={(e) => updateField('postal_code', e.target.value)}
                    placeholder="28001"
                    className="form-input"
                  />
                </Field>
                <Field label="Ciudad *">
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Madrid"
                    className="form-input"
                  />
                </Field>
                <Field label="Provincia">
                  <input
                    type="text"
                    value={profile.province}
                    onChange={(e) => updateField('province', e.target.value)}
                    placeholder="Madrid"
                    className="form-input"
                  />
                </Field>
              </div>
              <Field label="País">
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="form-input"
                />
              </Field>
            </FormGroup>

            <FormGroup title="Contacto">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email de contacto">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="hola@tuempresa.com"
                    className="form-input"
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+34 600 000 000"
                    className="form-input"
                  />
                </Field>
              </div>
              <Field label="Sitio web">
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://tuempresa.com"
                  className="form-input"
                />
              </Field>
            </FormGroup>

            <FormGroup title="Datos bancarios">
              <Field label="IBAN">
                <input
                  type="text"
                  value={profile.iban}
                  onChange={(e) => updateField('iban', e.target.value)}
                  placeholder="ES12 3456 7890 1234 5678 9012"
                  className="form-input font-mono"
                />
              </Field>
              <Field label="Banco">
                <input
                  type="text"
                  value={profile.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="BBVA, Santander, etc."
                  className="form-input"
                />
              </Field>
            </FormGroup>

            <FormGroup title="Configuración de facturas">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Prefijo de numeración">
                  <input
                    type="text"
                    value={profile.invoice_prefix}
                    onChange={(e) => updateField('invoice_prefix', e.target.value)}
                    placeholder="(opcional)"
                    className="form-input"
                  />
                </Field>
                <Field label="IVA por defecto (%)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={profile.default_vat_rate}
                    onChange={(e) =>
                      updateField('default_vat_rate', parseFloat(e.target.value) || 0)
                    }
                    className="form-input tabular-nums"
                  />
                </Field>
                <Field label="IRPF por defecto (%)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={profile.default_irpf_rate}
                    onChange={(e) =>
                      updateField('default_irpf_rate', parseFloat(e.target.value) || 0)
                    }
                    className="form-input tabular-nums"
                  />
                </Field>
              </div>
              <Field label="Condiciones de pago">
                <textarea
                  value={profile.default_payment_terms}
                  onChange={(e) => updateField('default_payment_terms', e.target.value)}
                  rows={2}
                  className="form-input resize-none"
                />
              </Field>
              <Field label="Pie de factura (opcional)">
                <textarea
                  value={profile.invoice_footer}
                  onChange={(e) => updateField('invoice_footer', e.target.value)}
                  placeholder="Cualquier texto extra que quieras al final de tus facturas"
                  rows={2}
                  className="form-input resize-none"
                />
              </Field>
            </FormGroup>

            {/* NEW: Goals section */}
            <FormGroup title="Tus objetivos">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                <p className="text-sm text-blue-900">
                  💡 Valopo usa estos objetivos para decirte si estás ganando lo que
                  realmente quieres, proyecto a proyecto.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Objetivo €/hora">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={profile.hourly_rate_goal}
                      onChange={(e) =>
                        updateField('hourly_rate_goal', e.target.value)
                      }
                      placeholder="50"
                      className="form-input tabular-nums pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold pointer-events-none">
                      €/h
                    </span>
                  </div>
                </Field>
                <Field label="Objetivo mensual (facturación)">
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={profile.monthly_income_goal}
                      onChange={(e) =>
                        updateField('monthly_income_goal', e.target.value)
                      }
                      placeholder="3000"
                      className="form-input tabular-nums pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold pointer-events-none">
                      €/mes
                    </span>
                  </div>
                </Field>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Puedes dejarlos vacíos si no los usas. Cambiarlos cuando quieras.
              </p>
            </FormGroup>

            <FormGroup title="Logo">
              <div className="flex items-center gap-4 flex-wrap">
                {profile.logo_url ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.logo_url}
                      alt="Logo"
                      className="w-24 h-24 object-contain border border-slate-200 rounded-lg bg-white p-2"
                    />
                    <div className="flex flex-col gap-2">
                      <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition text-sm cursor-pointer text-center">
                        {uploadingLogo ? 'Subiendo…' : 'Cambiar'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={removeLogo}
                        disabled={uploadingLogo}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="px-5 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition cursor-pointer text-sm border-2 border-dashed border-blue-200">
                    {uploadingLogo ? 'Subiendo…' : '↑ Subir logo (máx 2 MB)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                PNG, JPG, SVG o WebP. Aparecerá en la esquina superior de tus
                facturas.
              </p>
            </FormGroup>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-60"
              >
                {savingProfile ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {!isPro && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Pro incluye</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Proyectos ilimitados</li>
                <li>✓ Histórico completo (sin límite de días)</li>
                <li>✓ Exportar a PDF con gráficos</li>
                <li>✓ Facturas profesionales con tu logo y datos fiscales</li>
                <li>✓ Soporte prioritario</li>
              </ul>
            </div>
          )}
        </main>

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

        <MobileNav />
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.15s;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(219 234 254);
        }
      `}</style>
    </>
  );
}

function FormGroup({ title, children }) {
  return (
    <div className="mb-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
