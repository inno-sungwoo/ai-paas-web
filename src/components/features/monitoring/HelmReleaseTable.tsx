import { Table, Badge, useTablePagination } from '@innogrid/ui';
import type { ReleaseInfo } from '@/types/monitoring';

interface HelmReleaseTableProps {
  releases: ReleaseInfo[];
  isPending: boolean;
  onDelete?: (release: ReleaseInfo) => void;
  deletingNames?: Set<string>;
}

const baseColumns = [
  { id: 'name', header: '릴리즈', accessorFn: (row: ReleaseInfo) => row.name, size: 250 },
  {
    id: 'namespace',
    header: '네임스페이스',
    accessorFn: (row: ReleaseInfo) => row.namespace,
    size: 160,
  },
  { id: 'status', header: '상태', accessorFn: (row: ReleaseInfo) => row.status, size: 90 },
  { id: 'chart', header: '차트', accessorFn: (row: ReleaseInfo) => row.chart, size: 200 },
  {
    id: 'chartVersion',
    header: '버전',
    accessorFn: (row: ReleaseInfo) => row.chartVersion,
    size: 100,
  },
  {
    id: 'updated',
    header: '업데이트',
    accessorFn: (row: ReleaseInfo) => row.updated,
    size: 170,
  },
  {
    id: 'gpu',
    header: 'GPU',
    accessorFn: (row: ReleaseInfo) => row.chart,
    size: 80,
    cell: ({ row }: { row: { original: ReleaseInfo } }) => {
      const r = row.original;
      const isGpuChart =
        r.chart &&
        (r.chart.includes('gpu') ||
          r.chart.includes('ollama') ||
          r.chart.includes('vllm') ||
          r.chart.includes('triton') ||
          (r.chart.includes('jupyter') && r.chart.includes('gpu')));
      if (isGpuChart) {
        return (
          <Badge color="info" variant="soft" size="small">
            사용 중
          </Badge>
        );
      }
      return <span className="text-[#999]">-</span>;
    },
  },
];

export const HelmReleaseTable = ({
  releases,
  isPending,
  onDelete,
  deletingNames,
}: HelmReleaseTableProps) => {
  const { pagination, setPagination } = useTablePagination();

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e8e8e8] border-t-blue-500" />
        <span className="text-sm text-[#999]">릴리즈 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#999]">
        <svg width="40" height="40" viewBox="0 0 20 20" fill="none">
          <path d="M4 4h12v12H4V4zm2 2v8h8V6H6z" fill="#e8e8e8" />
        </svg>
        <span className="text-sm">배포된 릴리즈가 없습니다</span>
      </div>
    );
  }

  const columns = onDelete
    ? [
        ...baseColumns,
        {
          id: 'actions',
          header: '삭제',
          size: 70,
          enableSorting: false,
          cell: ({ row }: { row: { original: ReleaseInfo } }) => {
            const isDeleting = deletingNames?.has(row.original.name);
            if (isDeleting) {
              return (
                <Badge color="warning" variant="soft" size="small">
                  삭제 중…
                </Badge>
              );
            }
            return (
              <Badge
                color="error"
                variant="soft"
                size="small"
                style={{ cursor: 'pointer' }}
                onClick={() => onDelete(row.original)}
              >
                삭제
              </Badge>
            );
          },
        },
      ]
    : baseColumns;

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
