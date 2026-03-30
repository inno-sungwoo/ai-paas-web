import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { MonitoringSummary, ReleaseStatus, Alert } from '../../types/monitoring';

export interface NodeResourceUsage {
  cpuUtil: number;
  memoryUtil: number;
  filesystemUtil: number;
  podCount: number;
  podCapacity: number;
}

export const useGetMonitoringSummary = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['monitoring', 'summary', cluster],
    queryFn: () =>
      api.get<MonitoringSummary>('monit/monitoring/summary', { searchParams: { cluster } }).json(),
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { summary: data, isPending, isError };
};

export const useGetMonitoringReleases = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['monitoring', 'releases', cluster],
    queryFn: () =>
      api.get<ReleaseStatus[]>('monit/monitoring/releases', { searchParams: { cluster } }).json(),
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { releases: data ?? [], isPending, isError };
};

export const useGetMonitoringAlerts = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['monitoring', 'alerts', cluster],
    queryFn: () =>
      api.get<Alert[]>('monit/monitoring/alerts', { searchParams: { cluster } }).json(),
    refetchInterval: 15000,
    enabled: !!cluster,
  });
  return { alerts: data ?? [], isPending, isError };
};

export const useGetNodeResourceUsage = (cluster: string) => {
  const { data } = useQuery({
    queryKey: ['monitoring', 'nodeResource', cluster],
    queryFn: async (): Promise<NodeResourceUsage> => {
      const [cpuRes, memRes, fsRes, podRes] = await Promise.all([
        api
          .get('monit/resourceMonit/' + cluster + '/cpu/usage_total', {
            searchParams: { duration: '300' },
          })
          .json<any>(),
        api
          .get('monit/resourceMonit/' + cluster + '/memory/usage_total', {
            searchParams: { duration: '300' },
          })
          .json<any>(),
        api
          .get('monit/resourceMonit/' + cluster + '/disk/usage_total', {
            searchParams: { duration: '300' },
          })
          .json<any>(),
        api
          .get('monit/resourceMonit/' + cluster + '/pod/count_total', {
            searchParams: { duration: '300' },
          })
          .json<any>(),
      ]).catch(() => [null, null, null, null]);
      const last = (res: any) => {
        try {
          const results = res?.data?.result ?? res?.result ?? [];
          if (results.length > 0) {
            const vals = results[0].values ?? results[0].value;
            const v = Array.isArray(vals?.[0]) ? vals[vals.length - 1][1] : vals?.[1];
            return parseFloat(v) || 0;
          }
        } catch {
          /* ignore */
        }
        return 0;
      };
      return {
        cpuUtil: last(cpuRes) * 100,
        memoryUtil: last(memRes) * 100,
        filesystemUtil: last(fsRes) * 100,
        podCount: last(podRes),
        podCapacity: 110,
      };
    },
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { nodeResource: data };
};
