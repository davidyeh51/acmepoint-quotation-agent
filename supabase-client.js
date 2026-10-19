/**
 * 進金生能源 6692 ｜ AI 智能報價協同平台
 * Supabase 集中管理模組 ＆ 本地離線儲存引擎 (Dual-Engine: Supabase BaaS + Local Fallback)
 */

// 預設專案連線設定（全團隊開箱即用）
window.DEFAULT_SUPABASE_CONFIG = window.DEFAULT_SUPABASE_CONFIG || {
  url: 'https://cowljafosekwvxithwjd.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2xqYWZvc2Vrd3Z4aXRod2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTYzODcsImV4cCI6MjA5NDIzMjM4N30.c8YXP7EXDeTOw-mJEmnYZ_DJeZv6Qt6HVDzEf8J2K_I'
};

// 初始種子客戶資料 (Fallback Seed Customers)
const SEED_CUSTOMERS = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    name: '宇豐綠能股份有限公司',
    tax_id: '83124567',
    contact_person: '廖基宏',
    contact_phone: '02-2717-4347#306',
    site_name: '大安龜殼段',
    site_address: '台中市大安區新龜壳段917地號',
    notes: '定期案場巡檢與除草保養客戶'
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    name: '中租迪和股份有限公司',
    tax_id: '05072925',
    contact_person: '陳副理',
    contact_phone: '02-8752-6388',
    site_name: '美傢家具鹿港廠1',
    site_address: '彰化縣鹿港鎮上林段598、599地號',
    notes: '大型屋頂光電運維維保客戶'
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    name: '森崴能源股份有限公司',
    tax_id: '28491823',
    contact_person: '黃工程師',
    contact_phone: '02-2269-9888',
    site_name: '台南學甲光儲案場',
    site_address: '台南市學甲區秀昌里125號',
    notes: '光儲一體化案場維運'
  }
];

// 初始種子協力廠商 (Fallback Seed Vendors)
const SEED_VENDORS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    name: '保淨清潔有限公司',
    tax_id: '54789123',
    contact_person: '劉勝利',
    contact_phone: '0932-643851',
    company_phone: '(04)23395745',
    company_fax: '(04)23395851',
    address: '台中市霧峰區民生路393之5號',
    bank_name: '台灣中小企業銀行 050 太平分行',
    bank_account: '470-12-267858',
    bank_account_name: '保淨清潔有限公司',
    service_categories: ['除草工程', '藤蔓清除', '樹木鋸除', '模組清洗']
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    name: '永欣水電工程行',
    tax_id: '48921034',
    contact_person: '林師傅',
    contact_phone: '0912-345678',
    company_phone: '(04)7256111',
    company_fax: '',
    address: '彰化縣鹿港鎮中山路88號',
    bank_name: '第一銀行 007 鹿港分行',
    bank_account: '231-10-098765',
    bank_account_name: '永欣水電工程行',
    service_categories: ['電器檢測', '逆變器查修', '線路重整']
  }
];

// 初始種子報價單資料 (銷售單範本案例)
const SEED_QUOTES = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    quote_no: 'SQ-20261002-001',
    customer_id: 'b1111111-1111-1111-1111-111111111111',
    customer_name: '宇豐綠能股份有限公司',
    site_name: '大安龜殼段',
    site_address: '台中市大安區新龜壳段917地號',
    contact_person: '廖基宏',
    contact_phone: '02-2717-4347#306',
    project_name: '宇豐綠能(大安龜殼段)-除草工程',
    quote_date: '2026-10-02',
    sales_rep: '鍾依靜#3273',
    valid_days: 30,
    delivery_terms: '依雙方約定為主。',
    payment_terms: 'EOM 60 Days',
    acceptance_terms: '請於工程完工後7日內安排驗收，若未能於7日內安排驗收，則視為驗收合格。工程若因不可歸責我司之因致無法驗收時，其逾15日時視同正式驗收。',
    warranty_terms: '依雙方約定',
    invoice_type: '三聯式電子發票',
    vendor_name: '保淨清潔有限公司',
    total_cost: 24000,
    subtotal: 45000,
    tax: 2250,
    total_amount: 47250,
    gross_profit: 21000,
    margin_rate: 46.67,
    bundle_mode: true,
    bundle_item_name: '除草工程',
    status: 'APPROVED', // 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT', 'SIGNED'
    created_at: '2026-10-02T08:30:00Z',
    items: [
      {
        item_index: 1,
        item_name: '除草工程',
        unit: '式',
        quantity: 1,
        cost_price: 24000,
        sales_price: 45000,
        subtotal: 45000,
        margin_rate: 46.67,
        notes: '含模組下方、內外圍籬藤蔓割除、外推1米竹篙樹枝清整與吹葉整理'
      }
    ],
    vendor_breakdown: [
      { item_name: '模組區下方-除草作業', unit: '工', quantity: 4, unit_price: 2500, total_price: 10000 },
      { item_name: '圍籬內外藤蔓雜草-清除作業', unit: '工', quantity: 2, unit_price: 2500, total_price: 5000 },
      { item_name: '圍籬外推 1 米 雜草 竹篙樹枝-清除 割除 作業', unit: '工', quantity: 1, unit_price: 2500, total_price: 2500 },
      { item_name: '吹葉機 清除作業', unit: '工', quantity: 1, unit_price: 2500, total_price: 2500 },
      { item_name: '管銷費', unit: '式', quantity: 1, unit_price: 4000, total_price: 4000 }
    ]
  }
];

