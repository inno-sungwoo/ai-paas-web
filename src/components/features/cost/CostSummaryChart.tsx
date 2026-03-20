import { LineChart } from '@innogrid/ui';
import type { CostSummary } from '@/types/monitoring';

interface CostSummaryChartProps {
  costSummary?: CostSummary;
}

export const CostSummaryChart = ({ costSummary }: CostSummaryChartProps) => {
  if (!costSummary) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#999]">데이터 없음</div>
    );
  }

  const chartData = costSummary.teams.map((team) => ({
    name: team.namespace,
    costKrw: team.costKrw,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1a1a1a]">팀별 GPU 비용</span>
        <span className="text-xs text-[#999]">
          총 비용: {costSummary.totalGpuCostKrw.toLocaleString()}원
        </span>
      </div>
      <div className="h-[300px]">
        <LineChart xDataKey="name" yDataKey={['costKrw']} data={chartData} />
      </div>
    </div>
  );
};
