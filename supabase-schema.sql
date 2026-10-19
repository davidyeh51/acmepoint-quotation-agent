-- ==============================================================================
-- 進金生能源 6692 ｜ AI 智能報價協作平台 (AcmePoint AI Quotation Agent)
-- Supabase Database Schema & RLS Security Policies
-- ==============================================================================

-- 1. 客戶資料表 (Customers Master)
CREATE TABLE IF NOT EXISTS public.quote_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- 客戶公司名稱 (例如: 宇豐綠能股份有限公司)
    tax_id TEXT,                               -- 統一編號
    contact_person TEXT,                       -- 聯絡人 (例如: 廖基宏)
    contact_phone TEXT,                        -- 連絡電話 / 分機 (例如: 02-2717-4347#306)
    site_name TEXT,                            -- 案場名稱 (例如: 大安龜殼段)
    site_address TEXT,                         -- 裝置地址 (例如: 台中市大安區新龜壳段917地號)
    notes TEXT,                                -- 備註說明
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 協力廠商資料表 (Vendors Master)
CREATE TABLE IF NOT EXISTS public.quote_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- 廠商名稱 (例如: 保淨清潔有限公司)
    tax_id TEXT,                               -- 統一編號 (例如: 24758118)
    contact_person TEXT,                       -- 廠商業務/工班窗口 (例如: 劉勝利)
    contact_phone TEXT,                        -- 連絡電話 / 手機 (例如: 0932-643851)
    company_phone TEXT,                        -- 公司市話 (例如: 04-23395745)
    company_fax TEXT,                          -- 公司傳真 (例如: 04-23395851)
    address TEXT,                              -- 廠商地址 (例如: 台中市霧峰區民生路393之5號)
    bank_name TEXT,                            -- 匯款銀行 (例如: 台灣中小企業銀行 050 太平分行)
    bank_account TEXT,                         -- 匯款帳號 (例如: 470-12-267858)
    bank_account_name TEXT,                    -- 戶名 (例如: 保淨清潔有限公司)
    service_categories TEXT[],                 -- 服務類別 (例如: ['除草作業', '模組清洗', '鋸樹清運'])
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 廠商報價紀錄主表 (Vendor Quotations)
CREATE TABLE IF NOT EXISTS public.vendor_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_no TEXT,                             -- 廠商報價單號
    vendor_id UUID REFERENCES public.quote_vendors(id) ON DELETE SET NULL,
    vendor_name TEXT NOT NULL,                 -- 廠商名稱快照
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 報價日期
    project_name TEXT,                         -- 案場或工程項目名稱
    raw_content TEXT,                          -- 原始輸入文字或對話記錄
    file_url TEXT,                             -- 廠商報價 PDF / 圖檔連結
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 未稅總金額 (Cost)
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0,      -- 稅額
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- 含稅總計
    status TEXT NOT NULL DEFAULT 'PARSED',     -- PARSED (已拆解), REVIEWED (已轉業務單)
    engineer_name TEXT,                        -- 負責工程師/採購
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 廠商報價細項表 (Vendor Quotation Items)
CREATE TABLE IF NOT EXISTS public.vendor_quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_quote_id UUID REFERENCES public.vendor_quotes(id) ON DELETE CASCADE,
    item_index INT NOT NULL,                   -- 項次 (1, 2, 3...)
    item_name TEXT NOT NULL,                   -- 品名 / 工項名稱
    spec TEXT,                                 -- 規格說明
    unit TEXT NOT NULL DEFAULT '式',           -- 單位 (工, 式, 處, 台, m)
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,-- 數量
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 單價
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 複價/小計
    notes TEXT,                                -- 備註
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 業務銷售報價單主表 (Sales Quotations / B2B Quotes)
CREATE TABLE IF NOT EXISTS public.sales_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_no TEXT NOT NULL UNIQUE,             -- 我司報價單號 (例如: SQ-20261002-001)
    vendor_quote_id UUID REFERENCES public.vendor_quotes(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.quote_customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,               -- 客戶名稱 (例如: 宇豐綠能股份有限公司)
    site_name TEXT,                            -- 案場名稱 (例如: 宇豐綠能大安龜殼段)
    site_address TEXT,                         -- 裝置地址
    contact_person TEXT,                       -- 客戶聯絡窗口
    contact_phone TEXT,                        -- 客戶電話
    project_name TEXT NOT NULL,                -- 工程名稱 (例如: 宇豐綠能(大安龜殼段)-除草工程)
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 報價日期
    sales_rep TEXT NOT NULL,                   -- 負責業務 (例如: 鍾依靜#3273)
    valid_days INT NOT NULL DEFAULT 30,        -- 報價有效天數 (預設30天)
    
    -- 交易與工程條款
    delivery_terms TEXT DEFAULT '依雙方約定為主。',
    payment_terms TEXT DEFAULT 'EOM 60 Days',
    acceptance_terms TEXT DEFAULT '請於工程完工後7日內安排驗收，若未能於7日內安排驗收，則視為驗收合格。工程若因不可歸責我司之因致無法驗收時，其逾15日時視同正式驗收。',
    warranty_terms TEXT DEFAULT '依雙方約定',
    invoice_type TEXT DEFAULT '三聯式電子發票',
    
    -- 財務核心數值
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,     -- 廠商進貨總成本 (未稅)
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,       -- 銷售合計金額 (未稅)
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0,            -- 營業稅 5%
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 總計 (含稅)
    gross_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 毛利額 (subtotal - total_cost)
    margin_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,     -- 毛利率 %
    
    -- 打包模式標記 (true: 合併為1式報價; false: 保留分項報價)
    bundle_mode BOOLEAN NOT NULL DEFAULT true,
    bundle_item_name TEXT DEFAULT '除草工程',
    
    -- 業務流程狀態管理 (完整閉環)
    -- DRAFT (草稿), PENDING_REVIEW (待覆核), APPROVED (業務已核可), SENT (已發送客戶), SIGNED (客戶已回簽結案)
    status TEXT NOT NULL DEFAULT 'APPROVED',
    signed_file_url TEXT,                      -- 客戶回簽用印單據掃描/圖片
    signed_at TIMESTAMPTZ,                     -- 客戶回簽時間
    pdf_export_url TEXT,                       -- 產出之 PDF 檔
    excel_export_url TEXT,                     -- 產出之 Excel 檔
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 業務銷售報價單細項表 (Sales Quotation Items)
CREATE TABLE IF NOT EXISTS public.sales_quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_quote_id UUID REFERENCES public.sales_quotes(id) ON DELETE CASCADE,
    item_index INT NOT NULL,                   -- 項次
    item_name TEXT NOT NULL,                   -- 工程項目
    unit TEXT NOT NULL DEFAULT '式',           -- 單位
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,-- 數量
    cost_price NUMERIC(12, 2) DEFAULT 0,       -- 原始成本單價
    sales_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 對外銷售單價 (未稅)
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- 複價 (未稅)
    margin_rate NUMERIC(6, 2) DEFAULT 0,       -- 該項毛利率 %
    notes TEXT,                                -- 規格備註
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. RLS 行級安全設定 (Row Level Security)
-- 依據 github-supabase-web 規範，啟用 RLS 並開放 Client Key 授權訪問
-- ==============================================================================
ALTER TABLE public.quote_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quote_items ENABLE ROW LEVEL SECURITY;

-- 建立通用讀寫權限 Policies (支援 anon 和 authenticated 角色)
DO $$
BEGIN
    -- Customers
    DROP POLICY IF EXISTS "Allow anon customer read/write" ON public.quote_customers;
    CREATE POLICY "Allow anon customer read/write" ON public.quote_customers FOR ALL USING (true) WITH CHECK (true);
    
    -- Vendors
    DROP POLICY IF EXISTS "Allow anon vendor read/write" ON public.quote_vendors;
    CREATE POLICY "Allow anon vendor read/write" ON public.quote_vendors FOR ALL USING (true) WITH CHECK (true);
    
    -- Vendor Quotes
    DROP POLICY IF EXISTS "Allow anon vendor_quotes read/write" ON public.vendor_quotes;
    CREATE POLICY "Allow anon vendor_quotes read/write" ON public.vendor_quotes FOR ALL USING (true) WITH CHECK (true);
    
    -- Vendor Quote Items
    DROP POLICY IF EXISTS "Allow anon vendor_quote_items read/write" ON public.vendor_quote_items;
    CREATE POLICY "Allow anon vendor_quote_items read/write" ON public.vendor_quote_items FOR ALL USING (true) WITH CHECK (true);
    
    -- Sales Quotes
    DROP POLICY IF EXISTS "Allow anon sales_quotes read/write" ON public.sales_quotes;
    CREATE POLICY "Allow anon sales_quotes read/write" ON public.sales_quotes FOR ALL USING (true) WITH CHECK (true);
    
    -- Sales Quote Items
    DROP POLICY IF EXISTS "Allow anon sales_quote_items read/write" ON public.sales_quote_items;
    CREATE POLICY "Allow anon sales_quote_items read/write" ON public.sales_quote_items FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- 8. 預載種子資料 (Sample Seed Data)
-- 完美映射銷售單範本案例
-- ==============================================================================

-- 插入廠商：保淨清潔有限公司
INSERT INTO public.quote_vendors (id, name, tax_id, contact_person, contact_phone, company_phone, company_fax, address, bank_name, bank_account, bank_account_name, service_categories)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    '保淨清潔有限公司',
    '54789123',
    '劉勝利',
    '0932-643851',
    '(04)23395745',
    '(04)23395851',
    '台中市霧峰區民生路393之5號',
    '台灣中小企業銀行 050 太平分行',
    '470-12-267858',
    '保淨清潔有限公司',
    ARRAY['除草工程', '藤蔓清除', '樹木鋸除', '模組清洗']
) ON CONFLICT (id) DO NOTHING;

-- 插入客戶：宇豐綠能股份有限公司
INSERT INTO public.quote_customers (id, name, tax_id, contact_person, contact_phone, site_name, site_address, notes)
VALUES (
    'b1111111-1111-1111-1111-111111111111',
    '宇豐綠能股份有限公司',
    '83124567',
    '廖基宏',
    '02-2717-4347#306',
    '大安龜殼段',
    '台中市大安區新龜壳段917地號',
    '定期案場巡檢與除草保養客戶'
) ON CONFLICT (id) DO NOTHING;

-- 插入客戶：中租迪和股份有限公司
INSERT INTO public.quote_customers (id, name, tax_id, contact_person, contact_phone, site_name, site_address, notes)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    '中租迪和股份有限公司',
    '05072925',
    '陳副理',
    '02-8752-6388',
    '美傢家具鹿港廠1',
    '彰化縣鹿港鎮上林段598、599地號',
    '大型屋頂光電運維維保客戶'
) ON CONFLICT (id) DO NOTHING;

-- 插入廠商報價紀錄：大安龜殼-除草報價(保淨)
INSERT INTO public.vendor_quotes (id, quote_no, vendor_id, vendor_name, quote_date, project_name, subtotal, tax, total, status, engineer_name)
VALUES (
    'c1111111-1111-1111-1111-111111111111',
    'BJ-1151002-01',
    'a1111111-1111-1111-1111-111111111111',
    '保淨清潔有限公司',
    '2026-10-02',
    '大安龜殼-除草工程',
    24000,
    1200,
    25200,
    'REVIEWED',
    '李冠靜 資深經理'
) ON CONFLICT (id) DO NOTHING;

-- 插入廠商報價細項：5 項工項
INSERT INTO public.vendor_quote_items (vendor_quote_id, item_index, item_name, spec, unit, quantity, unit_price, total_price, notes)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 1, '模組區下方-除草作業', '光電模組下雜草割除清整', '工', 4, 2500, 10000, ''),
    ('c1111111-1111-1111-1111-111111111111', 2, '圍籬內外藤蔓雜草-清除作業', '攀附防護網藤蔓人工割除', '工', 2, 2500, 5000, ''),
    ('c1111111-1111-1111-1111-111111111111', 3, '圍籬外推 1 米 雜草 竹篙樹枝-清除 割除 作業', '邊界防護與遮蔭樹枝鋸除', '工', 1, 2500, 2500, ''),
    ('c1111111-1111-1111-1111-111111111111', 4, '吹葉機 清除作業', '清掃走道與碎草集中', '工', 1, 2500, 2500, ''),
    ('c1111111-1111-1111-1111-111111111111', 5, '管銷費', '現場管理工器具與耗材運輸', '式', 1, 4000, 4000, '')
