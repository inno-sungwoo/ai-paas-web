import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { AuditEvent } from '../../types/monitoring';

export const useGetAuditEvents = (cluster: string, namespace: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['audit', 'events', cluster, namespace],
    queryFn: () =>
      api.get<AuditEvent[]>('audit/events', { searchParams: { cluster, namespace } }).json(),
    enabled: !!cluster && !!namespace,
    refetchInterval: 30000,
  });
  return { events: data ?? [], isPending, isError };
};
