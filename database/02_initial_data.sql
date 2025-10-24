--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Homebrew)
-- Dumped by pg_dump version 16.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: content_pricing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_pricing (id, content_type, price, description, is_active, created_at, updated_at) FROM stdin;
1	receipt_review	2300	영수증 리뷰 컨텐츠	t	2025-09-23 14:51:57.01362+09	2025-10-21 00:33:59.258888+09
2	blog_content	5000	블로그 컨텐츠 발행	t	2025-09-23 14:51:57.01362+09	2025-10-21 00:34:05.730512+09
3	traffic	500	트래픽 (1건당)	t	2025-10-21 00:29:47.760447+09	2025-10-21 00:34:23.203611+09
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, setting_key, setting_value, description, created_at, updated_at) FROM stdin;
1	auto_refund_days	7	승인되지 않은 리뷰의 자동 환불 기간 (일)	2025-10-20 22:46:47.441452	2025-10-20 22:46:47.441452
2	review_require_approval	true	리뷰 제출 시 관리자 승인 필요 여부	2025-10-20 22:46:47.441452	2025-10-20 22:46:47.441452
\.


--
-- Name: content_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.content_pricing_id_seq', 3, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--

