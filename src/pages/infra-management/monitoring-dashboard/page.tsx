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
} from '@/hooks/service/monitoring';
import { HelmReleaseTable } from '@/components/features/monitoring/HelmReleaseTable';
import { GpuStatusTable } from '@/components/features/monitoring/GpuStatusTable';

type OptionType = { text: string; value: string };

const clusterOptions = [
  { text: 'innogrid-aikube', value: 'innogrid-aikube' },
  { text: 'innogrid-dev', value: 'innogrid-dev' },
  { text: 'innogrid-prod', value: 'innogrid-prod' },
];

interface PodRow {
  name: string;
  workflow: string;
  type: string;
  desc: string;
  date: string;
}

const columns = [
  {
    id: 'name',
    header: '이름',
    accessorFn: (row: PodRow) => row.name,
    size: 300,
  },
  {
    id: 'workflow',
    header: '워크플로우',
    accessorFn: (row: PodRow) => row.workflow,
    size: 300,
  },
  {
    id: 'type',
    header: '유형',
    accessorFn: (row: PodRow) => row.type,
    size: 285,
  },
  {
    id: 'desc',
    header: '설명',
    accessorFn: (row: PodRow) => row.desc,
    size: 334,
    enableSorting: false,
  },
  {
    id: 'date',
    header: '생성일시',
    accessorFn: (row: PodRow) => row.date,
    size: 325,
  },
];

const rowData: PodRow[] = [];

