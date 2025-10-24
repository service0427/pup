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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: content_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_pricing (
    id integer NOT NULL,
    content_type character varying(20) NOT NULL,
    price integer NOT NULL,
    description character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT content_pricing_price_check CHECK ((price >= 0))
);


--
-- Name: content_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_pricing_id_seq OWNED BY public.content_pricing.id;


--
-- Name: point_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_balances (
    id integer NOT NULL,
    user_id integer NOT NULL,
    available_points integer DEFAULT 0 NOT NULL,
    pending_points integer DEFAULT 0 NOT NULL,
    total_earned integer DEFAULT 0 NOT NULL,
    total_spent integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT point_balances_available_points_check CHECK ((available_points >= 0)),
    CONSTRAINT point_balances_pending_points_check CHECK ((pending_points >= 0)),
    CONSTRAINT point_balances_total_earned_check CHECK ((total_earned >= 0)),
    CONSTRAINT point_balances_total_spent_check CHECK ((total_spent >= 0))
);


--
-- Name: point_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_requests (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    requested_amount integer NOT NULL,
    purpose text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT point_requests_requested_amount_check CHECK ((requested_amount > 0)),
    CONSTRAINT point_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamp with time zone,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    parent_id integer,
    tier_level integer DEFAULT 1,
    path text,
    permissions jsonb DEFAULT '{"can_use_service": true, "commission_rate": 0, "can_manage_users": false, "can_view_reports": false, "max_subordinates": 0, "can_view_all_data": false}'::jsonb,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['developer'::character varying, 'admin'::character varying, 'distributor'::character varying, 'advertiser'::character varying, 'writer'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[]))),
    CONSTRAINT users_tier_level_check CHECK (((tier_level >= 1) AND (tier_level <= 3)))
);


--
-- Name: login_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_logs (
    id integer NOT NULL,
    user_id integer,
    username character varying(50),
    ip_address inet,
    user_agent text,
    success boolean NOT NULL,
    failure_reason character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    metadata jsonb
);


--
-- Name: login_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_logs_id_seq OWNED BY public.login_logs.id;


