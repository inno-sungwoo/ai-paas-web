import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { MonitoringSummary, ReleaseStatus, Alert } from '../../types/monitoring';

export const useGetMonitoringSummary = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['monitoring', 'summary', cluster],
    queryFn: () => api.get<MonitoringSummary>('monit/monitoring/summary', { searchParams: { cluster } }).json(),
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { summary: data, isPending, isError };
};

export const useGetMonitoringReleases = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['monitoring', 'releases', cluster],
    queryFn: () => api.get<ReleaseStatus[]>('monit/monitoring/releases', { searchParams: { cluster } }).json(),
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { releases: data ?? [], isPending, isError };
};

export const useGetMonitoringAlerts = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['monitoring', 'alerts', cluster],
    queryFn: () => api.get<Alert[]>('monit/monitoring/alerts', { searchParams: { cluster } }).json(),
    refetchInterval: 15000,
    enabled: !!cluster,
  });
  return { alerts: data ?? [], isPending, isError };
};
