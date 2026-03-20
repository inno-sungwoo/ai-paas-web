import { Table, useTablePagination } from '@innogrid/ui';
import type { ReleaseStatus } from '@/types/monitoring';

interface HelmReleaseTableProps {
  releases: ReleaseStatus[];
  isPending: boolean;
}

const columns = [
  { id: 'name', header: '릴리즈', accessorFn: (row: ReleaseStatus) => row.name, size: 200 },
  { id: 'namespace', header: '네임스페이스', accessorFn: (row: ReleaseStatus) => row.namespace, size: 150 },
  { id: 'status', header: '상태', accessorFn: (row: ReleaseStatus) => row.status, size: 100 },
  { id: 'chart', header: '차트', accessorFn: (row: ReleaseStatus) => row.chart, size: 150 },
  { id: 'chartVersion', header: '버전', accessorFn: (row: ReleaseStatus) => row.chartVersion, size: 100 },
  { id: 'updated', header: '업데이트', accessorFn: (row: ReleaseStatus) => row.updated, size: 180 },
  {
    id: 'gpuUtil',
    header: 'GPU 활용률(%)',
    accessorFn: (row: ReleaseStatus) => (row.gpuUtil != null ? `${row.gpuUtil.toFixed(1)}%` : '-'),
    size: 130,
  },
];

export const HelmReleaseTable = ({ releases, isPending }: HelmReleaseTableProps) => {
  const { pagination, setPagination } = useTablePagination();

  if (isPending) {
    return <div className="flex items-center justify-center py-8 text-sm text-[#999]">로딩 중...</div>;
  }

  return (
    <Table
      columns={columns}
      data={releases}
      totalCount={releases.length}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
};
