import { useState } from 'react';
import {
  BreadCrumb,
  Select,
  Table,
  useTablePagination,
  type SelectSingleValue,
} from '@innogrid/ui';
import { useGetHelmRepos, useGetCharts, useGetChartDetail } from '@/hooks/service/catalog';
import { DeployCatalogModal } from '@/components/features/catalog/DeployCatalogModal';
import type { ChartInfo } from '@/types/monitoring';

type RepoOption = { text: string; value: string };

const makeChartColumns = (onSelect: (chart: ChartInfo) => void) => [
  {
    id: 'name',
    header: '차트 이름',
    accessorFn: (row: ChartInfo) => row.name,
    size: 250,
    cell: ({ row }: { row: { original: ChartInfo } }) => (
      <button
        type="button"
        onClick={() => onSelect(row.original)}
        className="text-left font-medium text-blue-600 hover:underline"
      >
        {row.original.name}
      </button>
    ),
  },
  { id: 'version', header: '버전', accessorFn: (row: ChartInfo) => row.version, size: 120 },
  {
    id: 'appVersion',
    header: '앱 버전',
    accessorFn: (row: ChartInfo) => row.appVersion,
    size: 120,
  },
  {
    id: 'description',
    header: '설명',
    accessorFn: (row: ChartInfo) => row.description,
    size: 400,
    enableSorting: false,
  },
  {
    id: 'deploy',
    header: '',
    size: 80,
    enableSorting: false,
    cell: ({ row }: { row: { original: ChartInfo } }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(row.original);
        }}
        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
      >
        배포
      </button>
    ),
  },
];

export default function ApplicationCatalogPage() {
  const { pagination, setPagination } = useTablePagination();
  const { repos, isPending: reposLoading } = useGetHelmRepos();

  const repoOptions: RepoOption[] = repos.map((r) => ({ text: r.name, value: r.name }));
  const [selectedRepo, setSelectedRepo] = useState<RepoOption | null>(null);

  const activeRepo = selectedRepo?.value ?? repos[0]?.name ?? '';
  const { chartList, isPending: chartsLoading } = useGetCharts(activeRepo);
  const charts = chartList?.charts ?? [];

  const [selectedChart, setSelectedChart] = useState<ChartInfo | null>(null);
  const [deployChart, setDeployChart] = useState<ChartInfo | null>(null);

  const { chartDetail, isPending: detailLoading } = useGetChartDetail(
    activeRepo,
    selectedChart?.name ?? ''
  );

  const onChangeRepo = (option: SelectSingleValue<RepoOption>) => {
    if (option) {
      setSelectedRepo(option);
      setSelectedChart(null);
    }
  };

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '애플리케이션' }, { label: '카탈로그' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">애플리케이션 카탈로그</h2>
      </div>
      <div className="page-content">
        {/* Repo Selector */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-[#525252]">Helm 저장소</label>
          {reposLoading ? (
            <span className="text-sm text-[#999]">로딩 중...</span>
          ) : (
            <Select
              className="page-input_item-data_select"
              options={repoOptions}
              getOptionLabel={(o) => o.text}
              getOptionValue={(o) => o.value}
              value={selectedRepo ?? repoOptions[0] ?? null}
              onChange={onChangeRepo}
            />
          )}
        </div>

        {/* Chart List */}
        <div className="page-detail-round-box">
          <div className="page-detail-round-name">차트 목록</div>
          <div className="page-detail-round-data">
            {chartsLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-[#999]">
                로딩 중...
              </div>
            ) : (
              <Table
                columns={makeChartColumns((chart) => setDeployChart(chart))}
                data={charts}
                totalCount={charts.length}
                pagination={pagination}
                setPagination={setPagination}
              />
            )}
          </div>
        </div>

        {/* Chart Detail Panel */}
        {selectedChart && (
          <div className="page-detail-round-box page-mt-16">
            <div className="flex items-center justify-between">
              <div className="page-detail-round-name">{selectedChart.name} 상세 정보</div>
              <button
                type="button"
                onClick={() => setDeployChart(selectedChart)}
                className="mr-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                배포
              </button>
            </div>
            <div className="page-detail-round-data">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-[#999]">
                  로딩 중...
                </div>
              ) : chartDetail ? (
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#999]">차트:</span>{' '}
                      <span className="font-medium text-[#1a1a1a]">{chartDetail.name}</span>
                    </div>
                    <div>
                      <span className="text-[#999]">버전:</span>{' '}
                      <span className="font-medium text-[#1a1a1a]">{chartDetail.version}</span>
                    </div>
                    <div>
                      <span className="text-[#999]">앱 버전:</span>{' '}
                      <span className="font-medium text-[#1a1a1a]">{chartDetail.appVersion}</span>
                    </div>
                    <div>
                      <span className="text-[#999]">홈:</span>{' '}
                      <span className="font-medium text-[#1a1a1a]">{chartDetail.home || '-'}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-[#999]">설명:</span>{' '}
                    <span className="text-[#525252]">{chartDetail.description}</span>
                  </div>
                  {chartDetail.maintainers?.length > 0 && (
                    <div className="text-sm">
                      <span className="text-[#999]">관리자:</span>{' '}
                      <span className="text-[#525252]">
                        {chartDetail.maintainers.map((m) => m.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-sm text-[#999]">
                  상세 정보를 불러올 수 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Deploy Modal */}
      {deployChart && (
        <DeployCatalogModal
          repoName={activeRepo}
          chartName={deployChart.name}
          chartVersion={deployChart.version}
          onClose={() => setDeployChart(null)}
          onSuccess={() => setDeployChart(null)}
        />
      )}
    </main>
  );
}
