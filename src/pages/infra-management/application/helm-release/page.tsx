import { useState } from 'react';
import { BreadCrumb, Select, type SelectSingleValue } from '@innogrid/ui';
import { useGetMonitoringReleases } from '@/hooks/service/monitoring';
import { HelmReleaseTable } from '@/components/features/monitoring/HelmReleaseTable';

type OptionType = { text: string; value: string };

const clusterOptions = [
  { text: 'innogrid-aikube', value: 'innogrid-aikube' },
  { text: 'innogrid-dev', value: 'innogrid-dev' },
  { text: 'innogrid-prod', value: 'innogrid-prod' },
];

export default function ApplicationHelmReleasePage() {
  const [selectedValue, setSelectedValue] = useState<OptionType>(clusterOptions[0]);
  const cluster = selectedValue?.value ?? 'innogrid-aikube';
  const { releases, isPending } = useGetMonitoringReleases(cluster);

  const onChangeSelect = (option: SelectSingleValue<OptionType>) => {
    if (option) setSelectedValue(option);
  };

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
        <Select
          className="page-input_item-data_select"
          options={clusterOptions}
          getOptionLabel={(option) => option.text}
          getOptionValue={(option) => option.value}
          value={selectedValue}
          onChange={onChangeSelect}
        />
        <div className="page-mt-16">
          <HelmReleaseTable releases={releases} isPending={isPending} />
        </div>
      </div>
    </main>
  );
}
