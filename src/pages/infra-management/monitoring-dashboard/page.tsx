// monitoring-dashboard page
import { useState } from 'react';
import {
  BreadCrumb,
  LineChart,
  Select,
  Table,
  useTablePagination,
  type SelectSingleValue,
} from '@innogrid/ui';
import { IconHexagon } from '../../../assets/img/icon';
import styles from '../inframonitor.module.scss';
import { GaugeChart } from '@/components/ui/gauge-chart';
import {
  useGetMonitoringSummary,
  useGetMonitoringReleases,
  useGetMonitoringAlerts,
  useGetNodeResourceUsage,
  useGetPerformanceMetrics,
  useGetPodsByNamespace,
} from '@/hooks/service/monitoring';
import { HelmReleaseTable } from '@/components/features/monitoring/HelmReleaseTable';
import { GpuStatusTable } from '@/components/features/monitoring/GpuStatusTable';
import { SkeletonCard } from '@/components/ui/skeleton';

type OptionType = { text: string; value: string };

const clusterOptions = [{ text: 'innogrid-aikube', value: 'innogrid-aikube' }];

interface PodNsRow {
  namespace: string;
  count: number;
}

const podColumns = [
  {
    id: 'namespace',
    header: '네임스페이스',
    accessorFn: (row: PodNsRow) => row.namespace,
    size: 400,
  },
  {
    id: 'count',
    header: 'Pod 수',
    accessorFn: (row: PodNsRow) => row.count,
    size: 200,
    cell: ({ row }: { row: { original: PodNsRow } }) => (
      <span className="font-semibold">{row.original.count}</span>
    ),
  },
];

