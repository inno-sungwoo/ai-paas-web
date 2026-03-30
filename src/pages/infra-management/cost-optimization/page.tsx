import { useState } from 'react';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetCostSummary, useGetIdleWarnings, useGetCostReport } from '@/hooks/service/cost';
import { useGetMonitoringSummary } from '@/hooks/service/monitoring';
import { IdleWarningBanner } from '@/components/features/cost/IdleWarningBanner';
import { CostSummaryChart } from '@/components/features/cost/CostSummaryChart';
import { UsageReportTable } from '@/components/features/cost/UsageReportTable';
import { DeploymentEstimateModal } from '@/components/features/cost/DeploymentEstimateModal';
import { GpuOverrunBanner } from '@/components/features/cost/GpuOverrunBanner';
import { SkeletonCard } from '@/components/ui/skeleton';

type OptionType = { text: string; value: string };

const clusterOptions = [{ text: 'innogrid-aikube', value: 'innogrid-aikube' }];

export default function CostOptimizationPage() {
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);
  const [estimateOpen, setEstimateOpen] = useState(false);

  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { costSummary, isPending: summaryLoading } = useGetCostSummary(cluster);
  const { idleWarnings } = useGetIdleWarnings(cluster);
  const { costReport, isPending: reportLoading } = useGetCostReport(cluster);
  const { summary: monitoringSummary } = useGetMonitoringSummary(cluster);

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

  // 요약 데이터 계산 — 클러스터 전체 실제 데이터 기준
  const dailyCost = costSummary?.totalGpuCostKrw ?? 0;
  const monthlyCost = dailyCost * 30;
  const totalGpuRequested = costSummary?.teams.reduce((sum, t) => sum + t.gpuCount, 0) ?? 0;
  const gpuCapacity = monitoringSummary?.gpuCount ?? 4; // GPU 현황 (mock: 4x RTX 3060)
  const gpuUtil = monitoringSummary?.avgGpuUtil ?? 0;

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '비용 최적화' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">비용 최적화</h2>
      </div>
      <div className="page-content">
        <div className="flex items-center justify-between">
          <Select
            className="page-input_item-data_select"
            options={clusterOptions}
            getOptionLabel={(option) => option.text}
            getOptionValue={(option) => option.value}
            value={selectedValue}
            onChange={onChangeSelect}
          />
          <button
            type="button"
            onClick={() => setEstimateOpen(true)}
            className="rounded bg-[#1a1a1a] px-4 py-2 text-sm text-white hover:bg-[#333]"
          >
            배포 비용 추정
          </button>
        </div>

        {/* 요약 카드 4개 */}
        <div className="page-mt-16 flex gap-4">
          {summaryLoading ? (
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
                    <circle cx="10" cy="10" r="7" stroke="#3b82f6" strokeWidth="2" fill="none" />
                    <path
                      d="M10 6v4.5l3 1.5"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">일 비용</div>
                  <div className="mt-0.5 text-2xl font-bold text-[#1a1a1a]">
                    {dailyCost.toLocaleString()}원
                  </div>
                  <div className="text-xs text-[#999]">/일</div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="8" width="3" height="9" rx="1" fill="#a855f7" />
                    <rect x="8.5" y="5" width="3" height="12" rx="1" fill="#a855f7" opacity="0.7" />
                    <rect x="14" y="3" width="3" height="14" rx="1" fill="#a855f7" opacity="0.4" />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">월 예상 비용</div>
                  <div className="mt-0.5 text-2xl font-bold text-[#1a1a1a]">
                    {monthlyCost >= 10000
                      ? `${(monthlyCost / 10000).toFixed(0)}만원`
                      : `${monthlyCost.toLocaleString()}원`}
                  </div>
                  <div className="text-xs text-[#999]">/월</div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${totalGpuRequested > gpuCapacity ? 'bg-red-50' : 'bg-green-50'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="2"
                      y="6"
                      width="16"
                      height="10"
                      rx="2"
                      fill={totalGpuRequested > gpuCapacity ? '#ef4444' : '#22c55e'}
                    />
                    <rect
                      x="5"
                      y="3"
                      width="10"
                      height="4"
                      rx="1"
                      fill={totalGpuRequested > gpuCapacity ? '#ef4444' : '#22c55e'}
                      opacity="0.5"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">GPU 사용</div>
                  <div
                    className={`mt-0.5 text-2xl font-bold ${totalGpuRequested > gpuCapacity ? 'text-red-500' : 'text-[#1a1a1a]'}`}
                  >
                    {totalGpuRequested}/{gpuCapacity}개
                  </div>
                  <div className="text-xs text-[#999]">
                    {totalGpuRequested > gpuCapacity ? '초과 할당' : '할당 / 보유'}
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e8e8e8] bg-white p-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${gpuUtil >= 50 ? 'bg-green-50' : gpuUtil > 0 ? 'bg-yellow-50' : 'bg-[#f5f5f5]'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2l2.5 5.5L18 8.5l-4 4 1 5.5L10 15.5 5 18l1-5.5-4-4 5.5-1L10 2z"
                      fill={gpuUtil >= 50 ? '#22c55e' : gpuUtil > 0 ? '#eab308' : '#999'}
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs text-[#999]">현재 활용률</div>
                  <div
                    className={`mt-0.5 text-2xl font-bold ${gpuUtil >= 50 ? 'text-[#1a1a1a]' : gpuUtil > 0 ? 'text-yellow-500' : 'text-[#999]'}`}
                  >
                    {monitoringSummary ? `${gpuUtil.toFixed(1)}%` : '-'}
                  </div>
                  <div className="text-xs text-[#999]">실시간</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="page-mt-16">
          <GpuOverrunBanner />
        </div>

        <div className="page-mt-16">
          <IdleWarningBanner warnings={idleWarnings} />
        </div>

        {/* 네임스페이스별 비용 차트 */}
        <div className="page-detail-round-box page-mt-16">
          <div className="page-detail-round-name">네임스페이스별 GPU 비용 (일 기준)</div>
          <div className="page-detail-round-data page-p-24">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-[#999]">
                로딩 중...
              </div>
            ) : (
              <CostSummaryChart costSummary={costSummary} />
            )}
          </div>
        </div>

        {/* 7일 사용 보고서 */}
        <div className="page-detail-round-box page-mt-16">
          <div className="page-detail-round-name">
            7일 사용 보고서{' '}
            {costReport?.period && (
              <span className="text-xs font-normal text-[#999]">({costReport.period})</span>
            )}
          </div>
          <div className="page-detail-round-data">
            <UsageReportTable entries={costReport?.entries ?? []} isPending={reportLoading} />
          </div>
        </div>
      </div>

      {estimateOpen && <DeploymentEstimateModal onClose={() => setEstimateOpen(false)} />}
    </main>
  );
}
