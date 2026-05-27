# ai-paas-web — 3차년도 프론트엔드 변경 사항

> **브랜치**: `feat/3rd-year-monitoring-ui`
> **기준 브랜치**: `main`
> **변경 규모**: 60 files changed, 6,922 insertions, 650 deletions
> **커밋 수**: 29개

---

## 1. 개요

3차년도 과제의 프론트엔드를 구현하였습니다. 모니터링 대시보드 실데이터 연동, 비용 관리 UI, 보안 검사/자동 수정 팝업, 감사 로그, GPU 예약제 등을 개발하였습니다.

## 2. 실행 방법

### 사전 요구사항

- Node.js 20+ (현재 25.6.1)
- pnpm
- 백엔드 서버 실행 중 (localhost:8888)

### 실행

```bash
cd /Users/usermackbookpro/innogrid-prj/ai-paas-web
git checkout feat/3rd-year-monitoring-ui

pnpm install
pnpm dev
# → http://localhost:5173 (또는 5174)
```

### 환경 변수

`.env.local` 파일:
```
VITE_SERVER_URL=http://localhost:8888
```

백엔드 URL을 변경할 경우 이 값을 수정하세요.

---

## 3. 신규 페이지

| 페이지 | URL | 파일 |
|--------|-----|------|
| 모니터링 대시보드 | `/infra-management/monitoring-dashboard` | `pages/infra-management/monitoring-dashboard/page.tsx` |
| 카탈로그 | `/infra-management/application/catalog` | `pages/infra-management/application/catalog/page.tsx` |
| 헬름 릴리즈 | `/infra-management/application/helm-release` | `pages/infra-management/application/helm-release/page.tsx` |
| 비용 최적화 | `/infra-management/cost-optimization` | `pages/infra-management/cost-optimization/page.tsx` |
| 감사 로그 | `/infra-management/audit-log` | `pages/infra-management/audit-log/page.tsx` |
| 클러스터 관리 | `/infra-management/cluster-management` | `pages/infra-management/cluster-management/page.tsx` |
| 클러스터 상세 | `/infra-management/cluster-management/:id` | `pages/infra-management/cluster-management/[id]/page.tsx` |
| 클러스터 생성 | `/infra-management/cluster-management/create` | `pages/infra-management/cluster-management/create/page.tsx` |

---

## 4. 신규 컴포넌트

### 카탈로그 / 배포

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `DeployCatalogModal` | `components/features/catalog/DeployCatalogModal.tsx` | 차트 배포 모달 (릴리즈명, 클러스터, NS, values.yaml 편집기) |
| `SecurityCheckPopup` | `components/features/catalog/SecurityCheckPopup.tsx` | 보안 검사 결과 팝업 (직접 수정/자동 수정/그래도 배포) |

### 비용 관리

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `DeploymentEstimateModal` | `components/features/cost/DeploymentEstimateModal.tsx` | 배포 전 비용 추정 모달 (GPU × 시간 × 단가) |
| `GpuOverrunBanner` | `components/features/cost/GpuOverrunBanner.tsx` | GPU 사용 시간 초과 경고 배너 (진행률 바, 초과 비용, 연장/정리 버튼) |
| `CostSummaryChart` | `components/features/cost/CostSummaryChart.tsx` | 네임스페이스별 GPU 비용 바 차트 |
| `UsageReportTable` | `components/features/cost/UsageReportTable.tsx` | 7일 사용 보고서 테이블 |
| `IdleWarningBanner` | `components/features/cost/IdleWarningBanner.tsx` | 유휴 GPU 경고 배너 |

### 모니터링

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `GpuStatusTable` | `components/features/monitoring/GpuStatusTable.tsx` | GPU 현황 테이블 (모델, 활용률, 온도, 전력, VRAM) |
| `HelmReleaseTable` | `components/features/monitoring/HelmReleaseTable.tsx` | 헬름 릴리즈 현황 테이블 |

### 공통 UI

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `ConfirmModal` | `components/ui/confirm-modal.tsx` | 커스텀 삭제 확인 모달 |
| `Toast` | `components/ui/toast.tsx` | 성공/실패 Toast 알림 |
| `Skeleton` | `components/ui/skeleton.tsx` | 로딩 스켈레톤 |

---

## 5. 신규 Hooks (API 연동)

| Hook 파일 | 주요 함수 | 백엔드 API |
|----------|---------|-----------|
| `hooks/service/monitoring.ts` | `useGetMonitoringSummary`, `useGetGpuStatus`, `useGetNodeResourceUsage` | `/monit/monitoring/*` |
| `hooks/service/cost.ts` | `useGetCostSummary`, `useGetCostReport`, `useGetCostEstimate`, `useGetGpuReservations` | `/cost/*` |
| `hooks/service/audit.ts` | `useGetAuditEvents` | `/audit/events` |
| `hooks/service/catalog.ts` | `useGetChartValues`, `useDeployChart`, `useDeleteRelease` | `/charts/*` |
| `hooks/service/clusters.ts` | `useGetClusters`, `useCreateCluster`, `useDeleteCluster` + K8s 리소스 hooks | `/system/*` |

