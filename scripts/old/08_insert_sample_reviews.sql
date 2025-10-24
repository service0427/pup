-- =====================================================
-- receipt_reviews 테이블 샘플 데이터 50개 추가
-- =====================================================
-- 실행: PGPASSWORD='Tech1324!db' psql -U tech_adr -d adr -f scripts/08_insert_sample_reviews.sql

SET TIMEZONE TO 'Asia/Seoul';

-- 기존 샘플 데이터 삭제 (선택적)
-- DELETE FROM receipt_reviews WHERE id > 2;

-- 샘플 리뷰 데이터 추가
INSERT INTO receipt_reviews (
    receipt_id, advertiser_name, review_content, review_url, review_date,
    status, delete_requested, delete_request_date, delete_request_reason
) VALUES
-- 천막집포장마차 수원역점 리뷰들
(1, '천막집포장마차 수원역점', '분위기 진짜 좋고 안주도 맛있어요! 친구들이랑 시끄럽게 떠들어도 눈치 안보여서 좋았음', 'https://m.place.naver.com/my/review001', '2025-09-19 18:30:00', 'active', false, NULL, NULL),
(1, '천막집포장마차 수원역점', '회사 회식으로 갔는데 다들 만족했어요. 가격대비 양도 푸짐하고 맛도 괜찮았습니다', 'https://m.place.naver.com/my/review002', '2025-09-19 17:45:00', 'active', false, NULL, NULL),
(1, '천막집포장마차 수원역점', '주말에 친구들이랑 갔는데 역시나 붐비더라구요. 그래도 직원분들이 빨리빨리 챙겨주셔서 좋았어요', 'https://m.place.naver.com/my/review003', '2025-09-19 16:20:00', 'active', true, '2025-09-19 20:00:00', '내용 수정 필요'),
(1, '천막집포장마차 수원역점', '안주 종류가 다양해서 골라먹는 재미가 있네요. 특히 닭발이 맛있었어요!', 'https://m.place.naver.com/my/review004', '2025-09-19 15:10:00', 'active', false, NULL, NULL),
(1, '천막집포장마차 수원역점', '퇴근 후 가볍게 한잔하기 좋은 곳. 혼술하는 사람도 꽤 있어서 부담없이 갈 수 있어요', 'https://m.place.naver.com/my/review005', '2025-09-19 14:30:00', 'active', false, NULL, NULL),

