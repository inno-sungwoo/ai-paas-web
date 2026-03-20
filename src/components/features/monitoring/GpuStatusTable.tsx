import { Table, useTablePagination } from '@innogrid/ui';
import type { ReleaseStatus } from '@/types/monitoring';

interface GpuStatusTableProps {
  releases: ReleaseStatus[];
  isPending: boolean;
}

const columns = [
  {
    id: 'name',
    header: '서비스',
    accessorFn: (row: ReleaseStatus) => row.name,
    size: 200,
  },
  {
    id: 'gpuName',
    header: 'GPU',
    accessorFn: (row: ReleaseStatus) => row.gpuName ?? '-',
    size: 180,
  },
  {
    id: 'gpuUtil',
    header: '활용률(%)',
    accessorFn: (row: ReleaseStatus) =>
      row.gpuUtil != null ? `${row.gpuUtil.toFixed(1)}%` : '-',
    size: 120,
    cell: ({ row }: { row: { original: ReleaseStatus } }) => {
      const val = row.original.gpuUtil;
      if (val == null) return '-';
      const isLow = val < 20;
      return (
        <span className={isLow ? 'font-semibold text-yellow-600' : ''}>
          {val.toFixed(1)}%{isLow ? ' (낮음)' : ''}
        </span>
      );
    },
  },
  {
    id: 'gpuTemp',
    header: '온도',
    accessorFn: (row: ReleaseStatus) =>
      row.gpuTemp != null ? `${row.gpuTemp}°C` : '-',
    size: 100,
  },
  {
    id: 'gpuPowerWatt',
    header: '전력(W)',
    accessorFn: (row: ReleaseStatus) =>
      row.gpuPowerWatt != null ? `${row.gpuPowerWatt}W` : '-',
    size: 100,
  },
  {
    id: 'vram',
    header: 'VRAM',
    accessorFn: (row: ReleaseStatus) => {
      if (row.vramUsedMb != null && row.vramTotalMb != null) {
        return `${row.vramUsedMb} / ${row.vramTotalMb} MB`;
      }
      return '-';
    },
    size: 160,
  },
];

export const GpuStatusTable = ({ releases, isPending }: GpuStatusTableProps) => {
  const { pagination, setPagination } = useTablePagination();
  const gpuReleases = releases.filter((r) => r.gpuUtil != null || r.gpuName);

  if (isPending) {
    return <div className="flex items-center justify-center py-8 text-sm text-[#999]">로딩 중...</div>;
  }

  if (gpuReleases.length === 0) {
    return <div className="flex items-center justify-center py-8 text-sm text-[#999]">GPU 데이터가 없습니다.</div>;
  }

  return (
    <Table
      columns={columns}
      data={gpuReleases}
      totalCount={gpuReleases.length}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
};
