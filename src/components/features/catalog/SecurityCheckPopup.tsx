import type { SecurityWarning } from '@/util/checkYamlSecurity';

interface SecurityCheckPopupProps {
  warnings: SecurityWarning[];
  onEdit: () => void;
  onAutoFix: () => void;
  onProceed: () => void;
}

export const SecurityCheckPopup = ({
  warnings,
  onEdit,
  onAutoFix,
  onProceed,
}: SecurityCheckPopupProps) => {
  const errors = warnings.filter((w) => w.severity === 'error');
  const warnItems = warnings.filter((w) => w.severity === 'warning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[600px] rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">보안 검사 결과</h3>
        <div className="mb-4 max-h-[400px] space-y-3 overflow-y-auto">
          {errors.map((w, i) => (
            <div key={`err-${i}`} className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-700">{w.message}</span>
              </div>
              {w.fix && (
                <div className="mt-2 ml-4">
                  <span className="text-xs text-red-500">자동 수정 내용:</span>
                  <pre className="mt-1 rounded bg-red-100 p-2 text-xs break-words whitespace-pre-wrap text-red-800">
                    {w.fix}
                  </pre>
                </div>
              )}
            </div>
          ))}
          {warnItems.map((w, i) => (
            <div key={`warn-${i}`} className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">{w.message}</span>
              </div>
              {w.fix && (
                <div className="mt-2 ml-4">
                  <span className="text-xs text-yellow-600">자동 수정 내용:</span>
                  <pre className="mt-1 rounded bg-yellow-100 p-2 text-xs break-words whitespace-pre-wrap text-yellow-800">
                    {w.fix}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded border border-[#e8e8e8] px-4 py-2 text-sm text-[#525252] hover:bg-[#f5f5f5]"
          >
            직접 수정
          </button>
          <button
            type="button"
            onClick={onAutoFix}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            자동 수정 적용
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            그래도 배포
          </button>
        </div>
      </div>
    </div>
  );
};
