import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CostSummary, IdleWarning, CostReport, CostEstimate } from '../../types/monitoring';

export const useGetCostSummary = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['cost', 'summary', cluster],
    queryFn: () => api.get<CostSummary>('cost/summary', { searchParams: { cluster } }).json(),
    enabled: !!cluster,
  });
  return { costSummary: data, isPending, isError };
};

export const useGetIdleWarnings = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['cost', 'idle-warnings', cluster],
    queryFn: () =>
      api.get<IdleWarning[]>('cost/idle-warnings', { searchParams: { cluster } }).json(),
    refetchInterval: 30000,
    enabled: !!cluster,
  });
  return { idleWarnings: data ?? [], isPending, isError };
};

export const useGetCostReport = (cluster: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['cost', 'report', cluster],
    queryFn: () => api.get<CostReport>('cost/report', { searchParams: { cluster } }).json(),
    enabled: !!cluster,
  });
  return { costReport: data, isPending, isError };
};

export const useGetCostEstimate = (gpuCount: number, hours: number) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['cost', 'estimate', gpuCount, hours],
    queryFn: () =>
      api.get<CostEstimate>('cost/estimate', { searchParams: { gpuCount, hours } }).json(),
    enabled: gpuCount > 0 && hours > 0,
  });
  return { costEstimate: data, isPending, isError };
};
