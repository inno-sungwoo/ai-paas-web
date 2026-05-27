import { useState, useEffect, useMemo, useRef } from 'react';
import { IconEventOff, IconEventOn } from '@/assets/img/icon';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useGetAuditEvents } from '@/hooks/service/audit';
import { useGetClusters } from '@/hooks/service/clusters';
import type { AuditEvent } from '@/types/monitoring';
import styles from '../inframonitor.module.scss';

type OptionType = { text: string; value: string };

const ALL_NAMESPACE_OPTION: OptionType = { text: '전체', value: '' };

function formatTime(ts: string | null | undefined) {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

function EventCard({ event }: { event: AuditEvent }) {
  const isWarning = event.type === 'Warning';
  return (
    <div className={styles.cardBoxLeft}>
      {isWarning ? (
        <IconEventOn className={styles.iconEventOn} />
      ) : (
        <IconEventOff className={styles.iconEventOff} />
      )}
      <div className={`${styles.card} ${isWarning ? styles.warning : styles.normal}`}>
        <div className={styles.state}>
          <div
            className={`table-td-state ${isWarning ? 'table-td-state-warning' : 'table-td-state-run'}`}
          >
            {event.type}
          </div>
          <span>{formatTime(event.lastTimestamp ?? event.firstTimestamp)}</span>
        </div>
        <p>{event.involvedObject}</p>
        <span>{event.message}</span>
      </div>
    </div>
  );
}

export default function EventPage() {
  const { clusters } = useGetClusters();
  const clusterOptions = useMemo<OptionType[]>(
    () => clusters.map((c) => ({ text: c.id, value: c.id })),
    [clusters],
  );
  const [cluster, setCluster] = useState<OptionType | null>(null);

  useEffect(() => {
    if (!cluster && clusterOptions.length > 0) {
      setCluster(clusterOptions[0]);
    }
  }, [clusterOptions, cluster]);

  const clusterName = cluster?.value ?? '';
  const { data: namespaces = [] } = useQuery({
    queryKey: ['kubernetes', 'namespaces', clusterName],
    queryFn: () =>
      api
        .get<Array<{ metadata: { name: string } }>>('kubernetes/namespaces', {
          searchParams: { clusterName },
        })
        .json(),
    enabled: !!clusterName,
  });
  const namespaceOptions = useMemo<OptionType[]>(
    () => [
      ALL_NAMESPACE_OPTION,
      ...namespaces.map((n) => ({ text: n.metadata.name, value: n.metadata.name })),
    ],
    [namespaces],
  );
  const [namespace, setNamespace] = useState<OptionType>(ALL_NAMESPACE_OPTION);
  const [streaming, setStreaming] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 전체 선택 시 빈 문자열 → 백엔드가 전체 네임스페이스 이벤트 반환
  const selectedNs = namespace.value;
  const { events, isPending } = useGetAuditEvents(cluster?.value ?? '', selectedNs || '');

  // 시간순 정렬 (최신 위)
  const sorted = [...events].sort((a, b) => {
    const ta = a.lastTimestamp ?? a.firstTimestamp ?? '';
    const tb = b.lastTimestamp ?? b.firstTimestamp ?? '';
    return tb.localeCompare(ta);
  });

  // 스트리밍 모드일 때 스크롤 상단 유지
  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [sorted.length, streaming]);

  // 좌/우 컬럼 분배
  const leftEvents = sorted.filter((_, i) => i % 2 === 0);
  const rightEvents = sorted.filter((_, i) => i % 2 === 1);

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '이벤트' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">이벤트</h2>
      </div>
      <div className="page-content">
        <div className="relative z-10 flex items-center gap-4">
          <Select
            className="page-input_item-data_select"
            options={clusterOptions}
            getOptionLabel={(o) => o.text}
            getOptionValue={(o) => o.value}
            value={cluster}
            onChange={(o: SelectSingleValue<OptionType>) => o && setCluster(o)}
          />
          <Select
            className="page-input_item-data_select"
            options={namespaceOptions}
            getOptionLabel={(o) => o.text}
            getOptionValue={(o) => o.value}
            value={namespace}
            onChange={(o: SelectSingleValue<OptionType>) => o && setNamespace(o)}
          />
          <button
            type="button"
            onClick={() => setStreaming(!streaming)}
            className={`rounded border px-3 py-2 text-sm ${
              streaming
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-[#e8e8e8] text-[#525252] hover:bg-[#f5f5f5]'
            }`}
          >
            {streaming ? '● 실시간' : '○ 일시정지'}
          </button>
          <span className="text-xs text-[#999]">
            {isPending ? '로딩 중...' : `${sorted.length}개 이벤트`}
          </span>
        </div>

        <div className={styles.eventBox}>
          <div
            ref={scrollRef}
            className={styles.palyBox}
            style={{ overflowY: 'auto' }}
          >
            {sorted.length === 0 && !isPending && (
              <div className="flex items-center justify-center py-16 text-sm text-[#999]">
                이벤트가 없습니다.
              </div>
            )}
            {sorted.length > 0 && (
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <hr className={styles.leftLine} />
                  <div className={styles.cardBoxLeftInner}>
                    {leftEvents.map((e, i) => (
                      <EventCard key={`l-${i}`} event={e} />
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className={styles.cardBoxRightInner} style={{ marginTop: 0 }}>
                    {rightEvents.map((e, i) => (
                      <div key={`r-${i}`} className={styles.cardBoxRight}>
                        {e.type === 'Warning' ? (
                          <IconEventOn className={styles.iconEventOn} />
                        ) : (
                          <IconEventOff className={styles.iconEventOff} />
                        )}
                        <div
                          className={`${styles.card} ${e.type === 'Warning' ? styles.warning : styles.normal}`}
                        >
                          <div className={styles.state}>
                            <div
                              className={`table-td-state ${e.type === 'Warning' ? 'table-td-state-warning' : 'table-td-state-run'}`}
                            >
                              {e.type}
                            </div>
                            <span>{formatTime(e.lastTimestamp ?? e.firstTimestamp)}</span>
                          </div>
                          <p>{e.involvedObject}</p>
                          <span>{e.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