let supabaseInstance = null;

const SupabaseQuoteService = {
  getStoredConfig() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('sb_url');
      const anonKey = urlParams.get('sb_key');
      if (urlKey && anonKey) {
        localStorage.setItem('AP_QUOTE_SB_URL', urlKey);
        localStorage.setItem('AP_QUOTE_SB_KEY', anonKey);
        return { url: urlKey, anonKey: anonKey };
      }
      const localUrl = localStorage.getItem('AP_QUOTE_SB_URL');
      const localKey = localStorage.getItem('AP_QUOTE_SB_KEY');
      if (localUrl && localKey) {
        return { url: localUrl, anonKey: localKey };
      }
    } catch(e) {
      console.warn('Config read error:', e);
    }
    return window.DEFAULT_SUPABASE_CONFIG;
  },

  setStoredConfig(url, anonKey) {
    if (!url || !anonKey) return false;
    localStorage.setItem('AP_QUOTE_SB_URL', url);
    localStorage.setItem('AP_QUOTE_SB_KEY', anonKey);
    supabaseInstance = null;
    return true;
  },

  getClient() {
    if (supabaseInstance) return supabaseInstance;
    const config = this.getStoredConfig();
    if (window.supabase && config.url && config.anonKey) {
      try {
        supabaseInstance = window.supabase.createClient(config.url, config.anonKey);
        return supabaseInstance;
      } catch (err) {
        console.error('Supabase client creation error:', err);
      }
    }
    return null;
  },

  // 檢查連線狀態
  async checkConnection() {
    const client = this.getClient();
    if (!client) return { connected: false, mode: 'local', error: 'No client configured' };
    try {
      const { data, error } = await client.from('quote_customers').select('count', { count: 'exact', head: true });
      if (error) throw error;
      return { connected: true, mode: 'cloud' };
    } catch(err) {
      console.warn('Cloud connection check failed, operating in local-hybrid mode:', err);
      return { connected: false, mode: 'fallback', error: err.message };
    }
  },

  // --- 客戶 API ---
  async getCustomers() {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.from('quote_customers').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch(e) {
        console.warn('Using local customers fallback:', e);
      }
    }
    // 本地快取
    const local = localStorage.getItem('AP_CUSTOMERS_CACHE');
    if (local) {
      try { return JSON.parse(local); } catch(e){}
    }
    localStorage.setItem('AP_CUSTOMERS_CACHE', JSON.stringify(SEED_CUSTOMERS));
    return SEED_CUSTOMERS;
  },

  async saveCustomer(cust) {
    const client = this.getClient();
    let saved = null;
    if (client) {
      try {
        const { data, error } = await client.from('quote_customers').upsert([cust]).select();
        if (!error && data && data[0]) saved = data[0];
      } catch(e) {
        console.warn('Save customer to cloud failed:', e);
      }
    }
    if (!saved) {
      saved = { ...cust, id: cust.id || ('cust-' + Date.now()) };
    }
    // 更新本地快取
    const list = await this.getCustomers();
    const idx = list.findIndex(c => c.id === saved.id || c.name === saved.name);
    if (idx >= 0) list[idx] = saved; else list.unshift(saved);
    localStorage.setItem('AP_CUSTOMERS_CACHE', JSON.stringify(list));
    return saved;
  },

  // --- 廠商 API ---
  async getVendors() {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.from('quote_vendors').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch(e) {
        console.warn('Using local vendors fallback:', e);
      }
    }
    const local = localStorage.getItem('AP_VENDORS_CACHE');
    if (local) {
      try { return JSON.parse(local); } catch(e){}
    }
    localStorage.setItem('AP_VENDORS_CACHE', JSON.stringify(SEED_VENDORS));
    return SEED_VENDORS;
  },

  async saveVendor(vendor) {
    const client = this.getClient();
    let saved = null;
    if (client) {
      try {
        const { data, error } = await client.from('quote_vendors').upsert([vendor]).select();
        if (!error && data && data[0]) saved = data[0];
      } catch(e) {
        console.warn('Save vendor to cloud failed:', e);
      }
    }
    if (!saved) {
      saved = { ...vendor, id: vendor.id || ('vend-' + Date.now()) };
    }
    const list = await this.getVendors();
    const idx = list.findIndex(v => v.id === saved.id || v.name === saved.name);
    if (idx >= 0) list[idx] = saved; else list.unshift(saved);
    localStorage.setItem('AP_VENDORS_CACHE', JSON.stringify(list));
    return saved;
  },

  // --- 報價單 API ---
  async getSalesQuotes() {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('sales_quotes')
          .select('*, sales_quote_items(*)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(q => ({
            ...q,
            items: q.sales_quote_items || []
          }));
        }
      } catch(e) {
        console.warn('Using local quotes fallback:', e);
      }
    }
    const local = localStorage.getItem('AP_QUOTES_CACHE');
    if (local) {
      try { return JSON.parse(local); } catch(e){}
    }
    localStorage.setItem('AP_QUOTES_CACHE', JSON.stringify(SEED_QUOTES));
    return SEED_QUOTES;
  },

  async saveSalesQuote(quoteData, items = []) {
    const client = this.getClient();
    let quoteId = quoteData.id || ('sq-' + Date.now());
    let savedQuote = { ...quoteData, id: quoteId };

    if (client) {
      try {
        const payload = {
          quote_no: quoteData.quote_no,
          customer_id: quoteData.customer_id,
          customer_name: quoteData.customer_name,
          site_name: quoteData.site_name,
          site_address: quoteData.site_address,
          contact_person: quoteData.contact_person,
          contact_phone: quoteData.contact_phone,
          project_name: quoteData.project_name,
          quote_date: quoteData.quote_date,
          sales_rep: quoteData.sales_rep,
          valid_days: quoteData.valid_days || 30,
          delivery_terms: quoteData.delivery_terms,
          payment_terms: quoteData.payment_terms,
          acceptance_terms: quoteData.acceptance_terms,
          warranty_terms: quoteData.warranty_terms,
          invoice_type: quoteData.invoice_type,
          total_cost: quoteData.total_cost || 0,
          subtotal: quoteData.subtotal || 0,
          tax: quoteData.tax || 0,
          total_amount: quoteData.total_amount || 0,
          gross_profit: quoteData.gross_profit || 0,
          margin_rate: quoteData.margin_rate || 0,
          bundle_mode: quoteData.bundle_mode ?? true,
          bundle_item_name: quoteData.bundle_item_name || '除草工程',
          status: quoteData.status || 'APPROVED'
        };
        if (quoteData.id && !quoteData.id.startsWith('sq-')) {
          payload.id = quoteData.id;
        }

        const { data, error } = await client.from('sales_quotes').upsert([payload]).select();
        if (!error && data && data[0]) {
          savedQuote = data[0];
          quoteId = savedQuote.id;
          // 儲存明細
          if (items && items.length > 0) {
            await client.from('sales_quote_items').delete().eq('sales_quote_id', quoteId);
            const itemPayloads = items.map((it, idx) => ({
              sales_quote_id: quoteId,
              item_index: idx + 1,
              item_name: it.item_name,
              unit: it.unit || '式',
              quantity: it.quantity || 1,
              cost_price: it.cost_price || 0,
              sales_price: it.sales_price || 0,
              subtotal: it.subtotal || 0,
              margin_rate: it.margin_rate || 0,
              notes: it.notes || ''
            }));
            await client.from('sales_quote_items').insert(itemPayloads);
          }
        }
      } catch(e) {
        console.warn('Save quote to cloud failed:', e);
      }
    }

    savedQuote.items = items;
    // 更新本地快取
    const list = await this.getSalesQuotes();
    const idx = list.findIndex(q => q.id === savedQuote.id || q.quote_no === savedQuote.quote_no);
    if (idx >= 0) list[idx] = savedQuote; else list.unshift(savedQuote);
    localStorage.setItem('AP_QUOTES_CACHE', JSON.stringify(list));
    return savedQuote;
  },

  async updateQuoteStatus(id, newStatus, signedFileUrl = null) {
    const client = this.getClient();
    if (client) {
      try {
        const updateData = { status: newStatus };
        if (signedFileUrl) {
          updateData.signed_file_url = signedFileUrl;
          updateData.signed_at = new Date().toISOString();
        }
        await client.from('sales_quotes').update(updateData).eq('id', id);
      } catch(e) {
        console.warn('Update cloud status failed:', e);
      }
    }
    const list = await this.getSalesQuotes();
    const item = list.find(q => q.id === id);
    if (item) {
      item.status = newStatus;
      if (signedFileUrl) {
        item.signed_file_url = signedFileUrl;
        item.signed_at = new Date().toISOString();
      }
      localStorage.setItem('AP_QUOTES_CACHE', JSON.stringify(list));
    }
    return item;
  },

  async deleteSalesQuote(id) {
    const client = this.getClient();
    if (client) {
      try {
        await client.from('sales_quotes').delete().eq('id', id);
      } catch(e) {
        console.warn('Delete cloud quote failed:', e);
      }
    }
    let list = await this.getSalesQuotes();
    list = list.filter(q => q.id !== id);
    localStorage.setItem('AP_QUOTES_CACHE', JSON.stringify(list));
    return true;
  }
};
