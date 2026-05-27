import { useState } from 'react';
import { BreadCrumb, Table, Button, useTablePagination } from '@innogrid/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HelmRepoItem {
  id: string;
  name: string;
  url: string;
  username: string | null;
  insecureSkipTlsVerify: boolean;
  createdAt: string;
  updatedAt: string;
}

const columns = [
  {
    id: 'name',
    header: '저장소 이름',
    accessorFn: (row: HelmRepoItem) => row.name,
    size: 200,
  },
  {
    id: 'url',
    header: 'URL',
    accessorFn: (row: HelmRepoItem) => row.url,
    size: 400,
  },
  {
    id: 'auth',
    header: '인증',
    accessorFn: (row: HelmRepoItem) => (row.username ? '설정됨' : '-'),
    size: 80,
  },
  {
    id: 'tls',
    header: 'TLS 검증',
    accessorFn: (row: HelmRepoItem) => (row.insecureSkipTlsVerify ? '건너뜀' : '사용'),
    size: 100,
  },
  {
    id: 'createdAt',
    header: '등록일',
    accessorFn: (row: HelmRepoItem) => row.createdAt,
    size: 160,
  },
];

export default function ApplicationHelmRepositoryPage() {
  const { pagination, setPagination } = useTablePagination();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const { data: repos = [], isPending } = useQuery({
    queryKey: ['helm-repos'],
    queryFn: () => api.get<HelmRepoItem[]>('helm-repos').json(),
  });

  const addMutation = useMutation({
    mutationFn: (data: { name: string; url: string }) =>
      api.post('helm-repos', { json: data }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helm-repos'] });
      setShowAddForm(false);
      setFormName('');
      setFormUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => api.delete(`helm-repos/${name}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helm-repos'] });
    },
  });

  const handleAdd = () => {
    if (!formName.trim() || !formUrl.trim()) return;
    addMutation.mutate({ name: formName.trim(), url: formUrl.trim() });
  };

  const actionColumn = {
    id: 'actions',
    header: '관리',
    size: 80,
    enableSorting: false,
    cell: ({ row }: { row: { original: HelmRepoItem } }) => (
      <button
        type="button"
        onClick={() => {
          if (confirm(`"${row.original.name}" 저장소를 삭제하시겠습니까?`)) {
            deleteMutation.mutate(row.original.name);
          }
        }}
        className="text-xs text-red-500 hover:text-red-700"
      >
        삭제
      </button>
    ),
  };

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '애플리케이션' }, { label: '헬름 저장소' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">헬름 저장소</h2>
      </div>
      <div className="page-content">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#525252]">
            등록된 Helm Chart 저장소를 관리합니다.
          </span>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            color="primary"
            size="small"
          >
            {showAddForm ? '취소' : '저장소 추가'}
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-4 rounded-md border border-[#e8e8e8] bg-[#f9f9f9] p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[#525252]">저장소 이름</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: my-charts"
                  className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-[2]">
                <label className="mb-1 block text-xs text-[#525252]">URL</label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="예: https://charts.example.com/repo"
                  className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={addMutation.isPending || !formName.trim() || !formUrl.trim()}
                className="rounded bg-[#1a1a1a] px-4 py-2 text-sm text-white hover:bg-[#333] disabled:opacity-50"
              >
                {addMutation.isPending ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        )}

        {isPending ? (
          <div className="flex items-center justify-center py-8 text-sm text-[#999]">
            로딩 중...
          </div>
        ) : (
          <Table
            columns={[...columns, actionColumn]}
            data={repos}
            totalCount={repos.length}
            pagination={pagination}
            setPagination={setPagination}
          />
        )}
      </div>
    </main>
  );
}
