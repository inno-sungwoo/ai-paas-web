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
      // duration > 10000 → 백엔드가 초 단위로 처리 (10800초 = 3시간)
      const fetchMetric = (type: string, key: string) =>
        api
          .get(`monit/resourceMonit/${cluster}/${type}/${key}`, {
            searchParams: { duration: '10800' },
          })
          .json<any>()
          .catch(() => null);

      const [cpuUsage, cpuTotal, memUsage, memTotal, fsUsage, fsTotal, podUsed, podTotal] =
        await Promise.all([
          fetchMetric('cpu', 'usage'),
          fetchMetric('cpu', 'total'),
          fetchMetric('memory', 'usage'),
          fetchMetric('memory', 'total'),
          fetchMetric('filesystem', 'usage'),
          fetchMetric('filesystem', 'total'),
          fetchMetric('pod', 'used_node'),
          fetchMetric('pod', 'total'),
        ]);

      // 백엔드 응답: [{ info, values: [{ time, value }] }] (query_range)
      // 또는 [{ info, value }] (query)
      // 각 시리즈의 마지막 값을 합산
      const sumValues = (res: any) => {
        try {
          if (!Array.isArray(res)) return 0;
          return res.reduce((sum: number, series: any) => {
            if (series.values && Array.isArray(series.values) && series.values.length > 0) {
              // query_range: values 배열의 마지막 값
              return sum + (series.values[series.values.length - 1].value ?? 0);
            }
            if (series.value !== undefined) {
              // query: 단일 값
              return sum + (typeof series.value === 'number' ? series.value : parseFloat(series.value) || 0);
            }
            return sum;
          }, 0);
        } catch {
          return 0;
        }
      };

      const cpuUsageVal = sumValues(cpuUsage);
      const cpuTotalVal = sumValues(cpuTotal);
      const memUsageVal = sumValues(memUsage);
      const memTotalVal = sumValues(memTotal);
      const fsUsageVal = sumValues(fsUsage);
      const fsTotalVal = sumValues(fsTotal);
      const podUsedVal = sumValues(podUsed);
      const podTotalVal = sumValues(podTotal);

      return {
        cpuUtil: cpuTotalVal > 0 ? (cpuUsageVal / cpuTotalVal) * 100 : 0,
        memoryUtil: memTotalVal > 0 ? (memUsageVal / memTotalVal) * 100 : 0,
        filesystemUtil: fsTotalVal > 0 ? (fsUsageVal / fsTotalVal) * 100 : 0,
        podCount: podUsedVal,
        podCapacity: podTotalVal || 110,
      };
    },
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { nodeResource: data };
};

// 성능 지표 시계열 데이터 (CPU usage, CPU load average)
export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface PerformanceMetrics {
  cpuUsage: TimeSeriesPoint[];
  cpuLoad: TimeSeriesPoint[];
}

export const useGetPerformanceMetrics = (cluster: string) => {
  const { data } = useQuery({
    queryKey: ['monitoring', 'performance', cluster],
    queryFn: async (): Promise<PerformanceMetrics> => {
      // duration > 10000 이면 백엔드가 초 단위로 처리 (3600초 = 1시간)
      const fetchTimeSeries = (type: string, key: string) =>
        api
          .get(`monit/resourceMonit/${cluster}/${type}/${key}`, {
            searchParams: { duration: '36000' },
          })
          .json<any[]>()
          .catch(() => []);

      const [cpuUsageRes, cpuLoadRes] = await Promise.all([
        fetchTimeSeries('cpu', 'usage'),
        fetchTimeSeries('cpu', 'load5'),
      ]);

      // 노드별 시계열을 시간 축으로 합산
      const mergeTimeSeries = (res: any[]): TimeSeriesPoint[] => {
        if (!Array.isArray(res) || res.length === 0) return [];
        const timeMap = new Map<string, number>();
        for (const series of res) {
          if (!series.values) continue;
          for (const v of series.values) {
            const t = v.time as string;
            timeMap.set(t, (timeMap.get(t) ?? 0) + v.value);
          }
        }
        return [...timeMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, value]) => ({
            time: new Date(time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            value: Math.round(value * 1000) / 1000,
          }));
      };

      return {
        cpuUsage: mergeTimeSeries(cpuUsageRes),
        cpuLoad: mergeTimeSeries(cpuLoadRes),
      };
    },
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { performance: data };
};

// Pod 목록 (네임스페이스별)
export interface PodNamespaceInfo {
  namespace: string;
  count: number;
}

export const useGetPodsByNamespace = (cluster: string) => {
  const { data, isPending } = useQuery({
    queryKey: ['monitoring', 'podNamespace', cluster],
    queryFn: async (): Promise<PodNamespaceInfo[]> => {
      const res = await api
        .get(`monit/resourceMonit/${cluster}/pod/usage_namespace`)
        .json<any[]>()
        .catch(() => []);

      if (!Array.isArray(res)) return [];
      return res
        .map((item) => ({
          namespace: item.info?.namespace ?? '-',
          count: Math.round(item.value ?? 0),
        }))
        .sort((a, b) => b.count - a.count);
    },
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { pods: data ?? [], isPending };
};
