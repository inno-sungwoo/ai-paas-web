import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { AuditEvent } from '../../types/monitoring';

export const useGetAuditEvents = (namespace: string) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['audit', 'events', namespace],
    queryFn: () => api.get<AuditEvent[]>('audit/events', { searchParams: { namespace } }).json(),
    enabled: !!namespace,
  });
  return { events: data ?? [], isPending, isError };
};
