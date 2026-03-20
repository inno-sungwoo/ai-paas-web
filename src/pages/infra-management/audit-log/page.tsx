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
  { text: 'default', value: 'default' },
  { text: 'kube-system', value: 'kube-system' },
  { text: 'mlops', value: 'mlops' },
  { text: 'monitoring', value: 'monitoring' },
];

const columns = [
  { id: 'type', header: '유형', accessorFn: (row: AuditEvent) => row.type, size: 100 },
  { id: 'reason', header: '사유', accessorFn: (row: AuditEvent) => row.reason, size: 150 },
  {
    id: 'involvedObject',
    header: '관련 객체',
    accessorFn: (row: AuditEvent) => row.involvedObject,
    size: 200,
  },
  {
    id: 'namespace',
    header: '네임스페이스',
    accessorFn: (row: AuditEvent) => row.namespace,
    size: 130,
  },
  {
    id: 'message',
    header: '메시지',
    accessorFn: (row: AuditEvent) => row.message,
    size: 300,
    enableSorting: false,
  },
  {
    id: 'firstTimestamp',
    header: '최초 발생',
    accessorFn: (row: AuditEvent) => row.firstTimestamp,
    size: 180,
  },
  {
    id: 'lastTimestamp',
    header: '최근 발생',
    accessorFn: (row: AuditEvent) => row.lastTimestamp,
    size: 180,
  },
];

export default function AuditLogPage() {
  const { pagination, setPagination } = useTablePagination();
  const [selectedValue, setSelectedValue] = useState<OptionType>(namespaceOptions[0]);

  const namespace = selectedValue?.value ?? 'default';
  const { events, isPending } = useGetAuditEvents(namespace);

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
