import { useState } from 'react';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetReleases } from '@/hooks/service/catalog';
import { HelmReleaseTable } from '@/components/features/monitoring/HelmReleaseTable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReleaseInfo } from '@/types/monitoring';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useToast } from '@/components/ui/toast';

type OptionType = { text: string; value: string };

const clusterOptions = [{ text: 'innogrid-aikube', value: 'innogrid-aikube' }];

export default function ApplicationHelmReleasePage() {
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);
  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { releases, isPending } = useGetReleases(cluster);
  const [nsFilter, setNsFilter] = useState<OptionType | null>(null);
  const queryClient = useQueryClient();

  // 삭제 중인 릴리즈 + 삭제 완료 후 Prometheus 동기화 대기 중인 릴리즈
  const [hiddenNames, setHiddenNames] = useState<Set<string>>(new Set());
  const [deletingNames, setDeletingNames] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ReleaseInfo | null>(null);
  const { addToast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (release: ReleaseInfo) =>
      api
        .delete(`charts/releases/${release.name}`, {
          searchParams: { clusterId: cluster, namespace: release.namespace },
        })
        .json(),
    onMutate: (release) => {
      setDeleteError(null);
      setDeletingNames((prev) => new Set(prev).add(release.name));
    },
    onSuccess: (_data, release) => {
      addToast('success', `"${release.name}" 릴리즈가 삭제되었습니다.`);
      // 삭제 중 해제 + 숨김 목록에 추가
      setDeletingNames((prev) => {
        const n = new Set(prev);
        n.delete(release.name);
        return n;
      });
      setHiddenNames((prev) => new Set(prev).add(release.name));
      // 10초 후 숨김 해제 (helm list는 실시간 반영)
      setTimeout(() => {
        setHiddenNames((prev) => {
          const n = new Set(prev);
          n.delete(release.name);
          return n;
        });
        queryClient.invalidateQueries({ queryKey: ['charts', 'releases'] });
      }, 10000);
    },
    onError: (_err, release) => {
      setDeletingNames((prev) => {
        const n = new Set(prev);
        n.delete(release.name);
        return n;
      });
      setDeleteError(`"${release.name}" 삭제에 실패했습니다. 다시 시도해주세요.`);
      addToast('error', `"${release.name}" 삭제 실패`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['cost'] });
    },
  });

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

  const handleDelete = (release: ReleaseInfo) => {
    if (deletingNames.has(release.name)) return;
    setConfirmTarget(release);
  };

  // 네임스페이스 목록 추출 (중복 제거)
  const namespaces = [...new Set(releases.map((r) => r.namespace))].sort();
  const nsOptions: OptionType[] = [
    { text: '전체', value: '' },
    ...namespaces.map((ns) => ({ text: ns, value: ns })),
  ];

  // 1. 삭제 완료된 릴리즈 숨김 + 네임스페이스 필터
  const visible = releases.filter((r) => !hiddenNames.has(r.name));
  const filtered = nsFilter?.value
    ? visible.filter((r) => r.namespace === nsFilter.value)
    : visible;

  // 2. 최신 배포순 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (!a.updated || !b.updated) return 0;
    return b.updated.localeCompare(a.updated);
  });

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '애플리케이션' }, { label: '헬름 릴리즈' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">헬름 릴리즈</h2>
      </div>
      <div className="page-content">
        <div className="flex items-center gap-4">
          <Select
            className="page-input_item-data_select"
            options={clusterOptions}
            getOptionLabel={(option) => option.text}
            getOptionValue={(option) => option.value}
            value={selectedValue}
            onChange={onChangeSelect}
          />
          <Select
            className="page-input_item-data_select"
            options={nsOptions}
            getOptionLabel={(option) => option.text}
            getOptionValue={(option) => option.value}
            value={nsFilter ?? nsOptions[0]}
            onChange={(option: SelectSingleValue<OptionType>) => {
              setNsFilter(option ?? null);
            }}
            placeholder="네임스페이스 필터"
          />
          <span className="text-xs text-[#999]">
            {sorted.length}개 릴리즈 (최신 배포순)
            {deletingNames.size > 0 && ` · ${deletingNames.size}개 삭제 중...`}
          </span>
        </div>
        {deleteError && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {deleteError}
          </div>
        )}
        <div className="page-mt-16">
          <HelmReleaseTable
            releases={sorted}
            isPending={isPending}
            onDelete={handleDelete}
            deletingNames={deletingNames}
          />
        </div>
      </div>
      {confirmTarget && (
        <ConfirmModal
          title="릴리즈 삭제"
          message={`"${confirmTarget.name}" 릴리즈를 삭제하시겠습니까?`}
          detail={`네임스페이스: ${confirmTarget.namespace}\n이 작업은 되돌릴 수 없습니다.`}
          confirmText="삭제"
          variant="danger"
          onConfirm={() => {
            deleteMutation.mutate(confirmTarget);
            setConfirmTarget(null);
          }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </main>
  );
}
