# 3차년도 프론트엔드 인수인계 가이드

> **브랜치**: `feat/3rd-year-monitoring-ui`
> **주제**: 카탈로그 기반 MLOps 개발 환경 자동 구축 기술 — 최적화 및 고도화
> **변경 규모**: 60 files changed, 6,922 insertions, 650 deletions

이 문서 하나로 ai-pass-3 레포 없이 프론트엔드 인수인계가 가능합니다.
인프라/백엔드 셋업은 백엔드 레포(`any-cloud-management`)의 `docs/HANDOVER.md`를 참조하세요.

---

## 1. 환경 구축

### 1.1 사전 요구사항

| 항목 | 버전 | 설치 |
|------|------|------|
| Node.js | 20+ | `brew install node` |
| pnpm | 9+ | `npm install -g pnpm` |
| 백엔드 서버 | 실행 중 | `any-cloud-management` 레포의 `scripts/setup.sh` 참조 |

### 1.2 실행

```bash
git checkout feat/3rd-year-monitoring-ui
pnpm install
pnpm dev
# → http://localhost:5173
```

### 1.3 환경 변수

`.env.local`:
```
VITE_SERVER_URL=http://localhost:8888
```

---

## 2. 신규 페이지

| 페이지 | URL | 파일 |
|--------|-----|------|
| 모니터링 대시보드 | `/infra-management/monitoring-dashboard` | `pages/infra-management/monitoring-dashboard/page.tsx` |
| 카탈로그 | `/infra-management/application/catalog` | `pages/infra-management/application/catalog/page.tsx` |
| 헬름 릴리즈 | `/infra-management/application/helm-release` | `pages/infra-management/application/helm-release/page.tsx` |
| 비용 최적화 | `/infra-management/cost-optimization` | `pages/infra-management/cost-optimization/page.tsx` |
| 감사 로그 | `/infra-management/audit-log` | `pages/infra-management/audit-log/page.tsx` |

---

## 3. 신규 컴포넌트

### 카탈로그 / 배포

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `DeployCatalogModal` | `components/features/catalog/DeployCatalogModal.tsx` | 배포 모달 (폼→보안검사→비용추정→배포) |
| `SecurityCheckPopup` | `components/features/catalog/SecurityCheckPopup.tsx` | values.yaml 보안 검사 팝업 |

### 비용 관리

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `DeploymentEstimateModal` | `components/features/cost/DeploymentEstimateModal.tsx` | 비용 추정 (분/시간/일 단위, 누적 프리셋, 수식 시각화, DB 예약) |
| `GpuOverrunBanner` | `components/features/cost/GpuOverrunBanner.tsx` | GPU 사용 시간 초과 경고 배너 (DB API, 10초 갱신) |
| `CostSummaryChart` | `components/features/cost/CostSummaryChart.tsx` | NS별 GPU 비용 바 차트 |
| `UsageReportTable` | `components/features/cost/UsageReportTable.tsx` | 7일 사용 리포트 |
| `IdleWarningBanner` | `components/features/cost/IdleWarningBanner.tsx` | 유휴 GPU 경고 배너 |

### 모니터링

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `GpuStatusTable` | `components/features/monitoring/GpuStatusTable.tsx` | GPU 현황 테이블 |
| `HelmReleaseTable` | `components/features/monitoring/HelmReleaseTable.tsx` | 릴리즈 현황 테이블 |

### 공통 UI

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| `ConfirmModal` | `components/ui/confirm-modal.tsx` | 커스텀 삭제 확인 모달 (danger variant) |
| `Toast` | `components/ui/toast.tsx` | Toast 알림 (성공/실패/경고/정보, 3초 자동 소멸) |
| `Skeleton` | `components/ui/skeleton.tsx` | 로딩 스켈레톤 |

---

## 4. API Hooks

### `hooks/service/monitoring.ts`

| Hook | 용도 | 갱신 |
|------|------|------|
| `useGetMonitoringSummary` | 대시보드 4개 카드 | 30초 |
| `useGetMonitoringReleases` | 릴리즈 목록 | 30초 |
| `useGetMonitoringAlerts` | 활성 알림 | 30초 |
| `useGetNodeResourceUsage` | 게이지 차트 | - |

### `hooks/service/cost.ts`

| Hook | 용도 |
|------|------|
| `useGetCostSummary` | NS별 비용 요약 |
| `useGetIdleWarnings` | 유휴 GPU 경고 |
| `useGetCostReport` | 7일 사용 리포트 |
| `useGetCostEstimate` | 배포 비용 추정 |
| `useGetGpuReservations` | GPU 예약 목록 (10초 갱신) |
| `useCreateGpuReservation` | 예약 등록 (mutation) |
| `useExtendGpuReservation` | 예약 연장 (mutation) |

