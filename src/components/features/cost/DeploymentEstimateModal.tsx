import { useState } from 'react';
import { useGetCostEstimate } from '@/hooks/service/cost';
import { saveReservation } from '@/util/gpuReservation';

type TimeUnit = 'min' | 'hour' | 'day';

interface DeploymentEstimateModalProps {
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  isConfirming?: boolean;
  releaseName?: string;
  namespace?: string;
}

function toHours(value: number, unit: TimeUnit): number {
  if (unit === 'min') return value / 60;
  if (unit === 'day') return value * 24;
  return value;
}

function toMinutes(value: number, unit: TimeUnit): number {
  if (unit === 'hour') return value * 60;
  if (unit === 'day') return value * 1440;
  return value;
}

export const DeploymentEstimateModal = ({
  onClose,
  onConfirm,
  confirmLabel = '배포',
  isConfirming = false,
  releaseName,
  namespace,
}: DeploymentEstimateModalProps) => {
  const [gpuCount, setGpuCount] = useState(1);
  const [timeValue, setTimeValue] = useState(24);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('hour');

  const hours = toHours(timeValue, timeUnit);
  // 단가 조회용으로 항상 1시간 기준으로 API 호출 (소수시간 API 에러 방지)
  const { costEstimate: baseEstimate, isPending } = useGetCostEstimate(gpuCount, 1);
  const unitPrice = baseEstimate?.unitPriceKrw ?? 0;
  const totalCost = Math.round(gpuCount * hours * unitPrice);
  const costEstimate = baseEstimate ? { unitPriceKrw: unitPrice, totalCostKrw: totalCost } : null;

  const handleConfirm = () => {
    if (releaseName && costEstimate) {
      saveReservation({
        releaseName,
        namespace: namespace ?? 'default',
        gpuCount,
        estimatedMinutes: toMinutes(timeValue, timeUnit),
        deployedAt: new Date().toISOString(),
        unitPriceKrw: costEstimate.unitPriceKrw,
        estimatedCostKrw: costEstimate.totalCostKrw,
      });
    }
    onConfirm?.();
  };

  const presets: { label: string; addMinutes: number }[] = [
    { label: '+2분', addMinutes: 2 },
    { label: '+1시간', addMinutes: 60 },
    { label: '+8시간', addMinutes: 480 },
    { label: '+1일', addMinutes: 1440 },
    { label: '+1주', addMinutes: 10080 },
  ];

  const handlePreset = (addMinutes: number) => {
    const currentMinutes = toMinutes(timeValue, timeUnit);
    const newMinutes = currentMinutes + addMinutes;
    // 단위 자동 선택: 60분 미만 → 분, 1440분 미만 → 시간, 그 이상 → 일
    if (newMinutes < 60) {
      setTimeUnit('min');
      setTimeValue(newMinutes);
    } else if (newMinutes < 1440) {
      setTimeUnit('hour');
      setTimeValue(Math.round((newMinutes / 60) * 10) / 10);
    } else {
      setTimeUnit('day');
      setTimeValue(Math.round((newMinutes / 1440) * 10) / 10);
    }
  };

  const handleReset = () => {
    setTimeValue(0);
    setTimeUnit('min');
  };

  const displayHours =
    hours < 1
      ? `${(hours * 60).toFixed(0)}분`
      : hours >= 24
        ? `${(hours / 24).toFixed(1)}일`
        : `${hours.toFixed(1)}시간`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-[#1a1a1a]">배포 비용 추정</h3>
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs leading-relaxed text-[#525252]">
          GPU는 클러스터의 가장 비싼 자원입니다. 배포 전 예상 비용을 확인하면
          <strong> 불필요한 GPU 할당을 방지</strong>하고, 팀별 GPU 예산을 효율적으로 관리할 수
          있습니다.
          {releaseName && (
            <span className="mt-1 block text-[#999]">
              설정한 시간이 지나면 비용 최적화 페이지에서 초과 알림을 받습니다.
            </span>
          )}
        </div>
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#525252]">
              GPU 수량
              <span className="ml-1 font-normal text-[#999]">
                (values.yaml의 nvidia.com/gpu 값)
              </span>
            </label>
            <input
              type="number"
              min={1}
              value={gpuCount}
              onChange={(e) => setGpuCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#525252]">
              예상 사용 시간
              <span className="ml-1 font-normal text-[#999]">(초과 시 알림을 받습니다)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center">
                <input
                  type="number"
                  min={1}
                  value={timeValue}
                  onChange={(e) => setTimeValue(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-l border border-r-0 border-[#e8e8e8] px-3 py-2 text-sm"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
                  className="rounded-r border border-[#e8e8e8] bg-[#f9f9f9] px-2 py-2 text-sm text-[#525252]"
                >
                  <option value="min">분</option>
                  <option value="hour">시간</option>
                  <option value="day">일</option>
                </select>
              </div>
              <div className="flex shrink-0 gap-1">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p.addMinutes)}
                    className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-100"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded border border-[#e8e8e8] px-2.5 py-1.5 text-xs text-[#999] hover:bg-[#f5f5f5]"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>
        {isPending && <div className="py-2 text-sm text-[#999]">계산 중...</div>}
        {costEstimate && (
          <div className="mb-4 rounded-md border border-blue-100 bg-blue-50/50 p-4">
            <div className="mb-3 text-center text-xs text-[#525252]">
              <span className="inline-flex items-center gap-1.5">
                <span className="rounded bg-white px-2 py-0.5 font-medium text-[#1a1a1a]">
                  GPU {gpuCount}개
                </span>
                <span>x</span>
                <span className="rounded bg-white px-2 py-0.5 font-medium text-[#1a1a1a]">
                  {displayHours}
                </span>
                <span>x</span>
                <span className="rounded bg-white px-2 py-0.5 font-medium text-[#1a1a1a]">
                  {costEstimate.unitPriceKrw.toLocaleString()}원/시간
                </span>
              </span>
            </div>
            <div className="flex items-end justify-between border-t border-blue-100 pt-3">
              <span className="text-sm text-[#525252]">예상 총 비용</span>
              <span className="text-xl font-bold text-blue-600">
                {costEstimate.totalCostKrw.toLocaleString()}원
              </span>
            </div>
          </div>
        )}
        <div className="mb-4 rounded-md bg-[#f9f9f9] px-3 py-2 text-xs text-[#999]">
          <span className="font-medium text-[#525252]">GPU 단가 기준:</span> 클러스터
          ConfigMap(gpu-pricing)에 등록된 GPU 모델별 시간당 단가 적용
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#e8e8e8] px-4 py-2 text-sm text-[#525252] hover:bg-[#f5f5f5]"
          >
            닫기
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isConfirming ? '배포 중...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
