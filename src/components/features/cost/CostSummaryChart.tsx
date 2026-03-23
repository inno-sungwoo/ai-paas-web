import { HorizontalBarChart } from '@innogrid/ui';
import type { CostSummary } from '@/types/monitoring';

interface CostSummaryChartProps {
  costSummary?: CostSummary;
}

export const CostSummaryChart = ({ costSummary }: CostSummaryChartProps) => {
  if (!costSummary || costSummary.teams.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#999]">데이터 없음</div>
    );
  }

  const chartData = costSummary.teams.map((team) => ({
    name: `${team.namespace} (GPU ${team.gpuCount}개)`,
    costKrw: team.costKrw,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-[#999]">
          총 비용: {costSummary.totalGpuCostKrw.toLocaleString()}원/일
        </span>
      </div>
      <div className="h-[200px]">
        <HorizontalBarChart
          xDataKey={['costKrw']}
          yDataKey="name"
          data={chartData}
          customizedXTick={(v) => `${Number(v).toLocaleString()}원`}
          colors={['#2563eb']}
          maxBarSize={32}
        />
      </div>
    </div>
  );
};
