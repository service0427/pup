#!/bin/bash

# =====================================================
# ADR 데이터베이스 전체 설정 스크립트
# =====================================================

echo "================================="
echo "ADR 데이터베이스 설정 시작"
echo "================================="

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PostgreSQL 슈퍼유저
SUPERUSER="choijinho"

# 1. 데이터베이스 및 사용자 생성
echo -e "\n${YELLOW}1. 데이터베이스 및 사용자 생성${NC}"
psql -U $SUPERUSER -d postgres -f 01_create_database.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 데이터베이스 생성 완료${NC}"
else
    echo -e "${RED}✗ 데이터베이스 생성 실패${NC}"
    exit 1
fi

# 2. 테이블 생성
echo -e "\n${YELLOW}2. 테이블 생성${NC}"
psql -U tech_adr -d adr -f 02_create_tables.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 테이블 생성 완료${NC}"
else
    echo -e "${RED}✗ 테이블 생성 실패${NC}"
    exit 1
fi

# 3. pgcrypto extension 설치 (bcrypt 지원용)
echo -e "\n${YELLOW}3. pgcrypto extension 설치${NC}"
psql -U $SUPERUSER -d adr -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ pgcrypto 설치 완료${NC}"
else
    echo -e "${RED}✗ pgcrypto 설치 실패${NC}"
fi

# 4. 초기 데이터 입력
echo -e "\n${YELLOW}4. 초기 데이터 입력${NC}"
psql -U tech_adr -d adr -f 03_insert_initial_data.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 초기 데이터 입력 완료${NC}"
else
    echo -e "${RED}✗ 초기 데이터 입력 실패${NC}"
    exit 1
fi

# 5. 함수 생성
echo -e "\n${YELLOW}5. 함수 및 프로시저 생성${NC}"
psql -U tech_adr -d adr -f 04_create_functions.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 함수 생성 완료${NC}"
else
    echo -e "${RED}✗ 함수 생성 실패${NC}"
    exit 1
fi

echo -e "\n================================="
echo -e "${GREEN}데이터베이스 설정 완료!${NC}"
echo "================================="
echo ""
echo "접속 정보:"
echo "  Database: adr"
echo "  User: tech_adr"
echo "  Password: Tech1324!db"
echo ""
echo "관리자 계정:"
echo "  admin / admin123"
echo "  operator1 / admin123"
echo ""
echo "테스트 명령:"
echo "  psql -U tech_adr -d adr"
echo "================================="