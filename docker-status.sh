#!/usr/bin/env bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}SCOPTIX — Docker status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
docker compose --profile full ps
echo ""
BP=""
if [ -f .env ]; then
  BP=$(grep -E '^NEXT_PUBLIC_BASE_PATH=' .env | cut -d '=' -f 2- | tr -d '"' | tr -d "'" | tr -d ' ' || true)
fi

echo -e "${GREEN}URLs${NC}"
echo -e "  App:      ${YELLOW}http://localhost:${APP_PORT:-3000}${BP}${NC}"
echo -e "  Postgres: ${YELLOW}localhost:${POSTGRES_PORT:-5432}${NC}"
echo -e "  Redis:    ${YELLOW}localhost:${REDIS_PORT:-6379}${NC}"
echo ""
echo -e "${GREEN}Commands${NC}"
echo -e "  Logs:     ${YELLOW}docker compose --profile full logs -f${NC}"
echo -e "  Stop:     ${YELLOW}bash docker-stop.sh${NC}  or  ${YELLOW}npm run docker:down${NC}"
echo -e "  Infra:    ${YELLOW}bash docker-start-infra.sh${NC}  then  ${YELLOW}npm run dev:all${NC}"
echo ""
