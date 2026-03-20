import { useState } from 'react';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetCostSummary, useGetIdleWarnings, useGetCostReport } from '@/hooks/service/cost';
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

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

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

        <div className="page-mt-16">
          <IdleWarningBanner warnings={idleWarnings} />
        </div>

        <div className="page-content-detail-col2 page-mt-16">
          <div className="page-detail-round-box page-flex-1 page-mt-0">
            <div className="page-detail-round-name">비용 요약</div>
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
        </div>

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
