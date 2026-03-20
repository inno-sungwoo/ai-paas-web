import { useState } from 'react';
import {
  BreadCrumb,
  Select,
  Table,
  useTablePagination,
  type SelectSingleValue,
} from '@innogrid/ui';
import { useGetAuditEvents } from '@/hooks/service/audit';
import type { AuditEvent } from '@/types/monitoring';

type OptionType = { text: string; value: string };

const namespaceOptions = [
  { text: 'ai-pass3', value: 'ai-pass3' },
  { text: 'ai-platform', value: 'ai-platform' },
  { text: 'default', value: 'default' },
  { text: 'kube-system', value: 'kube-system' },
  { text: 'prometheus-system', value: 'prometheus-system' },
  { text: 'drift-detect', value: 'drift-detect' },
];

const columns = [
  {
    id: 'type',
    header: '유형',
    accessorFn: (row: AuditEvent) => row.type,
    size: 80,
    cell: ({ row }: { row: { original: AuditEvent } }) => {
      const t = row.original.type;
      return (
        <span
          className={
            t === 'Warning'
              ? 'font-semibold text-yellow-600'
              : t === 'Normal'
                ? 'text-green-600'
                : ''
          }
        >
          {t}
        </span>
      );
    },
  },
  { id: 'reason', header: '사유', accessorFn: (row: AuditEvent) => row.reason, size: 140 },
  {
    id: 'involvedObject',
    header: '관련 객체',
    accessorFn: (row: AuditEvent) => row.involvedObject,
    size: 250,
  },
  {
    id: 'message',
    header: '메시지',
    accessorFn: (row: AuditEvent) => row.message,
    size: 350,
    enableSorting: false,
  },
  {
    id: 'lastTimestamp',
    header: '발생 시간',
    accessorFn: (row: AuditEvent) => row.lastTimestamp ?? row.firstTimestamp ?? '-',
    size: 180,
  },
];

export default function AuditLogPage() {
  const { pagination, setPagination } = useTablePagination();
  const [selectedValue, setSelectedValue] = useState<OptionType>(namespaceOptions[0]);

  const namespace = selectedValue?.value ?? 'ai-pass3';
  const { events, isPending } = useGetAuditEvents('innogrid-aikube', namespace);

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

  return (
    <main>
      <BreadCrumb
        items={[{ label: '인프라 관리' }, { label: '감사 로그' }]}
        className="breadcrumbBox"
      />
      <div className="page-title-box">
        <h2 className="page-title">감사 로그</h2>
      </div>
      <div className="page-content">
        <Select
          className="page-input_item-data_select"
          options={namespaceOptions}
          getOptionLabel={(option) => option.text}
          getOptionValue={(option) => option.value}
          value={selectedValue}
          onChange={onChangeSelect}
        />
        <div className="page-mt-16">
          {isPending ? (
            <div className="flex items-center justify-center py-8 text-sm text-[#999]">
              로딩 중...
            </div>
          ) : (
            <Table
              columns={columns}
              data={events}
              totalCount={events.length}
              pagination={pagination}
              setPagination={setPagination}
            />
          )}
        </div>
      </div>
    </main>
  );
}
