import { useState } from 'react';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetCostSummary, useGetIdleWarnings, useGetCostReport } from '@/hooks/service/cost';
import { useGetMonitoringSummary } from '@/hooks/service/monitoring';
import { IdleWarningBanner } from '@/components/features/cost/IdleWarningBanner';
import { CostSummaryChart } from '@/components/features/cost/CostSummaryChart';
import { UsageReportTable } from '@/components/features/cost/UsageReportTable';
import { DeploymentEstimateModal } from '@/components/features/cost/DeploymentEstimateModal';

type OptionType = { text: string; value: string };

const clusterOptions = [
  { text: 'innogrid-aikube', value: 'innogrid-aikube' },
  { text: 'innogrid-dev', value: 'innogrid-dev' },
  { text: 'innogrid-prod', value: 'innogrid-prod' },
];

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

  // 요약 데이터 계산
  const dailyCost = costSummary?.totalGpuCostKrw ?? 0;
  const monthlyCost = dailyCost * 30;
  // ai-pass3 네임스페이스의 GPU 사용만 표시 (우리 과제 범위)
  const aiPass3Gpu = costSummary?.teams.find((t) => t.namespace === 'ai-pass3')?.gpuCount ?? 0;
  const gpuQuotaLimit = 4; // ResourceQuota 제한
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
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">일 비용</div>
            <div className="mt-1 text-2xl font-bold text-[#1a1a1a]">
              {summaryLoading ? '-' : `${dailyCost.toLocaleString()}원`}
            </div>
            <div className="mt-0.5 text-xs text-[#999]">/일</div>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">월 예상 비용</div>
            <div className="mt-1 text-2xl font-bold text-[#1a1a1a]">
              {summaryLoading
                ? '-'
                : monthlyCost >= 10000
                  ? `${(monthlyCost / 10000).toFixed(0)}만원`
                  : `${monthlyCost.toLocaleString()}원`}
            </div>
            <div className="mt-0.5 text-xs text-[#999]">/월</div>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">GPU 사용 (ai-pass3)</div>
            <div className="mt-1 text-2xl font-bold text-[#1a1a1a]">
              {summaryLoading ? '-' : `${aiPass3Gpu}/${gpuQuotaLimit}개`}
            </div>
            <div className="mt-0.5 text-xs text-[#999]">할당 / Quota 제한</div>
          </div>
          <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
            <div className="text-xs text-[#999]">현재 활용률</div>
            <div
              className={`mt-1 text-2xl font-bold ${gpuUtil >= 50 ? 'text-[#1a1a1a]' : gpuUtil > 0 ? 'text-yellow-500' : 'text-[#999]'}`}
            >
              {monitoringSummary ? `${gpuUtil.toFixed(1)}%` : '-'}
            </div>
            <div className="mt-0.5 text-xs text-[#999]">실시간</div>
          </div>
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
