import { Table, useTablePagination } from '@innogrid/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface GpuCard {
  uuid: string;
  name: string;
  driverVersion: string;
  utilization: number;
  memoryUtilization: number;
  temperature: number;
  powerDraw: number;
  vramUsedMb: number;
  vramTotalMb: number;
  fanSpeed: number;
}

const columns = [
  {
    id: 'name',
    header: 'GPU 모델',
    accessorFn: (row: GpuCard) => row.name,
    size: 220,
  },
  {
    id: 'utilization',
    header: '활용률',
    accessorFn: (row: GpuCard) => `${row.utilization.toFixed(1)}%`,
    size: 100,
    cell: ({ row }: { row: { original: GpuCard } }) => {
      const val = row.original.utilization;
      const isLow = val < 20;
      return (
        <span className={isLow ? 'font-semibold text-yellow-600' : ''}>
          {val.toFixed(1)}%{isLow ? ' (낮음)' : ''}
        </span>
      );
    },
  },
  {
    id: 'temperature',
    header: '온도',
    accessorFn: (row: GpuCard) => `${row.temperature}°C`,
    size: 80,
  },
  {
    id: 'powerDraw',
    header: '전력',
    accessorFn: (row: GpuCard) => `${row.powerDraw.toFixed(1)}W`,
    size: 80,
  },
  {
    id: 'vram',
    header: 'VRAM',
    accessorFn: (row: GpuCard) =>
      `${Math.round(row.vramUsedMb)} / ${Math.round(row.vramTotalMb)} MB`,
    size: 160,
  },
  {
    id: 'fanSpeed',
    header: '팬',
    accessorFn: (row: GpuCard) => `${row.fanSpeed.toFixed(0)}%`,
    size: 60,
  },
  {
    id: 'driverVersion',
    header: '드라이버',
    accessorFn: (row: GpuCard) => row.driverVersion,
    size: 120,
  },
];

interface GpuStatusTableProps {
  cluster: string;
}

export const GpuStatusTable = ({ cluster }: GpuStatusTableProps) => {
  const { pagination, setPagination } = useTablePagination();
  const { data, isPending } = useQuery({
    queryKey: ['monitoring', 'gpu-status', cluster],
    queryFn: () =>
      api.get<GpuCard[]>('monit/monitoring/gpu-status', { searchParams: { cluster } }).json(),
    refetchInterval: 30000,
    enabled: !!cluster,
  });

  const gpuCards = data ?? [];

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#999]">로딩 중...</div>
    );
  }

  if (gpuCards.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#999]">
        GPU 데이터가 없습니다.
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={gpuCards}
      totalCount={gpuCards.length}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
};
