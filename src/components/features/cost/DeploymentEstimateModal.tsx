import { useState } from 'react';
import { useGetCostEstimate } from '@/hooks/service/cost';

interface DeploymentEstimateModalProps {
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  isConfirming?: boolean;
}

export const DeploymentEstimateModal = ({
  onClose,
  onConfirm,
  confirmLabel = '배포',
  isConfirming = false,
}: DeploymentEstimateModalProps) => {
  const [gpuCount, setGpuCount] = useState(1);
  const [hours, setHours] = useState(24);
  const { costEstimate, isPending } = useGetCostEstimate(gpuCount, hours);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">배포 비용 추정</h3>
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#525252]">GPU 수량</label>
            <input
              type="number"
              min={1}
              value={gpuCount}
              onChange={(e) => setGpuCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#525252]">사용 시간</label>
            <input
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
            />
          </div>
        </div>
        {isPending && <div className="py-2 text-sm text-[#999]">계산 중...</div>}
        {costEstimate && (
          <div className="mb-4 rounded-md bg-[#f5f5f5] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#525252]">GPU 단가</span>
              <span className="font-medium text-[#1a1a1a]">
                {costEstimate.unitPriceKrw.toLocaleString()}원/시간
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-[#525252]">예상 총 비용</span>
              <span className="text-lg font-bold text-[#1a1a1a]">
                {costEstimate.totalCostKrw.toLocaleString()}원
              </span>
            </div>
          </div>
        )}
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
              onClick={onConfirm}
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