### `hooks/service/audit.ts`

| Hook | 용도 |
|------|------|
| `useGetAuditEvents` | K8s 이벤트 |

### `hooks/service/catalog.ts`

| Hook | 용도 |
|------|------|
| `useGetHelmRepos` | Helm 저장소 목록 |
| `useGetCharts` | 차트 목록 |
| `useGetChartValues` | values.yaml |
| `useDeployChart` | 차트 배포 (mutation) |

---

## 5. 유틸리티

| 파일 | 설명 |
|------|------|
| `util/checkYamlSecurity.ts` | values.yaml 보안 검사 (루트 권한, GPU 제한) + autoFixYaml 자동 수정 |
| `util/gpuReservation.ts` | GPU 예약 유틸 (DB 전환 후 미사용, localStorage 잔존) |

---

## 6. 배포 플로우 (시퀀스)

```
사용자
  ├─ 카탈로그에서 차트 선택 → "배포" 클릭
  ├─ 배포 모달: 릴리즈명 입력, values.yaml 편집 → "배포"
  ├─ [프론트] checkYamlSecurity() → 보안 검사 팝업
  │   ├─ "자동 수정 적용" → privileged:false + GPU limit 추가
  │   ├─ "직접 수정" → 모달로 복귀
  │   └─ "그래도 배포" → 다음 단계
  ├─ DeploymentEstimateModal → 비용 추정
  │   ├─ GPU × 시간 × 단가 = 예상 비용
  │   └─ "배포" 클릭
  ├─ [백엔드] POST /cost/reservations → GPU 예약 DB 저장
  ├─ [백엔드] POST /charts/deploy → helm install
  ├─ [K8s] Pod + Ingress → <릴리즈명>.aipaas 접근 가능
  ├─ [비용 최적화] 예약 시간 초과 → 빨간 배너 + 초과 비용
  │   ├─ "24h 연장" → 예약 연장
  │   └─ "릴리즈 정리" → 헬름 릴리즈 페이지
  └─ [헬름 릴리즈] "삭제" → 확인 모달 → helm uninstall → Toast
```

### 삭제 UX 플로우

```
삭제 버튼 → ConfirmModal (빨간 경고) → "삭제"
  ├─ Badge: "삭제 중…" (노란)
  ├─ DELETE /charts/releases/{name}
  │   ├─ 성공 → Toast (초록) + hiddenNames 60초 숨김
  │   └─ 실패 → Toast (빨강) + 에러 배너
```

### Query Invalidation

| 이벤트 | 갱신되는 queryKey |
|--------|-----------------|
| 배포 성공 | `charts`, `monitoring`, `cost` |
| 삭제 성공 | `charts`, `cost` (monitoring은 60초 후) |
| 페이지 자동 갱신 | `monitoring.*` (30초) |

---

## 7. 사이드바 메뉴

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

## 8. 알려진 이슈

- **클러스터 드롭다운**: `innogrid-aikube` 단일 클러스터만 표시 (DB에 1개 등록)
- **CPU/Memory 게이지 0%**: Docker Desktop에서 `kube_pod_container_resource_requests` 미수집 (실 서버 정상)
- **bitnami 카탈로그 느림**: 차트 수가 많아 첫 로딩 지연
- **GPU limit + Docker Desktop**: 보안 자동 수정 시 GPU limit 추가 → Pod Pending (실 GPU 서버에서는 정상)
- **비용 추정 소수 시간**: 백엔드 int 파라미터 → 프론트에서 1시간 단가 조회 후 로컬 계산

---

## 9. 시연 플로우

1. 로그인 (admin/1234) → 모니터링 대시보드
2. GPU 현황 (4개 GPU, 활용률 ~50%)
3. 카탈로그 → gpu-jupyter 배포
4. 보안 검사 → **"그래도 배포"** (Docker Desktop은 GPU 없음)
5. 비용 추정 → 2분 설정 → 배포
6. http://gpu-jupyter-demo.aipaas 접속 (토큰: demo1234)
7. 2분 대기 → 비용 최적화에서 초과 경고
8. 헬름 릴리즈 → 삭제 → Toast 확인
9. 비용 최적화 → 일/월 비용
10. 감사 로그 → K8s 이벤트

---

## 10. 접속 정보

| 항목 | URL |
|------|-----|
| 포털 | http://localhost:5173 (admin/1234) |
| 백엔드 API | http://localhost:8888/api/v1 |
| Swagger UI | http://localhost:8888/api/v1/docs |
| Prometheus | http://prometheus.aipaas |
| ChartMuseum | http://localhost:8880 |
| 배포 서비스 | http://<릴리즈명>.aipaas |