--
-- Name: place_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_receipts (
    id integer NOT NULL,
    place_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    review_text text NOT NULL,
    images text[],
    auto_generate_image boolean DEFAULT false,
    status character varying(20) DEFAULT 'draft'::character varying,
    point_amount integer DEFAULT 0,
    point_status character varying(20) DEFAULT 'draft'::character varying,
    submitted_at timestamp without time zone,
    approved_at timestamp without time zone,
    approved_by integer,
    review_status character varying(20) DEFAULT 'pending'::character varying,
    review_url character varying(1000),
    review_url_registered_at timestamp without time zone,
    last_checked_at timestamp without time zone,
    deleted_detected_at timestamp without time zone,
    check_fail_count integer DEFAULT 0,
    last_check_status character varying(20),
    delete_requested_at timestamp without time zone,
    delete_request_reason text,
    rejected_reason text,
    rejected_at timestamp without time zone,
    rejected_by integer,
    delete_rejected_at timestamp without time zone,
    delete_rejected_reason text,
    delete_rejected_by integer,
    CONSTRAINT place_receipts_last_check_status_check CHECK (((last_check_status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'timeout'::character varying, 'error'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT place_receipts_point_status_check CHECK (((point_status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'approved'::character varying, 'cancelled'::character varying, 'rejected'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT place_receipts_review_status_check CHECK (((review_status)::text = ANY ((ARRAY['awaiting_post'::character varying, 'posted'::character varying, 'deleted_by_system'::character varying, 'deleted_by_request'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: COLUMN place_receipts.point_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.point_amount IS '사용된 포인트 금액';


--
-- Name: COLUMN place_receipts.point_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.point_status IS '포인트 상태: draft(임시), pending(승인대기), approved(승인완료), cancelled(사용자취소), rejected(관리자반려), refunded(자동환불)';


--
-- Name: COLUMN place_receipts.submitted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.submitted_at IS '제출 시간 (자동환불 기준 시간)';


--
-- Name: COLUMN place_receipts.approved_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.approved_at IS '승인 시간';


--
-- Name: COLUMN place_receipts.approved_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.approved_by IS '승인자 ID';


--
-- Name: COLUMN place_receipts.review_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.review_status IS '리뷰 게시 상태: awaiting_post(게시대기), posted(게시완료), deleted_by_system(시스템감지삭제), deleted_by_request(요청승인삭제), expired(만료)';


--
-- Name: COLUMN place_receipts.rejected_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.rejected_reason IS '관리자 반려 사유';


--
-- Name: COLUMN place_receipts.rejected_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.rejected_at IS '반려 일시';


--
-- Name: COLUMN place_receipts.rejected_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.rejected_by IS '반려한 관리자 ID';


--
-- Name: COLUMN place_receipts.delete_rejected_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.delete_rejected_at IS '삭제 요청 반려 일시';


--
-- Name: COLUMN place_receipts.delete_rejected_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.delete_rejected_reason IS '삭제 요청 반려 사유';


--
-- Name: COLUMN place_receipts.delete_rejected_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.place_receipts.delete_rejected_by IS '삭제 요청 반려한 관리자 ID';


--
-- Name: place_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.place_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: place_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.place_receipts_id_seq OWNED BY public.place_receipts.id;


--
-- Name: places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.places (
    id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    business_name character varying(255),
    place_url text,
    place_id character varying(255),
    place_type character varying(50),
    phone character varying(50),
    address text,
    status character varying(20) DEFAULT 'active'::character varying,
    remark text
);


--
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.places_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- Name: point_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.point_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: point_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.point_balances_id_seq OWNED BY public.point_balances.id;


--
-- Name: point_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.point_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: point_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.point_requests_id_seq OWNED BY public.point_requests.id;


--
-- Name: point_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    amount integer NOT NULL,
    balance_before integer NOT NULL,
    balance_after integer NOT NULL,
    related_work_id integer,
    related_request_id integer,
    description text NOT NULL,
    processed_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT point_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['earn'::character varying, 'spend'::character varying, 'admin_add'::character varying, 'admin_subtract'::character varying, 'transfer'::character varying, 'refund'::character varying])::text[])))
);


--
-- Name: COLUMN point_transactions.transaction_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.point_transactions.transaction_type IS '거래 유형: earn(적립), spend(사용), admin_add(관리자추가), admin_subtract(관리자차감), transfer(이전), refund(환불)';


--
-- Name: point_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.point_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: point_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.point_transactions_id_seq OWNED BY public.point_transactions.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(100) NOT NULL,
    user_id integer NOT NULL,
    ip_address inet,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    metadata jsonb
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    setting_key character varying(50) NOT NULL,
    setting_value text NOT NULL,
    description character varying(200),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE system_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.system_settings IS '시스템 전역 설정';


--
-- Name: COLUMN system_settings.setting_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_settings.setting_key IS '설정 키 (고유값)';


--
-- Name: COLUMN system_settings.setting_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_settings.setting_value IS '설정 값 (문자열로 저장)';


--
-- Name: COLUMN system_settings.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_settings.description IS '설정 설명';


--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: user_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_referrals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    referrer_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_referrals_id_seq OWNED BY public.user_referrals.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: content_pricing id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_pricing ALTER COLUMN id SET DEFAULT nextval('public.content_pricing_id_seq'::regclass);


--
-- Name: login_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_logs ALTER COLUMN id SET DEFAULT nextval('public.login_logs_id_seq'::regclass);


--
-- Name: place_receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_receipts ALTER COLUMN id SET DEFAULT nextval('public.place_receipts_id_seq'::regclass);


--
-- Name: places id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- Name: point_balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_balances ALTER COLUMN id SET DEFAULT nextval('public.point_balances_id_seq'::regclass);


--
-- Name: point_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_requests ALTER COLUMN id SET DEFAULT nextval('public.point_requests_id_seq'::regclass);


--
-- Name: point_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions ALTER COLUMN id SET DEFAULT nextval('public.point_transactions_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_referrals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referrals ALTER COLUMN id SET DEFAULT nextval('public.user_referrals_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: content_pricing content_pricing_content_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_pricing
    ADD CONSTRAINT content_pricing_content_type_key UNIQUE (content_type);


--
-- Name: content_pricing content_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_pricing
    ADD CONSTRAINT content_pricing_pkey PRIMARY KEY (id);


--
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (id);


--
-- Name: place_receipts place_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_receipts
    ADD CONSTRAINT place_receipts_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: point_balances point_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_balances
    ADD CONSTRAINT point_balances_pkey PRIMARY KEY (id);


--
-- Name: point_balances point_balances_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_balances
    ADD CONSTRAINT point_balances_user_id_key UNIQUE (user_id);


--
-- Name: point_requests point_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_requests
    ADD CONSTRAINT point_requests_pkey PRIMARY KEY (id);


--
-- Name: point_transactions point_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: user_referrals user_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referrals
    ADD CONSTRAINT user_referrals_pkey PRIMARY KEY (id);


--
-- Name: user_referrals user_referrals_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referrals
    ADD CONSTRAINT user_referrals_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_content_pricing_content_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_pricing_content_type ON public.content_pricing USING btree (content_type);


--
-- Name: idx_content_pricing_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_pricing_is_active ON public.content_pricing USING btree (is_active);


--
-- Name: idx_login_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_created_at ON public.login_logs USING btree (created_at);


--
-- Name: idx_login_logs_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_success ON public.login_logs USING btree (success);


--
-- Name: idx_login_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_user_id ON public.login_logs USING btree (user_id);


--
-- Name: idx_login_logs_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_logs_username ON public.login_logs USING btree (username);


--
-- Name: idx_place_receipts_delete_requested_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_receipts_delete_requested_at ON public.place_receipts USING btree (delete_requested_at) WHERE (delete_requested_at IS NOT NULL);


--
-- Name: idx_place_receipts_last_checked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_receipts_last_checked_at ON public.place_receipts USING btree (last_checked_at);


--
-- Name: idx_place_receipts_point_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_receipts_point_status ON public.place_receipts USING btree (point_status);


--
-- Name: idx_place_receipts_review_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_receipts_review_status ON public.place_receipts USING btree (review_status);


--
-- Name: idx_place_receipts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_receipts_submitted_at ON public.place_receipts USING btree (submitted_at);


--
-- Name: idx_point_balances_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_balances_user ON public.point_balances USING btree (user_id);


--
-- Name: idx_point_requests_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_requests_created ON public.point_requests USING btree (created_at DESC);


--
-- Name: idx_point_requests_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_requests_requester ON public.point_requests USING btree (requester_id);


--
-- Name: idx_point_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_requests_status ON public.point_requests USING btree (status);


--
-- Name: idx_point_transactions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_transactions_created ON public.point_transactions USING btree (created_at DESC);


--
-- Name: idx_point_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_transactions_type ON public.point_transactions USING btree (transaction_type);


--
-- Name: idx_point_transactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_transactions_user ON public.point_transactions USING btree (user_id);


--
-- Name: idx_referrals_referrer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referrer_id ON public.user_referrals USING btree (referrer_id);


--
-- Name: idx_referrals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_user_id ON public.user_referrals USING btree (user_id);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_system_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (setting_key);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_parent_id ON public.users USING btree (parent_id);


--
-- Name: idx_users_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_path ON public.users USING btree (path);


--
-- Name: idx_users_permissions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_permissions ON public.users USING gin (permissions);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_users_tier_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tier_level ON public.users USING btree (tier_level);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: content_pricing update_content_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_pricing_updated_at BEFORE UPDATE ON public.content_pricing FOR EACH ROW EXECUTE FUNCTION public.update_content_pricing_updated_at();


--
-- Name: point_balances update_point_balances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_point_balances_updated_at BEFORE UPDATE ON public.point_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: point_requests update_point_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_point_requests_updated_at BEFORE UPDATE ON public.point_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_system_settings_updated_at();


--
-- Name: users update_user_path_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_path_trigger BEFORE INSERT OR UPDATE OF parent_id ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_user_path();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: login_logs login_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: place_receipts place_receipts_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_receipts
    ADD CONSTRAINT place_receipts_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: place_receipts place_receipts_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_receipts
    ADD CONSTRAINT place_receipts_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: places places_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: point_balances point_balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_balances
    ADD CONSTRAINT point_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: point_requests point_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_requests
    ADD CONSTRAINT point_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: point_requests point_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_requests
    ADD CONSTRAINT point_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: point_transactions point_transactions_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: point_transactions point_transactions_related_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_related_request_id_fkey FOREIGN KEY (related_request_id) REFERENCES public.point_requests(id);


--
-- Name: point_transactions point_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_referrals user_referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referrals
    ADD CONSTRAINT user_referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_referrals user_referrals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referrals
    ADD CONSTRAINT user_referrals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

