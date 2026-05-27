import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// --- GPU Reservation API ---

export interface GpuReservationDto {
  id: number;
  releaseName: string;
  namespace: string;
  clusterId: string;
  gpuCount: number;
  estimatedMinutes: number;
  unitPriceKrw: number;
  estimatedCostKrw: number;
  deployedAt: string;
}

export const useGetGpuReservations = (cluster: string) => {
  const { data, isPending } = useQuery({
    queryKey: ['cost', 'reservations', cluster],
    queryFn: () =>
      api.get<GpuReservationDto[]>('cost/reservations', { searchParams: { cluster } }).json(),
    refetchInterval: 10000,
    enabled: !!cluster,
  });
  return { reservations: data ?? [], isPending };
};

export const useCreateGpuReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      releaseName: string;
      namespace: string;
      clusterId: string;
      gpuCount: number;
      estimatedMinutes: number;
      unitPriceKrw: number;
      estimatedCostKrw: number;
    }) => api.post('cost/reservations', { json: dto }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost', 'reservations'] });
    },
  });
};

export const useExtendGpuReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { releaseName: string; cluster: string; minutes: number }) =>
      api
        .put(`cost/reservations/${params.releaseName}/extend`, {
          searchParams: { cluster: params.cluster, minutes: params.minutes },
        })
        .json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost', 'reservations'] });
    },
  });
};