export default function MonitoringPage() {
  const { pagination, setPagination } = useTablePagination();
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);

  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { summary } = useGetMonitoringSummary(cluster);
  const { releases, isPending: releasesLoading } = useGetMonitoringReleases(cluster);
  const { alerts } = useGetMonitoringAlerts(cluster);
  const { nodeResource } = useGetNodeResourceUsage(cluster);
  const { performance } = useGetPerformanceMetrics(cluster);
  const { pods: podData } = useGetPodsByNamespace(cluster);

  const cpuUtil = nodeResource?.cpuUtil ?? 0;
  const memUtil = nodeResource?.memoryUtil ?? 0;
  const fsUtil = nodeResource?.filesystemUtil ?? 0;
  const gpuUtil = summary?.avgGpuUtil ?? 0;
  const gpuCount = summary?.gpuCount ?? 0;
  const podUtil = nodeResource?.podCount
    ? (nodeResource.podCount / nodeResource.podCapacity) * 100
    : 0;

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '모니터링 대시보드' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">모니터링 대시보드</h2>
      </div>
      <div className="page-content">
        <Select
          className="page-input_item-data_select"
          options={clusterOptions}
          getOptionLabel={(option) => option.text}
          getOptionValue={(option) => option.value}
          value={selectedValue}
          onChange={onChangeSelect}
        />

        {/* Summary Cards */}
        <div className="page-mt-16 flex gap-4">
          {!summary ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                      fill="#3b82f6"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">헬름 릴리즈</div>
                  <div className="mt-0.5 text-2xl font-bold text-[#1a1a1a]">
                    {summary.helmReleaseCount}
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="6" width="16" height="10" rx="2" fill="#22c55e" />
                    <rect x="5" y="3" width="10" height="4" rx="1" fill="#22c55e" opacity="0.5" />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">GPU 수</div>
                  <div className="mt-0.5 text-2xl font-bold text-[#1a1a1a]">{summary.gpuCount}</div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2l2.5 5.5L18 8.5l-4 4 1 5.5L10 15.5 5 18l1-5.5-4-4 5.5-1L10 2z"
                      fill="#eab308"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">평균 GPU 활용률</div>
                  <div className="mt-0.5 text-2xl font-bold text-[#1a1a1a]">
                    {summary.avgGpuUtil.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${summary.activeAlertCount > 0 ? 'bg-red-50' : 'bg-[#f5f5f5]'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2a1 1 0 01.894.553l7 14A1 1 0 0117 18H3a1 1 0 01-.894-1.447l7-14A1 1 0 0110 2zm0 5a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      fill={summary.activeAlertCount > 0 ? '#ef4444' : '#999'}
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">활성 알림</div>
                  <div
                    className={`mt-0.5 text-2xl font-bold ${summary.activeAlertCount > 0 ? 'text-red-500' : 'text-[#1a1a1a]'}`}
                  >
                    {summary.activeAlertCount}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="page-content-detail-col2 page-mt-16">
          <div className="page-detail-round-box page-flex-1 page-mt-0">
            <div className="page-detail-round-name">리소스 요청 및 제한</div>
            <div className="page-detail-round-data">
              <div className="page-content-detail-row2">
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">CPU</div>
                  <div className="page-detail-round-data page-h-216">
                    <div className={styles.chartRow}>
                      <GaugeChart
                        value={cpuUtil}
                        startAngle={240}
                        endAngle={-60}
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            {cpuUtil.toFixed(1)}%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            사용률
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">실시간</div>
                        </div>
                      </GaugeChart>
                    </div>
                  </div>
                </div>
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">Memory</div>
                  <div className="page-detail-round-data page-h-216">
                    <div className={styles.chartRow}>
                      <GaugeChart
                        value={memUtil}
                        startAngle={240}
                        endAngle={-60}
                        color="yellow"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            {memUtil.toFixed(1)}%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            사용률
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">실시간</div>
                        </div>
                      </GaugeChart>
                    </div>
                  </div>
                </div>
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">GPU</div>
                  <div className="page-detail-round-data page-h-216">
                    <div className={styles.chartRow}>
                      <GaugeChart
                        value={gpuUtil}
                        startAngle={240}
                        endAngle={-60}
                        color="green"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            {gpuUtil.toFixed(1)}%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            {gpuCount}개 GPU
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">
                            평균 활용률
                          </div>
                        </div>
                      </GaugeChart>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="page-detail-round-box page-flex-1">
            <div className="page-detail-round-name">리소스 현황</div>
            <div className="page-detail-round-data">
              <div className="page-content-detail-row2">
                <div className={styles.chartRow}>
                  {[
                    { label: 'CPU', value: cpuUtil, color: 'blue' as const },
                    { label: '메모리', value: memUtil, color: 'blue' as const },
                    { label: '파일 시스템', value: fsUtil, color: 'blue' as const },
                    { label: '파드', value: podUtil, color: 'blue' as const },
                    { label: 'GPU', value: gpuUtil, color: 'green' as const },
                  ].map((item) => (
                    <GaugeChart
                      key={item.label}
                      value={item.value}
                      startAngle={90}
                      endAngle={-270}
                      color={item.color}
                      className="size-[176px]"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">
                          {item.label}
                        </div>
                        <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                          {item.value.toFixed(1)}%
                        </div>
                      </div>
                    </GaugeChart>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="page-detail-round-box page-flex-1">
            <div className="page-detail-round-name">파드</div>
            <div className="page-detail-round-data">
              <div className={styles.symbolBox}>
                <IconHexagon />
                <em>{podData.reduce((sum, p) => sum + p.count, 0)}</em>
              </div>
              <div className="page-h-240">
                <Table
                  columns={podColumns}
                  data={podData}
                  totalCount={podData.length}
                  pagination={pagination}
                  setPagination={setPagination}
                />
              </div>
            </div>
          </div>
          <div className="page-detail-round-box page-flex-1">
            <div className="page-detail-round-name">성능 지표 (최근 1시간)</div>
            <div className="page-detail-round-data">
              <div className="page-content-detail-row2">
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">CPU 사용량 (코어)</div>
                  <div className="page-detail-round-data page-h-548 page-p-24">
                    {performance?.cpuUsage && performance.cpuUsage.length > 0 ? (
                      <LineChart
                        xDataKey="name"
                        yDataKey={['value']}
                        data={performance.cpuUsage.map((p) => ({
                          name: p.time,
                          value: p.value,
                        }))}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#999]">
                        데이터 수집 중...
                      </div>
                    )}
                  </div>
                </div>
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">CPU Load Average (5m)</div>
                  <div className="page-detail-round-data page-h-548 page-p-24">
                    {performance?.cpuLoad && performance.cpuLoad.length > 0 ? (
                      <LineChart
                        xDataKey="name"
                        yDataKey={['value']}
                        data={performance.cpuLoad.map((p) => ({
                          name: p.time,
                          value: p.value,
                        }))}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#999]">
                        데이터 수집 중...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GPU Status */}
        <div className="page-detail-round-box page-mt-16">
          <div className="page-detail-round-name">GPU 현황</div>
          <div className="page-detail-round-data">
            <GpuStatusTable cluster={cluster} />
          </div>
        </div>

        {/* Helm Releases */}
        <div className="page-detail-round-box page-mt-16">
          <div className="page-detail-round-name">헬름 릴리즈 현황</div>
          <div className="page-detail-round-data">
            <HelmReleaseTable releases={releases} isPending={releasesLoading} />
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="page-detail-round-box page-mt-16">
            <div className="page-detail-round-name">활성 알림</div>
            <div className="page-detail-round-data">
              <div className="flex flex-col gap-2 p-4">
                {alerts.map((alert) => (
                  <div
                    key={`${alert.alertName}-${alert.namespace}-${alert.startsAt}`}
                    className={`flex items-start gap-3 rounded-md border p-3 ${
                      alert.severity === 'critical'
                        ? 'border-red-200 bg-red-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1a1a1a]">
                          {alert.alertName}
                        </span>
                        <span className="text-xs text-[#999]">{alert.namespace}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#525252]">{alert.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[#999]">{alert.startsAt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
