import { useState, useEffect, useCallback } from 'react';
import { getDailyUsage, DailyUsage } from '../services/api';

interface UseDailyUsageReturn {
  dailyUsage: DailyUsage | null;
  loading: boolean;
  refreshUsage: () => Promise<void>;
}

export function useDailyUsage(): UseDailyUsageReturn {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDailyUsage();
      if (response.success) {
        setDailyUsage(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch daily usage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  return { dailyUsage, loading, refreshUsage };
}