-- 명륜진사갈비 강남역삼점 리뷰들
(2, '명륜진사갈비 강남역삼점', '무한리필 고기집 중에서는 퀄리티가 좋은 편이에요. 된장찌개도 맛있고요', 'https://m.place.naver.com/my/review006', '2025-09-19 13:20:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '가족 외식하기 좋아요. 아이들도 좋아하고 어른들도 만족스러웠습니다', 'https://m.place.naver.com/my/review007', '2025-09-19 12:15:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '점심특선 가성비 최고! 직장인들 점심 먹기 딱 좋은 곳이네요', 'https://m.place.naver.com/my/review008', '2025-09-19 11:45:00', 'active', true, '2025-09-19 15:30:00', '광고성 문구 제거 요청'),
(2, '명륜진사갈비 강남역삼점', '고기 질이 생각보다 괜찮았어요. 무한리필이라 기대 안했는데 의외로 맛있었습니다', 'https://m.place.naver.com/my/review009', '2025-09-19 10:30:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '서비스가 친절하고 빨라서 좋았어요. 고기도 금방금방 구워주시고', 'https://m.place.naver.com/my/review010', '2025-09-19 09:20:00', 'active', false, NULL, NULL),

-- 춘천산속에닭갈비 리뷰들
(1, '춘천산속에닭갈비', '춘천식 닭갈비 제대로 먹을 수 있는 곳! 양념이 자극적이지 않고 맛있어요', 'https://m.place.naver.com/my/review011', '2025-09-18 20:30:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '볶음밥은 필수로 드세요! 닭갈비도 맛있지만 볶음밥이 진짜 맛있습니다', 'https://m.place.naver.com/my/review012', '2025-09-18 19:45:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '양이 푸짐해서 좋아요. 3명이서 갔는데 3인분 시켜도 충분했어요', 'https://m.place.naver.com/my/review013', '2025-09-18 18:20:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '우동사리 추가는 꼭 하세요! 양념이랑 너무 잘 어울려요', 'https://m.place.naver.com/my/review014', '2025-09-18 17:10:00', 'active', true, '2025-09-18 21:00:00', '중복 리뷰'),
(1, '춘천산속에닭갈비', '주차장이 있어서 편해요. 차 가지고 가기 좋은 곳입니다', 'https://m.place.naver.com/my/review015', '2025-09-18 16:30:00', 'active', false, NULL, NULL),

-- 다양한 업체 리뷰들
(3, '선부종양동물의료센터', '우리 강아지 수술 잘 받았어요. 원장님이 정말 친절하고 실력도 좋으십니다', 'https://m.place.naver.com/my/review016', '2025-09-18 15:20:00', 'active', false, NULL, NULL),
(3, '선부종양동물의료센터', '설명을 자세하게 해주셔서 이해하기 쉬웠어요. 믿고 맡길 수 있는 병원', 'https://m.place.naver.com/my/review017', '2025-09-18 14:15:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '24시간 응급진료 가능해서 정말 다행이었어요. 새벽에 급하게 갔는데 잘 치료받았습니다', 'https://m.place.naver.com/my/review018', '2025-09-18 13:45:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '시설이 깨끗하고 최신 장비가 많아요. 검사도 정확하게 해주시고요', 'https://m.place.naver.com/my/review019', '2025-09-18 12:30:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '수의사 선생님들이 많아서 대기시간이 짧아요. 예약도 잘 되고요', 'https://m.place.naver.com/my/review020', '2025-09-18 11:20:00', 'active', true, '2025-09-18 14:00:00', '개인정보 포함'),

-- 추가 리뷰들
(1, '천막집포장마차 수원역점', '술 종류가 다양해서 좋아요. 특히 과일소주 종류가 많네요', 'https://m.place.naver.com/my/review021', '2025-09-17 20:30:00', 'active', false, NULL, NULL),
(1, '천막집포장마차 수원역점', '테이블 간격이 넓어서 옆테이블 신경 안써도 돼요', 'https://m.place.naver.com/my/review022', '2025-09-17 19:45:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '냉면도 무한리필이라 여름에 가기 좋아요', 'https://m.place.naver.com/my/review023', '2025-09-17 18:20:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '생일날 갔더니 케이크 서비스 해주셨어요. 감동!', 'https://m.place.naver.com/my/review024', '2025-09-17 17:10:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '매운맛 조절 가능해서 좋아요. 순한맛도 맛있어요', 'https://m.place.naver.com/my/review025', '2025-09-17 16:30:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '김치말이국수도 시원하고 맛있어요. 닭갈비랑 잘 어울려요', 'https://m.place.naver.com/my/review026', '2025-09-17 15:20:00', 'active', true, '2025-09-17 18:00:00', '오타 수정 필요'),
(3, '선부종양동물의료센터', 'CT, MRI 다 있어서 정밀검사 가능해요', 'https://m.place.naver.com/my/review027', '2025-09-17 14:15:00', 'active', false, NULL, NULL),
(3, '선부종양동물의료센터', '수술 후 관리도 체계적이에요. 안심하고 맡길 수 있었어요', 'https://m.place.naver.com/my/review028', '2025-09-17 13:45:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '주차장 넓어서 편해요. 발렛파킹도 해주시고요', 'https://m.place.naver.com/my/review029', '2025-09-17 12:30:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '고양이 전문 진료실이 따로 있어서 좋아요', 'https://m.place.naver.com/my/review030', '2025-09-17 11:20:00', 'active', false, NULL, NULL),

-- 더 많은 리뷰들
(1, '천막집포장마차 수원역점', '금요일 저녁은 정말 붐벼요. 예약하고 가세요!', 'https://m.place.naver.com/my/review031', '2025-09-16 20:30:00', 'active', false, NULL, NULL),
(1, '천막집포장마차 수원역점', '계절메뉴도 있어서 자주 가도 질리지 않아요', 'https://m.place.naver.com/my/review032', '2025-09-16 19:45:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '아이들 놀이방이 있어서 가족모임하기 좋아요', 'https://m.place.naver.com/my/review033', '2025-09-16 18:20:00', 'active', true, '2025-09-16 22:00:00', '사진 삭제 요청'),
(2, '명륜진사갈비 강남역삼점', '직원분들이 불판 자주 갈아주셔서 좋았어요', 'https://m.place.naver.com/my/review034', '2025-09-16 17:10:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '막국수도 시원하고 맛있어요. 여름 메뉴로 강추!', 'https://m.place.naver.com/my/review035', '2025-09-16 16:30:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '떡사리 추가 필수! 쫄깃쫄깃 맛있어요', 'https://m.place.naver.com/my/review036', '2025-09-16 15:20:00', 'active', false, NULL, NULL),
(3, '선부종양동물의료센터', '항암치료 전문이라 믿고 맡겼어요. 결과도 좋았습니다', 'https://m.place.naver.com/my/review037', '2025-09-16 14:15:00', 'active', false, NULL, NULL),
(3, '선부종양동물의료센터', '입원실도 깨끗하고 24시간 모니터링 해주셔서 안심됐어요', 'https://m.place.naver.com/my/review038', '2025-09-16 13:45:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '응급실이 있어서 급할때 정말 유용해요', 'https://m.place.naver.com/my/review039', '2025-09-16 12:30:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '수술 전 충분한 설명과 상담 감사했습니다', 'https://m.place.naver.com/my/review040', '2025-09-16 11:20:00', 'active', true, '2025-09-16 15:00:00', '타 병원 비교 내용 삭제'),

-- 마지막 10개 리뷰
(1, '천막집포장마차 수원역점', '화장실도 깨끗하게 관리되어 있어요', 'https://m.place.naver.com/my/review041', '2025-09-15 20:30:00', 'active', false, NULL, NULL),
(1, '천막집포장마차 수원역점', '배달도 되는지 몰랐는데 배달도 가능하네요!', 'https://m.place.naver.com/my/review042', '2025-09-15 19:45:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '샐러드바가 다양해서 좋아요. 과일도 신선하고요', 'https://m.place.naver.com/my/review043', '2025-09-15 18:20:00', 'active', false, NULL, NULL),
(2, '명륜진사갈비 강남역삼점', '예약 시스템이 잘 되어있어서 편리해요', 'https://m.place.naver.com/my/review044', '2025-09-15 17:10:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '포장도 깔끔하게 잘 해주세요. 집에서도 맛있게 먹었어요', 'https://m.place.naver.com/my/review045', '2025-09-15 16:30:00', 'active', false, NULL, NULL),
(1, '춘천산속에닭갈비', '사장님이 친절하시고 서비스도 많이 주세요', 'https://m.place.naver.com/my/review046', '2025-09-15 15:20:00', 'active', true, '2025-09-15 19:00:00', '과도한 홍보성 문구'),
(3, '선부종양동물의료센터', '다른 병원에서 포기했던 케이스인데 여기서 살렸어요. 감사합니다', 'https://m.place.naver.com/my/review047', '2025-09-15 14:15:00', 'active', false, NULL, NULL),
(3, '선부종양동물의료센터', '비용이 투명하게 안내되어서 좋았어요', 'https://m.place.naver.com/my/review048', '2025-09-15 13:45:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '대형견도 편하게 진료받을 수 있는 시설이에요', 'https://m.place.naver.com/my/review049', '2025-09-15 12:30:00', 'active', false, NULL, NULL),
(4, '탑스동물의료센터', '예방접종 스케줄 관리도 체계적으로 해주셔서 좋아요', 'https://m.place.naver.com/my/review050', '2025-09-15 11:20:00', 'active', false, NULL, NULL);

-- =====================================================
-- 데이터 확인
-- =====================================================
\echo '================================='
\echo '샘플 리뷰 데이터 추가 완료'
\echo '전체 리뷰 개수:'
SELECT COUNT(*) as total_reviews FROM receipt_reviews;
\echo '삭제 요청된 리뷰 개수:'
SELECT COUNT(*) as delete_requested_count FROM receipt_reviews WHERE delete_requested = true;
\echo '================================='