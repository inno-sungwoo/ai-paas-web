#!/bin/bash
# =============================================================================
# 3차년도 MLOps 플랫폼 — 프론트엔드 셋업
# 인수인계자가 이 스크립트로 프론트엔드를 바로 실행할 수 있습니다.
#
# 사용법:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
#
# 사전 요구사항:
#   - Node.js 20+ (brew install node)
#   - pnpm (npm install -g pnpm)
#   - 백엔드 서버 실행 중 (localhost:8888)
#     → 백엔드 레포(any-cloud-management)의 scripts/setup.sh 먼저 실행
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}[$1/$TOTAL_STEPS]${NC} $2"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }

TOTAL_STEPS=5

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   3차년도 MLOps 플랫폼 — 프론트엔드 셋업      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"

# ─────────────────────────────────────
# 1. 사전 검사
# ─────────────────────────────────────
step 1 "사전 요구사항 검사"

command -v node >/dev/null 2>&1 || fail "Node.js가 설치되어 있지 않습니다. brew install node"
NODE_VER=$(node -v)
ok "Node.js: $NODE_VER"

if command -v pnpm >/dev/null 2>&1; then
  PNPM_VER=$(pnpm -v)
  ok "pnpm: $PNPM_VER"
else
  echo "  pnpm 설치 중..."
  npm install -g pnpm
  ok "pnpm 설치 완료"
fi

# ─────────────────────────────────────
# 2. 브랜치 확인
# ─────────────────────────────────────
step 2 "Git 브랜치 확인"

cd "$REPO_DIR"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "feat/3rd-year-monitoring-ui" ]; then
  ok "브랜치: feat/3rd-year-monitoring-ui"
else
  warn "현재 브랜치: $CURRENT_BRANCH"
  echo -e "  ${YELLOW}feat/3rd-year-monitoring-ui로 전환하시겠습니까? (y/N)${NC}"
  read -r ans
  if [[ "$ans" =~ ^[Yy] ]]; then
    git checkout feat/3rd-year-monitoring-ui
    ok "브랜치 전환 완료"
  fi
fi

# ─────────────────────────────────────
# 3. 환경 변수
# ─────────────────────────────────────
step 3 "환경 변수 (.env.local)"

if [ ! -f "$REPO_DIR/.env.local" ]; then
  echo 'VITE_SERVER_URL=http://localhost:8888' > "$REPO_DIR/.env.local"
  ok ".env.local 생성 (VITE_SERVER_URL=http://localhost:8888)"
else
  ok ".env.local 이미 존재"
  grep -q "VITE_SERVER_URL" "$REPO_DIR/.env.local" && ok "VITE_SERVER_URL 설정됨" || warn "VITE_SERVER_URL 미설정"
fi

# ─────────────────────────────────────
# 4. 의존성 설치
# ─────────────────────────────────────
step 4 "의존성 설치 (pnpm install)"

cd "$REPO_DIR"
pnpm install
ok "의존성 설치 완료"

# ─────────────────────────────────────
# 5. 백엔드 연결 확인
# ─────────────────────────────────────
step 5 "백엔드 연결 확인"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/api/v1/system/clusters 2>/dev/null | grep -q "200"; then
  ok "백엔드 연결 정상 (localhost:8888)"
else
  warn "백엔드가 응답하지 않습니다 (localhost:8888)"
  echo -e "  ${YELLOW}백엔드를 먼저 시작하세요:${NC}"
  echo -e "  cd any-cloud-management && ./scripts/setup.sh"
  echo -e "  ./gradlew :anycloud:bootRun"
  echo ""
  echo -e "  ${YELLOW}백엔드 없이도 프론트엔드는 실행 가능합니다 (API 호출만 실패)${NC}"
fi

# ─────────────────────────────────────
# 완료
# ─────────────────────────────────────
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             프론트엔드 셋업 완료!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "프론트엔드 시작:"
echo -e "  ${BLUE}pnpm dev${NC}"
echo -e "  → http://localhost:5173"
echo ""
echo -e "로그인: admin / 1234 (아무 값 가능)"
echo ""
echo -e "시연 순서:"
echo -e "  1. 모니터링 대시보드 → GPU 현황 확인"
echo -e "  2. 카탈로그 → gpu-jupyter 배포 (chart-museum-external 선택)"
echo -e "  3. 보안 검사 → '그래도 배포' (Docker Desktop은 GPU 없음)"
echo -e "  4. 비용 추정 → 2분 설정 → 배포"
echo -e "  5. 비용 최적화 → 2분 후 초과 경고 확인"
echo -e "  6. 헬름 릴리즈 → 삭제"
echo -e "  7. 감사 로그 → K8s 이벤트"
echo ""
echo -e "상세 문서: ${BLUE}docs/HANDOVER.md${NC}"
