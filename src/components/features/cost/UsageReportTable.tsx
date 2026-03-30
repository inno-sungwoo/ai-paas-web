import { Table, Badge, useTablePagination } from '@innogrid/ui';
import type { DailyEntry } from '@/types/monitoring';

interface UsageReportTableProps {
  entries: DailyEntry[];
  isPending: boolean;
}

export const UsageReportTable = ({ entries, isPending }: UsageReportTableProps) => {
  const { pagination, setPagination } = useTablePagination();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#999]">로딩 중...</div>
    );
  }

  const columns = [
    { id: 'date', header: '날짜', accessorFn: (row: DailyEntry) => row.date, size: 110 },
    {
      id: 'namespace',
      header: '네임스페이스',
      accessorFn: (row: DailyEntry) => row.namespace,
      size: 140,
    },
    {
      id: 'avgGpuUtil',
      header: 'GPU 활용률',
      accessorFn: (row: DailyEntry) => `${row.avgGpuUtil.toFixed(1)}%`,
      size: 110,
    },
    {
      id: 'costKrw',
      header: '일 비용(원)',
      accessorFn: (row: DailyEntry) => row.costKrw.toLocaleString(),
      size: 120,
    },
    {
      id: 'monthlyCost',
      header: '월 환산(원)',
      accessorFn: (row: DailyEntry) => (row.costKrw * 30).toLocaleString(),
      size: 130,
    },
    {
      id: 'verdict',
      header: '판단',
      accessorFn: (row: DailyEntry) => (row.avgGpuUtil >= 30 ? 'normal' : 'warning'),
      size: 110,
      cell: ({ row }: { row: { original: DailyEntry } }) => {
        const util = row.original.avgGpuUtil;
        if (util >= 70) {
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
              미사용
            </Badge>
          );
        }
      },
    },
    {
      id: 'action',
      header: '조치',
      size: 120,
      enableSorting: false,
      cell: ({ row }: { row: { original: DailyEntry } }) => {
        const util = row.original.avgGpuUtil;
        if (util > 0 && util < 70) {
          return (
            <Badge
              color={util < 20 ? 'error' : 'warning'}
              variant="soft"
              size="small"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                window.location.href = '/infra-management/application/helm-release';
              }}
            >
              릴리즈 정리 →
            </Badge>
          );
        }
        return <span className="text-[#999]">-</span>;
      },
    },
  ];

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
