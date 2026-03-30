interface ConfirmModalProps {
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  title,
  message,
  detail,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          {variant === 'danger' && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 6v4m0 4h.01M10 18a8 8 0 100-16 8 8 0 000 16z"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          <h3 className="text-lg font-semibold text-[#1a1a1a]">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-[#525252]">{message}</p>
        {detail && (
          <div className="mt-3 rounded-md bg-[#f5f5f5] px-3 py-2 text-xs text-[#525252]">
            {detail}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-[#e8e8e8] px-4 py-2 text-sm text-[#525252] hover:bg-[#f5f5f5]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded px-4 py-2 text-sm text-white ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
