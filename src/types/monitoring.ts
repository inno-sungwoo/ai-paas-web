export interface MonitoringSummary {
  helmReleaseCount: number;
  gpuCount: number;
  avgGpuUtil: number;
  activeAlertCount: number;
}

export interface ReleaseStatus {
  name: string;
  namespace: string;
  status: string;
  chart: string;
  chartVersion: string;
  updated: string;
  gpuUtil: number | null;
  gpuName?: string;
  gpuTemp?: number | null;
  gpuPowerWatt?: number | null;
  vramUsedMb?: number | null;
  vramTotalMb?: number | null;
}

export interface Alert {
  alertName: string;
  severity: 'critical' | 'warning' | 'info';
  namespace: string;
  message: string;
  startsAt: string;
  status: string;
}

export interface IdleWarning {
  namespace: string;
  alertName: string;
  message: string;
}

export interface CostSummary {
  totalGpuCostKrw: number;
  teams: TeamCost[];
}

export interface TeamCost {
  namespace: string;
  gpuCount: number;
  costKrw: number;
}

export interface CostReport {
  period: string;
  entries: DailyEntry[];
}

export interface DailyEntry {
  date: string;
  namespace: string;
  avgGpuUtil: number;
  costKrw: number;
}

export interface CostEstimate {
  gpuCount: number;
  hours: number;
  unitPriceKrw: number;
  totalCostKrw: number;
}

export interface HelmRepo {
  id: string;
  name: string;
  url: string;
}

export interface ChartInfo {
  name: string;
  version: string;
  appVersion: string;
  description: string;
}

export interface ChartList {
  repositoryName: string;
  charts: ChartInfo[];
}

export interface ChartDetail {
  repositoryName: string;
  chartName: string;
  version: string;
  appVersion: string;
  description: string;
  home: string;
  sources: string[];
  maintainers: { name: string; email: string }[];
}

export interface ChartValues {
  repositoryName: string;
  chartName: string;
  version: string;
  valuesContent: string;
}

export interface ReleaseInfo {
  name: string;
  namespace: string;
  chart: string;
  chartVersion: string;
  revision: string;
  status: string;
  updated: string;
}

export interface AuditEvent {
  reason: string;
  message: string;
  involvedObject: string;
  namespace: string;
  type: string;
  firstTimestamp: string;
  lastTimestamp: string;
}
