import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Check rate limit for free users
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    const isPro = !!sub;

    if (!isPro) {
      // Check last analysis timestamp
      const { data: profile } = await supabaseAdmin
        .from('freelancer_profile')
        .select('last_insight_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.last_insight_at) {
        const lastAt = new Date(profile.last_insight_at);
        const now = new Date();
        const hoursSince = (now - lastAt) / (1000 * 60 * 60);
        if (hoursSince < 24) {
          const hoursLeft = Math.ceil(24 - hoursSince);
          return res.status(429).json({
            error: `Plan Free: 1 análisis al día. Próximo disponible en ${hoursLeft}h. Upgrade a Pro para análisis ilimitados.`,
          });
        }
      }
    }

    // Fetch all user data
    const [
      { data: projects },
      { data: sessions },
      { data: clients },
      { data: profileData },
    ] = await Promise.all([
      supabaseAdmin.from('projects').select('*').eq('user_id', user.id),
      supabaseAdmin.from('sessions').select('*').eq('user_id', user.id).order('start_time', { ascending: false }).limit(500),
      supabaseAdmin.from('clients').select('*').eq('user_id', user.id),
      supabaseAdmin.from('freelancer_profile').select('hourly_rate_goal, monthly_income_goal').eq('user_id', user.id).maybeSingle(),
    ]);

    if (!projects?.length) {
      return res.status(400).json({ error: 'Necesitas al menos 1 proyecto con sesiones para generar un análisis.' });
    }

    const sessionsWithData = (sessions || []).filter(s => s.duration_seconds > 0);
    if (sessionsWithData.length < 3) {
      return res.status(400).json({ error: 'Necesitas al menos 3 sesiones registradas para generar un análisis útil.' });
    }

    // Build context for Claude
    const hourlyGoal = profileData?.hourly_rate_goal || null;
    const monthlyGoal = profileData?.monthly_income_goal || null;

    const now = new Date();
    const currentDay = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = lastDay - currentDay;
    const monthName = now.toLocaleDateString('es-ES', { month: 'long' });

    // Aggregate per project
    const projectStats = projects.map(p => {
      const projSessions = sessionsWithData.filter(s => s.project_id === p.id);
      const totalHours = projSessions.reduce((a, s) => a + (s.duration_seconds || 0) / 3600, 0);
      const totalEarned = projSessions.reduce((a, s) => a + Number(s.earned || 0), 0);
      const sessionCount = projSessions.length;
      const effectiveRate = totalHours > 0 ? totalEarned / totalHours : Number(p.rate) || 0;
      const client = clients?.find(c => c.id === p.client_id);

      // Sessions this month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthSessions = projSessions.filter(s => new Date(s.start_time) >= monthStart);
      const monthHours = monthSessions.reduce((a, s) => a + (s.duration_seconds || 0) / 3600, 0);
      const monthEarned = monthSessions.reduce((a, s) => a + Number(s.earned || 0), 0);

      // Average session duration
      const avgSessionMin = sessionCount > 0 ? (totalHours * 60) / sessionCount : 0;

      return {
        name: p.name,
        client: client?.name || null,
        rate: Number(p.rate) || 0,
        totalHours: Math.round(totalHours * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        sessionCount,
        avgSessionMin: Math.round(avgSessionMin),
        monthHours: Math.round(monthHours * 100) / 100,
        monthEarned: Math.round(monthEarned * 100) / 100,
      };
    }).filter(p => p.sessionCount > 0 || p.rate > 0);

    // Global month stats
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSessions = sessionsWithData.filter(s => new Date(s.start_time) >= monthStart);
    const monthTotalHours = monthSessions.reduce((a, s) => a + (s.duration_seconds || 0) / 3600, 0);
    const monthTotalEarned = monthSessions.reduce((a, s) => a + Number(s.earned || 0), 0);

    const prompt = `Eres un asesor financiero experto en negocio freelance. Analizas los datos REALES del freelancer y das consejos directos, específicos y accionables. No des consejos genéricos. Basa todo en los números.

DATOS DEL FREELANCER:

Objetivo €/hora: ${hourlyGoal ? hourlyGoal + ' €/h' : 'No configurado'}
Objetivo mensual: ${monthlyGoal ? monthlyGoal + ' €/mes' : 'No configurado'}

Fecha actual: ${now.toLocaleDateString('es-ES')} (día ${currentDay} de ${lastDay}, quedan ${daysLeft} días en ${monthName})

Este mes lleva: ${Math.round(monthTotalHours * 100) / 100}h trabajadas, ${Math.round(monthTotalEarned * 100) / 100}€ facturados
${monthlyGoal ? `Progreso del mes: ${Math.round((monthTotalEarned / monthlyGoal) * 100)}% del objetivo (faltan ${Math.round((monthlyGoal - monthTotalEarned) * 100) / 100}€)` : ''}

PROYECTOS:
${projectStats.map(p => `- "${p.name}" ${p.client ? `(cliente: ${p.client})` : ''}: tarifa ${p.rate}€/h, ${p.sessionCount} sesiones, ${p.totalHours}h totales, ${p.totalEarned}€ ganados, tarifa efectiva ${p.effectiveRate}€/h, media sesión ${p.avgSessionMin}min. Este mes: ${p.monthHours}h, ${p.monthEarned}€`).join('\n')}

INSTRUCCIONES:
Responde SOLO con un JSON válido (sin backticks, sin markdown). El JSON debe tener esta estructura exacta:
{
  "summary": "2-3 frases directas sobre la situación actual del freelancer",
  "profitable_projects": [
    { "name": "nombre", "reason": "por qué es rentable (1 frase con datos)" }
  ],
  "problematic_projects": [
    { "name": "nombre", "problem": "cuál es el problema concreto (1 frase con datos)" }
  ],
  "alerts": [
    "alerta importante 1 (específica, con números)",
    "alerta importante 2"
  ],
  "recommendations": [
    "recomendación concreta y accionable 1",
    "recomendación concreta y accionable 2",
    "recomendación concreta y accionable 3"
  ],
  "daily_tip": "qué debería hacer HOY específicamente para mejorar su situación"
}

Sé directo. No uses relleno. Cada punto debe incluir números reales del freelancer.
Si no hay objetivo configurado, recomienda configurarlo como primera acción.
Responde en español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Claude API error:', response.status, errBody);
      return res.status(500).json({ error: 'Error generando el análisis. Inténtalo de nuevo.' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON response
    let analysis;
    try {
      const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analysis = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Raw:', text);
      return res.status(500).json({ error: 'Error procesando el análisis. Inténtalo de nuevo.' });
    }

    // Save timestamp for rate limiting
    await supabaseAdmin
      .from('freelancer_profile')
      .upsert(
        { user_id: user.id, last_insight_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    return res.status(200).json({ analysis, isPro });
  } catch (err) {
    console.error('Insights error:', err);
    return res.status(500).json({ error: 'Error interno. Inténtalo de nuevo.' });
  }
}
