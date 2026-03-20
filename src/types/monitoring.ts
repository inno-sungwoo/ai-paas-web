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

export interface AuditEvent {
  reason: string;
  message: string;
  involvedObject: string;
  namespace: string;
  type: string;
  firstTimestamp: string;
  lastTimestamp: string;
}
