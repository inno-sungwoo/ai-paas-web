import type { IdleWarning } from '@/types/monitoring';

interface IdleWarningBannerProps {
  warnings: IdleWarning[];
}

export const IdleWarningBanner = ({ warnings }: IdleWarningBannerProps) => {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-yellow-800">
          GPU 유휴 경고 ({warnings.length}건)
        </span>
      </div>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li
            key={`${w.alertName}-${i}`}
            className="flex items-start gap-2 text-xs text-yellow-700"
          >
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
            <span>
              <strong>{w.namespace}</strong> - {w.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