---

## 6. 유틸리티

| 파일 | 설명 |
|------|------|
| `util/checkYamlSecurity.ts` | values.yaml 보안 검사 로직 (루트 권한, GPU 제한 미설정 감지) |
| `util/gpuReservation.ts` | GPU 예약 유틸리티 (비용 계산, 시간 변환) |

---

## 7. 사이드바 메뉴 변경

`components/layout/menu.tsx`에서 인프라 관리 하위 메뉴를 추가하였습니다:

```
인프라 관리
├── 클러스터 관리
├── 모니터링 대시보드
├── 이벤트
├── 비용 최적화
├── 감사 로그
└── 애플리케이션
    ├── 카탈로그
    ├── 헬름 릴리즈
    └── 헬름 저장소
```

---

## 8. 주요 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `monitoring-dashboard/page.tsx` | 게이지 차트 하드코딩 → Prometheus 실데이터 연동 |
| `application/catalog/page.tsx` | 배포 모달 + 보안 검사 + 비용 추정 플로우 추가 |
| `application/helm-release/page.tsx` | 삭제 기능 + GPU 사용 중 뱃지 + Optimistic Update |
| `cluster-management/page.tsx` | K8s 리소스 탭 UI 전면 리팩토링 |
| `layout/menu.tsx` | 인프라 관리 서브메뉴 구조 변경 |
| `router/router.tsx` | 신규 라우트 18개 추가 |

---

## 9. 모니터링 대시보드 데이터 출처

모든 카드/게이지/차트는 Prometheus(`cluster.monit_server_url`) 실 관측값을 직접 조회합니다. mock/하드코딩 폴백은 모두 제거되었습니다.

### 9-1. 실 관측값 (kube-state-metrics + node-exporter + helm-exporter)

| 지표 | PromQL / 출처 | 비고 |
|---|---|---|
| CPU 사용률 게이지 | `cpu/usage` ÷ `cpu/total` (resourceMonit API) | 노드 실측 |
| Memory 사용률 게이지 | `memory/usage` ÷ `memory/total` | 노드 실측 |
| Filesystem 사용률 게이지 | `filesystem/usage` ÷ `filesystem/total` | 노드 실측 |
| Pod 수 / 용량 | `kubelet_running_pods` 합산, 노드 capacity 합 | 실시간 |
| CPU usage / load 시계열 | `query_range`, 1시간 윈도우 | 성능 지표 차트 |
| 네임스페이스별 Pod 수 | `pod/usage_namespace` query | 표 |
| 헬름 릴리즈 수 | `count(helm_chart_info{description!~".*failed.*"})` | helm-exporter 필요 |
| 활성 알림 수 | `count(ALERTS{alertstate="firing"})` | Prometheus AlertManager |
| GPU 보유 수 | `count(DCGM_FI_DEV_GPU_UTIL)` → `count(nvidia_smi_gpu_info)` → `sum(kube_node_status_capacity{resource="nvidia_com_gpu"})` 폴백 체인 | DCGM/nvidia_smi 미설치 시 kube-state-metrics 기준 |
| GPU 활용률 (avgGpuUtil) | `avg(DCGM_FI_DEV_GPU_UTIL)` → `avg(nvidia_smi_utilization_gpu_ratio)*100` → `clamp_max((sum(kube_pod_container_resource_requests{resource="nvidia_com_gpu"}) / sum(kube_node_status_capacity{...})) * 100, 100)` 폴백 체인 | exporter 미설치 시 **할당률**로 대체 표시 |

### 9-2. GPU 현황 테이블

- **DCGM/nvidia_smi exporter 설치 시**: GPU 모델, 활용률, 온도, 전력, VRAM, 팬 속도, 드라이버 버전 표시
- **미설치 시 (할당 정보 모드)**: Pod, 네임스페이스, 노드, 할당 GPU, Pod Phase(Running/Pending/Failed) 표시
  - 다중 kube-state-metrics 인스턴스로 인한 중복은 namespace+pod 키로 dedupe
  - Prometheus stale 메트릭 필터링: fabric8 client로 실 pod 존재 여부 검증, 없는 pod는 결과에서 제외
  - 누락된 노드 정보는 fabric8로 직접 조회하여 보강

### 9-3. 비용 최적화 페이지

| 지표 | 출처 |
|---|---|
| 일/월 비용 | `cost/summary` (네임스페이스별 GPU 요청량 × 단가) |
| GPU 사용 (할당/보유) | `cost/summary.teams` 합 / `monitoring.gpuCount` |
| 현재 활용률 | `monitoring.avgGpuUtil` (위 폴백 체인) |
| 네임스페이스별 비용 차트 | `cost/summary.teams` |
| 7일 사용 보고서 | `cost/report` (Prometheus query_range) |
| 유휴/초과 배너 | `cost/idle-warnings`, `cost/reservations` (DB 기반 예약) |

