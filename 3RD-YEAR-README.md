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

## 9. 알려진 이슈

- **클러스터 드롭다운**: `innogrid-aikube` 단일 클러스터만 표시됩니다 (하드코딩이 아니며, DB에 1개만 등록되어 있습니다)
- **CPU/Memory 게이지 0%**: Docker Desktop에서 kube_pod_container_resource_requests 메트릭이 수집되지 않습니다 (실 서버에서는 정상 동작합니다)
- **bitnami 카탈로그 느림**: bitnami 저장소 차트 수가 많아 첫 로딩 시 지연이 발생합니다

---

## 10. 로그인 정보

| 항목 | 값 |
|------|-----|
| 아이디 | `admin` (아무 값 가능) |
| 비밀번호 | `1234` (아무 값 가능) |

> 현재 인증은 개발용 Mock으로 처리되어 있습니다. 실 운영 시 백엔드 AuthController 연동이 필요합니다.
