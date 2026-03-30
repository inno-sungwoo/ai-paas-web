import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetMonitoringReleases } from '@/hooks/service/monitoring';
import { HelmReleaseTable } from '@/components/features/monitoring/HelmReleaseTable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReleaseStatus } from '@/types/monitoring';

type OptionType = { text: string; value: string };

const clusterOptions = [{ text: 'innogrid-aikube', value: 'innogrid-aikube' }];

export default function ApplicationHelmReleasePage() {
  const location = useLocation();
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);
  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { releases, isPending } = useGetMonitoringReleases(cluster);
  const [nsFilter, setNsFilter] = useState<OptionType | null>(null);

  // 비용 최적화 페이지에서 네임스페이스 필터 전달받기
  useEffect(() => {
    const filterNs = (location.state as { filterNamespace?: string })?.filterNamespace;
    if (filterNs) {
      setNsFilter({ text: filterNs, value: filterNs });
    }
  }, [location.state]);
  const queryClient = useQueryClient();

  // 삭제 중인 릴리즈 + 삭제 완료 후 Prometheus 동기화 대기 중인 릴리즈
  const [hiddenNames, setHiddenNames] = useState<Set<string>>(new Set());
  const [deletingNames, setDeletingNames] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (release: ReleaseStatus) =>
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
      // 삭제 중 해제 + 숨김 목록에 추가
      setDeletingNames((prev) => {
        const n = new Set(prev);
        n.delete(release.name);
        return n;
      });
      setHiddenNames((prev) => new Set(prev).add(release.name));
      // 60초 후 숨김 해제 (Prometheus 동기화 완료 시점)
      setTimeout(() => {
        setHiddenNames((prev) => {
          const n = new Set(prev);
          n.delete(release.name);
          return n;
        });
        queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      }, 60000);
    },
    onError: (_err, release) => {
      setDeletingNames((prev) => {
        const n = new Set(prev);
        n.delete(release.name);
        return n;
      });
      setDeleteError(`"${release.name}" 삭제에 실패했습니다. 다시 시도해주세요.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['cost'] });
    },
  });

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

  const handleDelete = (release: ReleaseStatus) => {
    if (deletingNames.has(release.name)) return; // 이미 삭제 중
    if (
      confirm(
        `"${release.name}" 릴리즈를 삭제하시겠습니까?\n네임스페이스: ${release.namespace}\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      deleteMutation.mutate(release);
    }
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
    </main>
  );
}