ON CONFLICT DO NOTHING;

-- 插入業務銷售報價單：宇豐綠能(大安龜殼段)-除草工程
INSERT INTO public.sales_quotes (
    id, quote_no, vendor_quote_id, customer_id, customer_name, site_name, site_address,
    contact_person, contact_phone, project_name, quote_date, sales_rep, valid_days,
    total_cost, subtotal, tax, total_amount, gross_profit, margin_rate,
    bundle_mode, bundle_item_name, status
)
VALUES (
    'd1111111-1111-1111-1111-111111111111',
    'SQ-20261002-001',
    'c1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    '宇豐綠能股份有限公司',
    '大安龜殼段',
    '台中市大安區新龜壳段917地號',
    '廖基宏',
    '02-2717-4347#306',
    '宇豐綠能(大安龜殼段)-除草工程',
    '2026-10-02',
    '鍾依靜#3273',
    30,
    24000,
    45000,
    2250,
    47250,
    21000,
    46.67,
    true,
    '除草工程',
    'APPROVED'
) ON CONFLICT (id) DO NOTHING;

-- 插入業務銷售細項：打包模式 1 式 45,000
INSERT INTO public.sales_quote_items (sales_quote_id, item_index, item_name, unit, quantity, cost_price, sales_price, subtotal, margin_rate, notes)
VALUES (
    'd1111111-1111-1111-1111-111111111111',
    1,
    '除草工程',
    '式',
    1,
    24000,
    45000,
    45000,
    46.67,
    '含模組下方、內外圍籬藤蔓割除、外推1米竹篙樹枝清整與吹葉整理'
) ON CONFLICT DO NOTHING;
