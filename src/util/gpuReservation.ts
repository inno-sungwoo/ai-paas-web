const STORAGE_KEY = 'gpu-reservations';

export interface GpuReservation {
  releaseName: string;
  namespace: string;
  gpuCount: number;
  estimatedMinutes: number;
  deployedAt: string;
  unitPriceKrw: number;
  estimatedCostKrw: number;
}

export function saveReservation(reservation: GpuReservation) {
  const all = getReservations();
  // 같은 릴리즈명이 있으면 덮어쓰기
  const filtered = all.filter((r) => r.releaseName !== reservation.releaseName);
  filtered.push(reservation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getReservations(): GpuReservation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function removeReservation(releaseName: string) {
  const all = getReservations().filter((r) => r.releaseName !== releaseName);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function extendReservation(releaseName: string, additionalMinutes: number) {
  const all = getReservations();
  const target = all.find((r) => r.releaseName === releaseName);
  if (target) {
    target.estimatedMinutes += additionalMinutes;
    const hours = target.estimatedMinutes / 60;
    target.estimatedCostKrw = target.gpuCount * hours * target.unitPriceKrw;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

/** 경과 시간(분) */
export function getElapsedMinutes(reservation: GpuReservation): number {
  return (Date.now() - new Date(reservation.deployedAt).getTime()) / 60000;
}

/** 진행률 (0~999) */
export function getProgress(reservation: GpuReservation): number {
  const elapsed = getElapsedMinutes(reservation);
  return Math.round((elapsed / reservation.estimatedMinutes) * 100);
}

/** 초과 비용 (원) */
export function getOverrunCostKrw(reservation: GpuReservation): number {
  const elapsed = getElapsedMinutes(reservation);
  const overMinutes = elapsed - reservation.estimatedMinutes;
  if (overMinutes <= 0) return 0;
  return Math.round(reservation.gpuCount * (overMinutes / 60) * reservation.unitPriceKrw);
}

/** 현재 누적 비용 (원) */
export function getCurrentCostKrw(reservation: GpuReservation): number {
  const elapsed = getElapsedMinutes(reservation);
  return Math.round(reservation.gpuCount * (elapsed / 60) * reservation.unitPriceKrw);
}

/** 표시용 시간 포맷 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}분`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}시간`;
  return `${(minutes / 1440).toFixed(1)}일`;
}
