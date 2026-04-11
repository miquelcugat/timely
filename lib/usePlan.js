import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { getActivePlan, getPlanLimits } from './plans';

export function usePlan(userId) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        console.error('Error loading subscription:', error);
      }
      setSubscription(data || null);
      setLoading(false);
    };

    load();

    // Realtime: refresh when subscription changes (e.g. after webhook updates it)
    const channel = supabase
      .channel(`sub-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) setSubscription(payload.new);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const plan = getActivePlan(subscription);
  const limits = getPlanLimits(plan);

  return {
    subscription,
    plan,
    limits,
    isPro: plan === 'pro',
    isFree: plan === 'free',
    loading,
  };
}