### 9-4. 클러스터 모니터링 상태 추적

각 클러스터 row에 다음 컬럼이 추가되었습니다(`cluster` 테이블):

| 컬럼 | 의미 |
|---|---|
| `monit_status` | `ACTIVE` / `UNREACHABLE` / `NOT_CONFIGURED` — 1분 주기 헬스체크로 갱신 |
| `monit_last_check` | 마지막 헬스체크 시각 |
| `monit_last_error` | 마지막 실패 사유 (UNREACHABLE/NOT_CONFIGURED일 때) |

**자동 동작**
- 백엔드 부팅 시 + 1분 주기로 `ClusterMonitHealthChecker`가 모든 클러스터의 `<monit_server_url>/-/healthy`를 호출
- placeholder(`@@..@@`)나 빈/잘못된 URL은 즉시 `NOT_CONFIGURED` 마킹
- `MonitServiceImpl.getMonitUrl()`는 `monit_status != ACTIVE`인 클러스터에 대한 PromQL 호출을 즉시 503으로 거부 → 백엔드 hang 방지
- 모든 PromQL 호출에 5초 timeout + 1회 retry. 실패 시 빈 결과를 반환하여 다른 카드 응답에 영향 없음

**프론트엔드 동작**
- 클러스터 selector는 `useGetClusters` 응답의 `monitStatus`로 라벨에 상태를 표시 (`ai-platform-k8s (UNREACHABLE)`)
- 첫 ACTIVE 클러스터를 자동 기본 선택
- 비활성 클러스터를 선택하면 데이터 카드 영역 위에 노란 배너 표시 (사유 + URL 표시), 데이터 호출 자체는 차단
- 운영자는 `GET /api/v1/system/cluster/{id}/diagnose`로 어떤 exporter가 빠졌는지 단일 응답으로 확인 가능

**진단 응답 예시**
```json
{
  "id": "ai-platform-k8s",
  "monitStatus": "ACTIVE",
  "checks": {
    "promReachable": { "ok": true },
    "kubeStateMetrics": { "ok": true, "value": 2 },
    "nodeExporter": { "ok": true, "value": 8 },
    "helmExporter": { "ok": true, "value": 14 },
    "dcgmExporter": { "ok": false, "message": "no metrics found" }
  },
  "samples": { "cpuTotalCores": 208, "memoryTotalGiB": 312.8, "gpuCapacity": 2 }
}
```

**유지보수 SQL**
```sql
-- placeholder/빈 URL을 가진 row 정리
DELETE FROM cluster
WHERE monit_server_url IS NULL
   OR monit_server_url LIKE '%@@%'
   OR monit_server_url = '';

-- 현재 모니터링 상태 확인
SELECT id, monit_server_url, monit_status, monit_last_check, monit_last_error FROM cluster;

-- 즉시 헬스체크 트리거
-- POST /api/v1/system/cluster/{id}/monit-health-check
```

### 9-5. 멀티클러스터 모니터링 주의사항

- 백엔드는 `cluster.monit_server_url` 값으로 Prometheus를 호출합니다. **각 클러스터는 자체 Prometheus 엔드포인트를 가져야** selector 전환 시 실제로 다른 데이터가 표시됩니다.
- 여러 클러스터 row가 동일한 `monit_server_url`을 가지면, 어떤 클러스터를 선택해도 같은 메트릭이 보입니다. (멀티클러스터 통합 Prometheus가 아닌 한 의도된 동작이 아님)
- 점검: `SELECT id, monit_server_url FROM cluster;` 로 URL이 placeholder(`@@MONIT_SERVER_URL@@`) 또는 중복인지 확인하세요.

## 10. 알려진 이슈

- **클러스터 드롭다운**: kubeconfig/DB에 등록된 모든 클러스터를 동적으로 조회하여 표시합니다. 모니터링 대시보드, 이벤트, 비용 최적화, 감사 로그, 헬름 릴리즈, 카탈로그(배포 모달) 모두 사용자가 클러스터를 직접 선택할 수 있으며, 첫 클러스터가 기본 선택됩니다. 네임스페이스도 선택된 클러스터의 실제 네임스페이스를 동적으로 fetch합니다 (감사 로그는 "전체" 옵션 지원).
- **bitnami 카탈로그 느림**: bitnami 저장소 차트 수가 많아 첫 로딩 시 지연이 발생합니다

---

## 11. 로그인 정보

| 항목 | 값 |
|------|-----|
| 아이디 | `admin` (아무 값 가능) |
| 비밀번호 | `1234` (아무 값 가능) |

> 현재 인증은 개발용 Mock으로 처리되어 있습니다. 실 운영 시 백엔드 AuthController 연동이 필요합니다.
