import { Table, Badge, useTablePagination } from '@innogrid/ui';
import type { DailyEntry } from '@/types/monitoring';

interface UsageReportTableProps {
  entries: DailyEntry[];
  isPending: boolean;
}

const columns = [
  { id: 'date', header: '날짜', accessorFn: (row: DailyEntry) => row.date, size: 150 },
  {
    id: 'namespace',
    header: '네임스페이스',
    accessorFn: (row: DailyEntry) => row.namespace,
    size: 200,
  },
  {
    id: 'avgGpuUtil',
    header: '평균 GPU 활용률(%)',
    accessorFn: (row: DailyEntry) => `${row.avgGpuUtil.toFixed(1)}%`,
    size: 180,
  },
  {
    id: 'costKrw',
    header: '비용(원)',
    accessorFn: (row: DailyEntry) => row.costKrw.toLocaleString(),
    size: 150,
  },
  {
    id: 'verdict',
    header: '판단',
    accessorFn: (row: DailyEntry) => (row.avgGpuUtil >= 30 ? 'normal' : 'warning'),
    size: 120,
    cell: ({ row }: { row: { original: DailyEntry } }) => {
      const util = row.original.avgGpuUtil;
      if (util >= 50) {
        return (
          <Badge color="success" variant="soft" size="small">
            정상 사용
          </Badge>
        );
      } else if (util >= 20) {
        return (
          <Badge color="warning" variant="soft" size="small">
            활용률 낮음
          </Badge>
        );
      } else if (util > 0) {
        return (
          <Badge color="error" variant="soft" size="small">
            종료 권고
          </Badge>
        );
      } else {
        return (
          <Badge color="stopped" variant="soft" size="small">
            사용하지 않음
          </Badge>
        );
      }
    },
  },
];

export const UsageReportTable = ({ entries, isPending }: UsageReportTableProps) => {
  const { pagination, setPagination } = useTablePagination();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#999]">로딩 중...</div>
    );
  }

  return (
    <Table
      columns={columns}
      data={entries}
      totalCount={entries.length}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
};
