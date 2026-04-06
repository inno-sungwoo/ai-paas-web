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
  // fallback 필드 (nvidia_smi 없을 때)
  allocatedGpu?: number;
  namespace?: string;
  pod?: string;
  node?: string;
}

// nvidia_smi 메트릭이 있는지 판별
function hasNvidiaSmi(data: GpuCard[]): boolean {
  return data.some((g) => g.driverVersion && g.driverVersion !== '-');
}

const fullColumns = [
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

const fallbackColumns = [
  {
    id: 'pod',
    header: 'Pod',
    accessorFn: (row: GpuCard) => row.pod ?? '-',
    size: 280,
  },
  {
    id: 'namespace',
    header: '네임스페이스',
    accessorFn: (row: GpuCard) => row.namespace ?? '-',
    size: 150,
  },
  {
    id: 'node',
    header: '노드',
    accessorFn: (row: GpuCard) => row.node ?? '-',
    size: 200,
  },
  {
    id: 'allocatedGpu',
    header: '할당 GPU',
    accessorFn: (row: GpuCard) => `${row.allocatedGpu ?? 0}개`,
    size: 100,
  },
  {
    id: 'name',
    header: '상태',
    accessorFn: () => '할당됨',
    size: 100,
    cell: () => <span className="text-green-600 font-semibold">할당됨</span>,
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
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-[#999]">
        <span>GPU가 감지되지 않습니다.</span>
        <span className="text-xs">
          클러스터에 NVIDIA GPU가 장착된 노드가 없거나, GPU Operator가 설치되지 않았습니다.
        </span>
      </div>
    );
  }

  const columns = hasNvidiaSmi(gpuCards) ? fullColumns : fallbackColumns;

  return (
    <>
      {!hasNvidiaSmi(gpuCards) && (
        <div className="mb-2 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          nvidia-smi exporter 미설치 — GPU 할당 정보만 표시됩니다.
        </div>
      )}
      <Table
        columns={columns}
        data={gpuCards}
        totalCount={gpuCards.length}
        pagination={pagination}
        setPagination={setPagination}
      />
    </>
  );
};