export default function MonitoringPage() {
  const { pagination, setPagination } = useTablePagination();
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);

  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { summary } = useGetMonitoringSummary(cluster);
  const { releases, isPending: releasesLoading } = useGetMonitoringReleases(cluster);
  const { alerts } = useGetMonitoringAlerts(cluster);

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
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">헬름 릴리즈</div>
            <div className="mt-1 text-2xl font-bold text-[#1a1a1a]">
              {summary?.helmReleaseCount ?? '-'}
            </div>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">GPU 수</div>
            <div className="mt-1 text-2xl font-bold text-[#1a1a1a]">{summary?.gpuCount ?? '-'}</div>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">평균 GPU 활용률</div>
            <div className="mt-1 text-2xl font-bold text-[#1a1a1a]">
              {summary?.avgGpuUtil != null ? `${summary.avgGpuUtil.toFixed(1)}%` : '-'}
            </div>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">활성 알림</div>
            <div
              className={`mt-1 text-2xl font-bold ${(summary?.activeAlertCount ?? 0) > 0 ? 'text-red-500' : 'text-[#1a1a1a]'}`}
            >
              {summary?.activeAlertCount ?? '-'}
            </div>
          </div>
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
                        value={76.68}
                        startAngle={240}
                        endAngle={-60}
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            74.68%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            2 / 16 Core
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">Request</div>
                        </div>
                      </GaugeChart>
                      <GaugeChart
                        value={12.45}
                        startAngle={240}
                        endAngle={-60}
                        color="green"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            12.45%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            2 / 16 Core
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">Limit</div>
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
                        value={32.78}
                        startAngle={240}
                        endAngle={-60}
                        color="yellow"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            32.78%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            2 / 16 Core
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">Request</div>
                        </div>
                      </GaugeChart>
                      <GaugeChart
                        value={32.78}
                        startAngle={240}
                        endAngle={-60}
                        color="yellow"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            32.78%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            2 / 16 Core
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">Limit</div>
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
                        value={12.45}
                        startAngle={240}
                        endAngle={-60}
                        color="green"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            12.45%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            2 / 16 Core
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">Request</div>
                        </div>
                      </GaugeChart>
                      <GaugeChart
                        value={32.78}
                        startAngle={240}
                        endAngle={-60}
                        color="yellow"
                        className="size-[176px]"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute top-[35%] text-2xl font-bold text-[#1a1a1a]">
                            32.78%
                          </div>
                          <div className="absolute top-[52%] mt-2 font-[13px] text-[#1a1a1a]">
                            2 / 16 Core
                          </div>
                          <div className="absolute top-[72%] mt-6 text-xs text-[#999]">Limit</div>
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
                  <GaugeChart
                    value={100.0}
                    startAngle={90}
                    endAngle={-270}
                    color="blue"
                    className="size-[176px]"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">CPU</div>
                      <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                        100.00%
                      </div>
                      <div className="absolute top-[50%] mt-6 text-xs text-[#999]">
                        34.8 of 104.94 GiB
                      </div>
                    </div>
                  </GaugeChart>
                  <GaugeChart
                    value={64.92}
                    startAngle={90}
                    endAngle={-270}
                    color="blue"
                    className="size-[176px]"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">
                        메모리
                      </div>
                      <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                        64.92%
                      </div>
                      <div className="absolute top-[50%] mt-6 text-xs text-[#999]">
                        34.8 of 104.94 GiB
                      </div>
                    </div>
                  </GaugeChart>
                  <GaugeChart
                    value={12.82}
                    startAngle={90}
                    endAngle={-270}
                    color="blue"
                    className="size-[176px]"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">
                        파일 시스템
                      </div>
                      <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                        12.82%
                      </div>
                      <div className="absolute top-[50%] mt-6 text-xs text-[#999]">
                        34.8 of 104.94 GiB
                      </div>
                    </div>
                  </GaugeChart>
                  <GaugeChart
                    value={39.25}
                    startAngle={90}
                    endAngle={-270}
                    color="blue"
                    className="size-[176px]"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">
                        영구 볼륨
                      </div>
                      <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                        39.25%
                      </div>
                      <div className="absolute top-[50%] mt-6 text-xs text-[#999]">
                        34.8 of 104.94 GiB
                      </div>
                    </div>
                  </GaugeChart>
                  <GaugeChart
                    value={64.92}
                    startAngle={90}
                    endAngle={-270}
                    color="blue"
                    className="size-[176px]"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">파드</div>
                      <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                        64.92%
                      </div>
                      <div className="absolute top-[50%] mt-6 text-xs text-[#999]">
                        34.8 of 104.94
                      </div>
                    </div>
                  </GaugeChart>
                  <GaugeChart
                    value={39.25}
                    startAngle={90}
                    endAngle={-270}
                    color="blue"
                    className="size-[176px]"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="absolute top-[18%] mt-2 font-[13px] text-[#1a1a1a]">GPU</div>
                      <div className="absolute top-[38%] text-2xl font-bold text-[#1a1a1a]">
                        39.25%
                      </div>
                      <div className="absolute top-[50%] mt-6 text-xs text-[#999]">
                        34.8 of 104.94
                      </div>
                    </div>
                  </GaugeChart>
                </div>
              </div>
            </div>
          </div>
          <div className="page-detail-round-box page-flex-1">
            <div className="page-detail-round-name">파드</div>
            <div className="page-detail-round-data">
              <div className={styles.symbolBox}>
                <IconHexagon />
                <em>38</em>
              </div>
              <div className="page-h-240">
                <Table
                  columns={columns}
                  data={rowData}
                  totalCount={rowData.length}
                  pagination={pagination}
                  setPagination={setPagination}
                />
              </div>
            </div>
          </div>
          <div className="page-detail-round-box page-flex-1">
            <div className="page-detail-round-name">성능 지표</div>
            <div className="page-detail-round-data">
              <div className="page-content-detail-row2">
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">CPU</div>
                  <div className="page-detail-round-data page-h-548 page-p-24">
                    <LineChart
                      xDataKey="name"
                      yDataKey={['workflow1']}
                      data={[
                        {
                          name: '2022.04.12',
                          workflow1: 120,
                        },
                        {
                          name: '24',
                          workflow1: 162,
                        },
                        {
                          name: '25',
                          workflow1: 118,
                        },
                        {
                          name: '26',
                          workflow1: 131,
                        },
                        {
                          name: '27',
                          workflow1: 85,
                        },
                        {
                          name: '2022.04.28',
                          workflow1: 81,
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="page-detail-round-box page-detail-round-color page-flex-1 page-mt-0">
                  <div className="page-detail-round-name">CPU load average</div>
                  <div className="page-detail-round-data page-h-548 page-p-24">
                    <LineChart
                      xDataKey="name"
                      yDataKey={['workflow1']}
                      data={[
                        {
                          name: '2022.04.12',
                          workflow1: 120,
                        },
                        {
                          name: '24',
                          workflow1: 162,
                        },
                        {
                          name: '25',
                          workflow1: 118,
                        },
                        {
                          name: '26',
                          workflow1: 131,
                        },
                        {
                          name: '27',
                          workflow1: 85,
                        },
                        {
                          name: '2022.04.28',
                          workflow1: 81,
                        },
                      ]}
                    />
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
