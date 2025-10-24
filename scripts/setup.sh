#!/bin/bash

# ADR 데이터베이스 설정 스크립트
# 사용법: ./setup.sh [--with-sample]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================="
echo "ADR 데이터베이스 설정"
echo "================================="

# 샘플 데이터 포함 여부
WITH_SAMPLE=false
if [ "$1" = "--with-sample" ]; then
    WITH_SAMPLE=true
fi

# 1. 스키마 적용
echo -e "\n${YELLOW}1. 데이터베이스 스키마 생성${NC}"
PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 스키마 생성 완료${NC}"
else
    echo -e "${RED}✗ 스키마 생성 실패${NC}"
    exit 1
fi

# 2. 샘플 데이터 (선택사항)
if [ "$WITH_SAMPLE" = true ]; then
    echo -e "\n${YELLOW}2. 샘플 데이터 추가${NC}"
    PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f sample_data.sql

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 샘플 데이터 추가 완료${NC}"
    else
        echo -e "${RED}✗ 샘플 데이터 추가 실패${NC}"
    fi
fi

echo -e "\n================================="
echo -e "${GREEN}설정 완료!${NC}"
echo "================================="
echo ""
echo "접속 정보:"
echo "  Database: adr"
echo "  User: tech_adr"
echo "  Password: Tech1324!db"

if [ "$WITH_SAMPLE" = true ]; then
    echo ""
    echo "테스트 계정:"
    echo "  admin / password123!"
    echo "  writer01 / password123!"
fi

echo ""
echo "확인 명령:"
echo "  PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -c '\dt'"
echo "================================="