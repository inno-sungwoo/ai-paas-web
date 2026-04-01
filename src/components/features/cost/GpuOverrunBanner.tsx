import {
  useGetGpuReservations,
  useExtendGpuReservation,
  type GpuReservationDto,
} from '@/hooks/service/cost';

function getElapsedMinutes(r: GpuReservationDto): number {
  return (Date.now() - new Date(r.deployedAt).getTime()) / 60000;
}

function getProgress(r: GpuReservationDto): number {
  return Math.min(Math.round((getElapsedMinutes(r) / r.estimatedMinutes) * 100), 100);
}

function isOverrun(r: GpuReservationDto): boolean {
  return getElapsedMinutes(r) > r.estimatedMinutes;
}

function getOverrunCostKrw(r: GpuReservationDto): number {
  const overMin = getElapsedMinutes(r) - r.estimatedMinutes;
  if (overMin <= 0) return 0;
  return Math.round(r.gpuCount * (overMin / 60) * r.unitPriceKrw);
}

function getCurrentCostKrw(r: GpuReservationDto): number {
  return Math.round(r.gpuCount * (getElapsedMinutes(r) / 60) * r.unitPriceKrw);
}

function formatDuration(minutes: number): string {
  if (minutes < 10) return `${minutes.toFixed(1)}분`;
  if (minutes < 60) return `${Math.round(minutes)}분`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}시간`;
  return `${(minutes / 1440).toFixed(1)}일`;
}

interface GpuOverrunBannerProps {
  cluster?: string;
}

export const GpuOverrunBanner = ({ cluster = 'innogrid-aikube' }: GpuOverrunBannerProps) => {
  const { reservations } = useGetGpuReservations(cluster);
  const extendMutation = useExtendGpuReservation();

  if (reservations.length === 0) return null;

  const items = reservations
    .map((r) => ({
      ...r,
      progress: getProgress(r),
      elapsed: getElapsedMinutes(r),
      _isOverrun: isOverrun(r),
      overrunCost: getOverrunCostKrw(r),
      currentCost: getCurrentCostKrw(r),
    }))
    .sort((a, b) => b.progress - a.progress);

  const alertItems = items.filter((r) => r.progress >= 70);
  const normalItems = items.filter((r) => r.progress < 70);
  const overrunCount = alertItems.filter((r) => r._isOverrun).length;

  return (
    <div className="space-y-3">
      {/* 경고 영역: 초과/임박 */}
      {alertItems.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2a1 1 0 01.894.553l7 14A1 1 0 0117 18H3a1 1 0 01-.894-1.447l7-14A1 1 0 0110 2zm0 5a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  fill="#ef4444"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold text-red-700">
              GPU 사용 시간 {overrunCount > 0 ? `초과 ${overrunCount}건` : '만료 임박'}
            </span>
          </div>
          <div className="space-y-3">
            {alertItems.map((r) => (
              <ReservationCard
                key={r.releaseName}
                r={r}
                cluster={cluster}
                onExtend={extendMutation.mutate}
                variant="alert"
              />
            ))}
          </div>
        </div>
      )}

      {/* 예약 현황: 정상 진행 중 */}
      {normalItems.length > 0 && (
        <div className="rounded-lg border border-[#e8e8e8] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <path d="M10 6v4.5l3 1.5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-[#1a1a1a]">
              GPU 사용 예약 {normalItems.length}건
            </span>
          </div>
          <div className="space-y-3">
            {normalItems.map((r) => (
              <ReservationCard
                key={r.releaseName}
                r={r}
                cluster={cluster}
                onExtend={extendMutation.mutate}
                variant="normal"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ItemData {
  releaseName: string;
  namespace: string;
  estimatedMinutes: number;
  estimatedCostKrw: number;
  elapsed: number;
  progress: number;
  _isOverrun: boolean;
  overrunCost: number;
  currentCost: number;
}

function ReservationCard({
  r,
  cluster,
  onExtend,
  variant,
}: {
  r: ItemData;
  cluster: string;
  onExtend: (params: { releaseName: string; cluster: string; minutes: number }) => void;
  variant: 'alert' | 'normal';
}) {
  const barColor = r._isOverrun
    ? 'bg-red-500'
    : r.progress >= 90
      ? 'bg-yellow-500'
      : r.progress >= 70
        ? 'bg-green-500'
        : 'bg-blue-500';
  const overrunMinutes = r.elapsed - r.estimatedMinutes;
  const borderClass = variant === 'alert' ? 'border-red-100' : 'border-[#e8e8e8]';

  return (
    <div className={`rounded-md border ${borderClass} bg-white p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[#1a1a1a]">{r.releaseName}</span>
        <span className="text-xs text-[#999]">{r.namespace}</span>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs text-[#525252]">
        <span>
          예약: {formatDuration(r.estimatedMinutes)} / 경과: {formatDuration(r.elapsed)}
          {r._isOverrun && (
            <span className="ml-1 font-medium text-red-600">
              (+{formatDuration(overrunMinutes)} 초과)
            </span>
          )}
        </span>
        <span className={r._isOverrun ? 'font-medium text-red-600' : ''}>{r.progress}%</span>
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[#e8e8e8]">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${r.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#525252]">
          예상: {r.estimatedCostKrw.toLocaleString()}원 {'->'} 현재:{' '}
          <span className={r._isOverrun ? 'font-bold text-red-600' : 'font-medium text-[#1a1a1a]'}>
            {r.currentCost.toLocaleString()}원
          </span>
          {r._isOverrun && (
            <span className="ml-1 text-red-500">(+{r.overrunCost.toLocaleString()}원)</span>
          )}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onExtend({ releaseName: r.releaseName, cluster, minutes: 1440 })}
            className="rounded border border-[#e8e8e8] px-5 py-2.5 text-xs text-[#525252] hover:bg-[#f5f5f5]"
          >
            24h 연장
          </button>
          {variant === 'alert' && (
            <button
              type="button"
              onClick={() => {
                window.location.href = '/infra-management/application/helm-release';
              }}
              className="rounded bg-red-600 px-5 py-2.5 text-xs text-white hover:bg-red-700"
            >
              릴리즈 정리
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
