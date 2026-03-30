import { useState } from 'react';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetMonitoringReleases } from '@/hooks/service/monitoring';
import { HelmReleaseTable } from '@/components/features/monitoring/HelmReleaseTable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReleaseStatus } from '@/types/monitoring';

type OptionType = { text: string; value: string };

const clusterOptions = [{ text: 'innogrid-aikube', value: 'innogrid-aikube' }];

export default function ApplicationHelmReleasePage() {
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);
  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { releases, isPending } = useGetMonitoringReleases(cluster);
  const [nsFilter, setNsFilter] = useState<OptionType | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (release: ReleaseStatus) =>
      api
        .delete(`charts/releases/${release.name}`, {
          searchParams: { clusterId: cluster, namespace: release.namespace },
        })
        .json(),
    onMutate: async (release) => {
      // Optimistic Update: 삭제 요청 즉시 목록에서 제거
      await queryClient.cancelQueries({ queryKey: ['monitoring', 'releases', cluster] });
      const prev = queryClient.getQueryData(['monitoring', 'releases', cluster]);
      queryClient.setQueryData(['monitoring', 'releases', cluster], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((r: ReleaseStatus) => r.name !== release.name);
      });
      return { prev };
    },
    onError: (_err, _release, context) => {
      // 실패 시 이전 데이터로 복원
      if (context?.prev) {
        queryClient.setQueryData(['monitoring', 'releases', cluster], context.prev);
      }
    },
    onSettled: () => {
      // Prometheus 메트릭 반영 후 최종 동기화 (30초 뒤)
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['cost'] });
    },
  });

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

  const handleDelete = (release: ReleaseStatus) => {
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

  // 1. 네임스페이스 필터 적용
  const filtered = nsFilter?.value
    ? releases.filter((r) => r.namespace === nsFilter.value)
    : releases;

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
            {deleteMutation.isPending && ' · 삭제 중...'}
          </span>
        </div>
        {deleteMutation.isError && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            삭제에 실패했습니다. 다시 시도해주세요.
          </div>
        )}
        <div className="page-mt-16">
          <HelmReleaseTable releases={sorted} isPending={isPending} onDelete={handleDelete} />
        </div>
      </div>
    </main>
  );
}
