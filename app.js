/**
 * 進金生能源 6692 ｜ AI 智能報價協同平台
 * 前端核心業務邏輯控制器 (App Controller)
 */

// 全局狀態管理
const AppState = {
  activeTab: 'ai-agent',
  activeSalesRep: '鍾依靜#3273',
  customers: [],
  vendors: [],
  quotes: [],
  uploadedFile: null,
  
  // AI 解析出來的廠商底層資料
  parsedVendorData: {
    vendor_name: '保淨清潔有限公司',
    contact_person: '劉勝利',
    contact_phone: '0932-643851',
    project_name: '大安龜殼-除草工程',
    quote_date: '2026-10-02',
    subtotal: 24000,
    tax: 1200,
    total: 25200,
    items: [
      { item_index: 1, item_name: '模組區下方-除草作業', unit: '工', quantity: 4, unit_price: 2500, total_price: 10000, notes: '' },
      { item_index: 2, item_name: '圍籬內外藤蔓雜草-清除作業', unit: '工', quantity: 2, unit_price: 2500, total_price: 5000, notes: '' },
      { item_index: 3, item_name: '圍籬外推 1 米 雜草 竹篙樹枝-清除 割除 作業', unit: '工', quantity: 1, unit_price: 2500, total_price: 2500, notes: '' },
      { item_index: 4, item_name: '吹葉機 清除作業', unit: '工', quantity: 1, unit_price: 2500, total_price: 2500, notes: '' },
      { item_index: 5, item_name: '管銷費', unit: '式', quantity: 1, unit_price: 4000, total_price: 4000, notes: '' }
    ]
  },

  // 業務工作站當前定價狀態
  workstation: {
    quoteId: 'd1111111-1111-1111-1111-111111111111',
    quoteNo: 'SQ-20261002-001',
    customerId: 'b1111111-1111-1111-1111-111111111111',
    customerName: '宇豐綠能股份有限公司',
    siteName: '大安龜殼段',
    siteAddress: '台中市大安區新龜壳段917地號',
    contactPerson: '廖基宏',
    contactPhone: '02-2717-4347#306',
    projectName: '宇豐綠能(大安龜殼段)-除草工程',
    quoteDate: '2026-10-02',
    salesRep: '鍾依靜#3273',
    bundleMode: true,
    bundleItemName: '除草工程',
    totalCost: 24000,
    subtotal: 45000,
    marginRate: 46.67,
    tax: 2250,
    totalAmount: 47250,
    grossProfit: 21000,
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
    terms: {
      delivery: '依雙方約定為主。',
      payment: 'EOM 60 Days',
      acceptance: '請於工程完工後7日內安排驗收，若未能於7日內安排驗收，則視為驗收合格。工程若因不可歸責我司之因致無法驗收時，其逾15日時視同正式驗收。',
      warranty: '依雙方約定',
      validDays: 30,
      invoice: '三聯式電子發票'
    }
  },

  selectedQuoteForSigned: null
};

// 頁面初始化
document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

async function initApp() {
  console.log('🚀 初始化 AcmePoint AI 報價協同平台...');

  // 1. 檢查 Supabase 連線
  updateCloudIndicator('connecting', '連線中...');
  const conn = await SupabaseQuoteService.checkConnection();
  if (conn.connected) {
    updateCloudIndicator('connected', 'Supabase 雲端即時同步');
  } else {
    updateCloudIndicator('fallback', '混合離線快取運行中');
  }

  // 2. 載入客戶、廠商與報價單紀錄
  AppState.customers = await SupabaseQuoteService.getCustomers();
  AppState.vendors = await SupabaseQuoteService.getVendors();
  AppState.quotes = await SupabaseQuoteService.getSalesQuotes();

  // 3. 渲染客戶下拉選單
  renderCustomerSelect();

  // 4. 初始化工作站預設展示
  updateWorkstationUI();

  // 5. 渲染報價單總覽與主檔列表
  renderQuoteLedger();
  renderMasterData();

  // 6. 渲染 AI 即時萃取卡片
  renderAiExtractionResult(AppState.parsedVendorData);
}

// 狀態指示燈更新
function updateCloudIndicator(status, text) {
  const dot = document.getElementById('cloud-indicator-dot');
  const txt = document.getElementById('cloud-indicator-text');
  if (!dot || !txt) return;

  if (status === 'connected') {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
    txt.className = 'text-emerald-300';
  } else if (status === 'connecting') {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
    txt.className = 'text-amber-300';
  } else {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-blue-400';
    txt.className = 'text-blue-300';
  }
  txt.innerText = text;
}

// 頁籤切換
function switchTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'text-blue-400', 'font-semibold');
    btn.classList.add('border-transparent', 'text-slate-400', 'font-medium');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-slate-400', 'font-medium');
    activeBtn.classList.add('border-blue-500', 'text-blue-400', 'font-semibold');
  }

  if (tabId === 'quote-ledger') {
    renderQuoteLedger();
  }
}

// 業務員變更
function onSalesRepChange(val) {
  if (val === '自訂業務') {
    const custom = prompt('請輸入您的姓名與分機 (例如: 王業務#3299):');
    if (custom) {
      AppState.activeSalesRep = custom;
      const select = document.getElementById('header-sales-rep');
      const opt = document.createElement('option');
      opt.value = custom;
      opt.innerText = custom;
      opt.selected = true;
      select.prepend(opt);
    }
  } else {
    AppState.activeSalesRep = val;
  }
  AppState.workstation.salesRep = AppState.activeSalesRep;
  const termsRep = document.getElementById('terms-sales-rep');
  if (termsRep) termsRep.value = AppState.activeSalesRep;
}

// --- TAB 1: AI 智能解析模組 ---

// 快捷提示詞設定
function setSamplePrompt(type) {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;

  if (type === 'weed') {
    input.value = `保淨清潔大安龜殼除草報價：
1 模組區下方-除草作業 工 4 2500 10000
2 圍籬內外藤蔓雜草-清除作業 工 2 2500 5000
3 圍籬外推 1 米 雜草 竹篙樹枝-清除 割除 作業 工 1 2500 2500
4 吹葉機 清除作業 工 1 2500 2500
5 管銷費 式 1 4000 4000
未稅合計 24,000 元，稅金 1,200，含稅總計 25,200。聯絡人員：劉勝利 0932-643851。
請幫宇豐綠能做報價單，毛利率抓 46.7% 打包除草工程。`;
  } else if (type === 'wash') {
    input.value = `協力廠商永欣工程報價美傢家具鹿港廠模組清洗：
1. 太陽能模組無殘留純水清洗作業 片 3500 18 63000
2. 走道安全繩索防墜網架設 式 1 12000 12000
未稅合計 75,000 元，稅金 3,750，總計 78,750。聯絡人林師傅 0912-345678。
請建立中租迪和鹿港廠的報價單，預期毛利率 30%。`;
  } else if (type === 'inspect') {
    input.value = `廠商綠能科技報價學甲光儲案場年檢：
1. 高低壓變壓器熱顯像空拍巡檢 組 1 18000 18000
2. 儲能貨櫃消防滅火系統定檢 式 1 10000 10000
未稅合計 28,000 元，稅金 1,400，含稅 29,400。聯絡人張工程師 0988-123456。
請幫森崴能源建立報價單，抓 35% 毛利。`;
  }
}

// 載入大安龜殼除草範本
function loadSampleCase() {
  setSamplePrompt('weed');
  triggerAiParse();
}

// 檔案選擇與拖曳
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) setUploadedFile(file);
}

function handleFileDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) setUploadedFile(file);
}

function setUploadedFile(file) {
  AppState.uploadedFile = file;
  const tag = document.getElementById('uploaded-file-tag');
  const name = document.getElementById('uploaded-file-name');
  if (tag && name) {
    tag.classList.remove('hidden');
    name.innerText = file.name;
  }
}

function clearUploadedFile(e) {
  if (e) e.stopPropagation();
  AppState.uploadedFile = null;
  const fileInput = document.getElementById('file-upload-input');
  if (fileInput) fileInput.value = '';
  const tag = document.getElementById('uploaded-file-tag');
  if (tag) tag.classList.add('hidden');
}

// 觸發 AI 拆解與萃取
async function triggerAiParse() {
  const btn = document.getElementById('btn-parse-ai');
  const input = document.getElementById('ai-chat-input');
  const rawText = input ? input.value : '';

  if (!rawText.trim() && !AppState.uploadedFile) {
    alert('請先輸入對話文字或拖曳上傳廠商報價單檔案！');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>AI 深度解析中...</span>';

  try {
    let parsedResult = null;
    if (AppState.uploadedFile) {
      const file = AppState.uploadedFile;
      if (file.name.endsWith('.pdf')) {
        parsedResult = await AIQuotationEngine.parsePdfFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedResult = await AIQuotationEngine.parseExcelFile(file);
      } else {
        parsedResult = AIQuotationEngine.parseVendorQuoteText(rawText);
      }
    } else {
      parsedResult = AIQuotationEngine.parseVendorQuoteText(rawText);
    }

    if (!parsedResult || parsedResult.items.length === 0) {
      throw new Error('無法從內容辨識出工項明細，請檢查格式或使用範例');
    }

    AppState.parsedVendorData = parsedResult;
    renderAiExtractionResult(parsedResult);

    // 顯示待覆核徽章
    const badge = document.getElementById('pending-review-badge');
    if (badge) badge.classList.remove('hidden');

  } catch (err) {
    alert('AI 解析異常：' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-brain"></i><span>AI 智能拆解與萃取</span>';
  }
}

// 渲染 AI 拆解成果卡片
function renderAiExtractionResult(data) {
  document.getElementById('ai-res-vendor').innerText = data.vendor_name || '協力廠商未指定';
  document.getElementById('ai-res-project').innerText = data.project_name || '工程品項';
  document.getElementById('ai-res-contact').innerText = data.contact_person || '劉勝利';
  document.getElementById('ai-res-phone').innerText = data.contact_phone || '0932-643851';
  document.getElementById('ai-res-cost-subtotal').innerText = (data.subtotal || 0).toLocaleString();
  document.getElementById('ai-res-cost-total').innerText = 'NT$ ' + (data.total || 0).toLocaleString();
  document.getElementById('ai-items-count').innerText = `${data.items.length} 項`;

  const statusBadge = document.getElementById('parse-status-badge');
  if (statusBadge) {
    statusBadge.className = 'px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800';
    statusBadge.innerText = '已拆解完成';
  }

  const listContainer = document.getElementById('ai-items-list');
  if (!listContainer) return;

  if (!data.items || data.items.length === 0) {
    listContainer.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">尚未載入項目</div>';
    return;
  }

  listContainer.innerHTML = data.items.map(item => `
    <div class="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
      <div class="flex items-center space-x-2">
        <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
          ${item.item_index}
        </span>
        <div>
          <span class="font-medium text-slate-800 block">${item.item_name}</span>
          <span class="text-[11px] text-slate-400">${item.quantity} ${item.unit} × NT$ ${(item.unit_price || 0).toLocaleString()}</span>
        </div>
      </div>
      <div class="text-right">
        <span class="font-mono font-bold text-slate-700">NT$ ${(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}</span>
      </div>
    </div>
  `).join('');
}

// 將 AI 拆解成果導入業務工作站
function transferToWorkstation() {
  const vendorData = AppState.parsedVendorData;
  if (!vendorData || !vendorData.items || vendorData.items.length === 0) {
    alert('請先解析廠商報價單！');
    return;
  }

  AppState.workstation.totalCost = vendorData.subtotal || 24000;
  AppState.workstation.projectName = (AppState.workstation.customerName || '客戶') + '(' + (AppState.workstation.siteName || '案場') + ')-' + (vendorData.project_name.includes('除草') ? '除草工程' : vendorData.project_name);

  // 依據公司規定毛利率規則，自動評估所屬級距並套用預設標準毛利率
  const estimatedRule = AIQuotationEngine.estimatePolicyRuleByCost(AppState.workstation.totalCost);
  // 若為大安龜殼除草範本特案，套用範本定價 46.7%；一般案場自動套用該級距規定預設值
  if (AppState.workstation.totalCost === 24000 && vendorData.project_name.includes('大安龜殼')) {
    applyPresetMargin(46.67);
  } else {
    applyPresetMargin(estimatedRule.defaultMargin);
  }

  updateWorkstationUI();
  switchTab('review-workstation');
}

// --- TAB 2: 業務毛利覆核工作站 ---

// 客戶下拉選單渲染
function renderCustomerSelect() {
  const select = document.getElementById('ws-customer-select');
  if (!select) return;

  select.innerHTML = AppState.customers.map(c => `
    <option value="${c.id}" ${c.id === AppState.workstation.customerId ? 'selected' : ''}>
      ${c.name} (${c.site_name || '案場'})
    </option>
  `).join('');

  onCustomerSelectChange(select.value);
}

// 客戶選取變更
function onCustomerSelectChange(custId) {
  const cust = AppState.customers.find(c => c.id === custId);
  if (!cust) return;

  AppState.workstation.customerId = cust.id;
  AppState.workstation.customerName = cust.name;
  AppState.workstation.siteName = cust.site_name || '';
  AppState.workstation.siteAddress = cust.site_address || '';
  AppState.workstation.contactPerson = cust.contact_person || '';
  AppState.workstation.contactPhone = cust.contact_phone || '';

  document.getElementById('ws-customer-taxid').value = cust.tax_id || '';
  document.getElementById('ws-site-address').value = cust.site_address || '';
  document.getElementById('ws-contact-person').value = cust.contact_person || '';
  document.getElementById('ws-contact-phone').value = cust.contact_phone || '';
  
  // 更新工程抬頭
  const projInput = document.getElementById('ws-project-name');
  if (projInput) {
    projInput.value = `${cust.name}(${cust.site_name || '案場'})-除草工程`;
    AppState.workstation.projectName = projInput.value;
  }
}

// 套用預設毛利率
function applyPresetMargin(rate) {
  AppState.workstation.marginRate = Number(rate);
  const slider = document.getElementById('margin-range-slider');
  const sliderLabel = document.getElementById('margin-slider-value');
  if (slider) slider.value = rate;
  if (sliderLabel) sliderLabel.innerText = `${rate} %`;

  // 計算銷售價
  const calc = AIQuotationEngine.calculateFromMarginRate(AppState.workstation.totalCost, rate);
  AppState.workstation.subtotal = calc.subtotal;
  AppState.workstation.tax = calc.tax;
  AppState.workstation.totalAmount = calc.totalAmount;
  AppState.workstation.grossProfit = calc.grossProfit;

  const targetInput = document.getElementById('ws-target-sales-input');
  if (targetInput) targetInput.value = calc.subtotal;

  reformatWorkstationItems();
  updateFinancialKPIs();
  updatePolicyTierHighlight();
}

// 毛利率滑桿拉動
function onMarginSliderInput(val) {
  const sliderLabel = document.getElementById('margin-slider-value');
  if (sliderLabel) sliderLabel.innerText = `${val} %`;
  applyPresetMargin(val);
}

// 目標銷售額直接輸入反算
function onTargetSalesInput(val) {
  const sales = Number(val) || 0;
  const calc = AIQuotationEngine.calculateFromSalesPrice(AppState.workstation.totalCost, sales);
  AppState.workstation.subtotal = calc.subtotal;
  AppState.workstation.tax = calc.tax;
  AppState.workstation.totalAmount = calc.totalAmount;
  AppState.workstation.grossProfit = calc.grossProfit;
  AppState.workstation.marginRate = calc.marginRate;

  const slider = document.getElementById('margin-range-slider');
  const sliderLabel = document.getElementById('margin-slider-value');
  if (slider) slider.value = calc.marginRate;
  if (sliderLabel) sliderLabel.innerText = `${calc.marginRate} %`;

  reformatWorkstationItems();
  updateFinancialKPIs();
  updatePolicyTierHighlight();
}

// 更新公司毛利率規範級距高亮與即時合規檢核
function updatePolicyTierHighlight() {
  const ws = AppState.workstation;
  const currentSales = ws.subtotal || 0;
  const currentMargin = ws.marginRate || 0;

  // 1. 取得當前金額匹配之公司規定級距
  const activeRule = AIQuotationEngine.getPolicyRuleForAmount(currentSales);

  // 2. 更新 4 大卡片的高亮與「當前適用」徽章
  AIQuotationEngine.MARGIN_POLICY_RULES.forEach(r => {
    const card = document.getElementById(`card-tier-${r.id}`);
    const badge = document.getElementById(`badge-tier-${r.id}`);
    if (card && badge) {
      if (r.id === activeRule.id) {
        card.className = 'tier-card p-3 rounded-lg border-2 border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/40 transition-all cursor-pointer shadow-md';
        badge.classList.remove('hidden');
      } else {
        card.className = 'tier-card p-3 rounded-lg border border-slate-700 bg-slate-900/60 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:border-slate-500';
        badge.classList.add('hidden');
      }
    }
  });

  // 3. 更新級距判定文字
  const summaryEl = document.getElementById('tier-active-summary');
  if (summaryEl) {
    summaryEl.innerText = `報價未稅 NT$ ${currentSales.toLocaleString()} ➔ 適用級距【${activeRule.label}】(${activeRule.rangeText})`;
  }

  // 4. 合規檢核與提示橫條更新
  const compliance = AIQuotationEngine.checkMarginCompliance(currentSales, currentMargin);
  const banner = document.getElementById('margin-compliance-banner');
  const icon = document.getElementById('compliance-icon');
  const text = document.getElementById('compliance-text');

  if (icon && text && banner) {
    icon.className = `fa-solid ${compliance.icon} text-sm`;
    text.innerText = compliance.message;

    if (compliance.status === 'BELOW_STANDARD') {
      banner.className = 'flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 rounded-lg bg-red-950/40 border border-red-500/40 text-xs gap-2 text-red-200';
    } else if (compliance.status === 'ABOVE_STANDARD') {
      banner.className = 'flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 rounded-lg bg-blue-950/40 border border-blue-500/40 text-xs gap-2 text-blue-200';
    } else {
      banner.className = 'flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs gap-2 text-emerald-200';
    }
  }
}

// 點擊特定級距卡片，套用該級距之標準預設毛利率
function applyTierDefault(tierId) {
  const rule = AIQuotationEngine.MARGIN_POLICY_RULES.find(r => r.id === tierId);
  if (!rule) return;
  applyPresetMargin(rule.defaultMargin);
}

// 一鍵套用當前金額適用級距之標準推薦毛利率
function applyActiveTierDefault() {
  const currentSales = AppState.workstation.subtotal || 0;
  const rule = AIQuotationEngine.getPolicyRuleForAmount(currentSales);
  applyPresetMargin(rule.defaultMargin);
}

// 設定打包模式
function setBundleMode(isBundle) {
  AppState.workstation.bundleMode = isBundle;
  const btnBundle = document.getElementById('btn-mode-bundle');
  const btnItemized = document.getElementById('btn-mode-itemized');

  if (isBundle) {
    btnBundle.className = 'px-2.5 py-1 rounded bg-blue-600 text-white font-medium transition';
    btnItemized.className = 'px-2.5 py-1 rounded text-slate-300 hover:text-white transition';
  } else {
    btnItemized.className = 'px-2.5 py-1 rounded bg-blue-600 text-white font-medium transition';
    btnBundle.className = 'px-2.5 py-1 rounded text-slate-300 hover:text-white transition';
  }

  reformatWorkstationItems();
}

// 依據打包/分項模式轉換工項
function reformatWorkstationItems() {
  const vendorItems = AppState.parsedVendorData.items || [];
  AppState.workstation.items = AIQuotationEngine.formatSalesItems(
    vendorItems,
    AppState.workstation.bundleMode,
    AppState.workstation.bundleItemName,
    AppState.workstation.subtotal,
    AppState.workstation.totalCost
  );
  renderWorkstationItemsTable();
}

// 渲染工作站表格列 (支援長品名自動縮放與規格備註 Enter 自行換行)
function renderWorkstationItemsTable() {
  const tbody = document.getElementById('ws-quote-items-tbody');
  if (!tbody) return;

  tbody.innerHTML = AppState.workstation.items.map((it, idx) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-2.5 text-center font-bold text-slate-600 align-top pt-3">${idx + 1}</td>
      <td class="p-2.5 align-top">
        <textarea rows="2" onchange="onItemFieldChange(${idx}, 'item_name', this.value)" class="w-full p-1.5 border border-slate-300 rounded font-semibold text-slate-800 text-xs resize-y focus:ring-1 focus:ring-blue-500" placeholder="工程項目名稱（支援長篇名稱）">${it.item_name}</textarea>
      </td>
      <td class="p-2.5 text-center align-top pt-3">
        <input type="text" value="${it.unit}" onchange="onItemFieldChange(${idx}, 'unit', this.value)" class="w-12 p-1 border border-slate-300 rounded text-center text-xs">
      </td>
      <td class="p-2.5 text-center align-top pt-3">
        <input type="number" value="${it.quantity}" onchange="onItemFieldChange(${idx}, 'quantity', this.value)" class="w-16 p-1 border border-slate-300 rounded text-center text-xs">
      </td>
      <td class="p-2.5 text-right align-top pt-3">
        <input type="number" value="${it.sales_price}" onchange="onItemFieldChange(${idx}, 'sales_price', this.value)" class="w-24 p-1 border border-slate-300 rounded text-right font-mono text-xs">
      </td>
      <td class="p-2.5 text-right font-mono font-bold text-slate-800 align-top pt-3">
        NT$ ${(it.subtotal || (it.quantity * it.sales_price)).toLocaleString()}
      </td>
      <td class="p-2.5 align-top">
        <textarea rows="3" onchange="onItemFieldChange(${idx}, 'notes', this.value)" placeholder="規格備註（支援 Enter 自由換行）" class="w-full p-1.5 border border-slate-300 rounded text-slate-700 text-xs resize-y leading-relaxed font-sans focus:ring-1 focus:ring-blue-500">${it.notes || ''}</textarea>
      </td>
      <td class="p-2.5 text-center align-top pt-3">
        <button onclick="deleteQuoteItemRow(${idx})" class="text-slate-400 hover:text-red-500 transition" title="刪除項目"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

// 增刪工項
function addQuoteItemRow() {
  AppState.workstation.items.push({
    item_index: AppState.workstation.items.length + 1,
    item_name: '新增工程項目',
    unit: '式',
    quantity: 1,
    cost_price: 0,
    sales_price: 5000,
    subtotal: 5000,
    margin_rate: 100,
    notes: ''
  });
  recalcFromItems();
}

function deleteQuoteItemRow(idx) {
  if (AppState.workstation.items.length <= 1) {
    alert('報價單至少須保留一項工程項目！');
    return;
  }
  AppState.workstation.items.splice(idx, 1);
  recalcFromItems();
}

function onItemFieldChange(idx, field, val) {
  const item = AppState.workstation.items[idx];
  if (!item) return;

  if (field === 'quantity' || field === 'sales_price') {
    item[field] = Number(val) || 0;
    item.subtotal = item.quantity * item.sales_price;
  } else {
    item[field] = val;
  }
  recalcFromItems();
}

// 當直接編輯細項時，重新加總金額與毛利
function recalcFromItems() {
  const sum = AppState.workstation.items.reduce((acc, it) => acc + (it.subtotal || (it.quantity * it.sales_price)), 0);
  AppState.workstation.subtotal = sum;
  AppState.workstation.tax = Math.round(sum * 0.05);
  AppState.workstation.totalAmount = sum + AppState.workstation.tax;
  AppState.workstation.grossProfit = sum - AppState.workstation.totalCost;
  AppState.workstation.marginRate = sum > 0 ? Number((((sum - AppState.workstation.totalCost) / sum) * 100).toFixed(2)) : 0;

  document.getElementById('ws-target-sales-input').value = sum;
  document.getElementById('margin-slider-value').innerText = `${AppState.workstation.marginRate} %`;
  document.getElementById('margin-range-slider').value = AppState.workstation.marginRate;

  renderWorkstationItemsTable();
  updateFinancialKPIs();
  updatePolicyTierHighlight();
}

// 更新財務 KPI 看板數值
function updateFinancialKPIs() {
  const ws = AppState.workstation;
  document.getElementById('kpi-cost').innerText = 'NT$ ' + (ws.totalCost || 0).toLocaleString();
  document.getElementById('kpi-sales').innerText = 'NT$ ' + (ws.subtotal || 0).toLocaleString();
  document.getElementById('kpi-tax').innerText = 'NT$ ' + (ws.tax || 0).toLocaleString();
  document.getElementById('kpi-total').innerText = 'NT$ ' + (ws.totalAmount || 0).toLocaleString();
  document.getElementById('kpi-profit').innerText = 'NT$ ' + (ws.grossProfit || 0).toLocaleString();
  document.getElementById('kpi-margin').innerText = `${ws.marginRate} %`;
}

// 更新工作站所有基本控制欄位
function updateWorkstationUI() {
  const ws = AppState.workstation;
  document.getElementById('ws-quote-no').value = ws.quoteNo;
  document.getElementById('ws-quote-date').value = ws.quoteDate;
  document.getElementById('ws-project-name').value = ws.projectName;
  document.getElementById('ws-site-address').value = ws.siteAddress;
  document.getElementById('ws-contact-person').value = ws.contactPerson;
  document.getElementById('ws-contact-phone').value = ws.contactPhone;

  document.getElementById('terms-delivery').value = ws.terms.delivery;
  document.getElementById('terms-payment').value = ws.terms.payment;
  document.getElementById('terms-acceptance').value = ws.terms.acceptance;
  document.getElementById('terms-warranty').value = ws.terms.warranty;
  document.getElementById('terms-sales-rep').value = ws.salesRep;

  reformatWorkstationItems();
  updateFinancialKPIs();
  updatePolicyTierHighlight();
}

// 收集當前工作站報價單物件
function getCurrentWorkstationQuoteData(status = 'APPROVED') {
  const ws = AppState.workstation;
  return {
    id: ws.quoteId,
    quote_no: document.getElementById('ws-quote-no').value || ws.quoteNo,
    customer_id: ws.customerId,
    customer_name: ws.customerName,
    site_name: ws.siteName,
    site_address: document.getElementById('ws-site-address').value || ws.siteAddress,
    contact_person: document.getElementById('ws-contact-person').value || ws.contactPerson,
    contact_phone: document.getElementById('ws-contact-phone').value || ws.contactPhone,
    project_name: document.getElementById('ws-project-name').value || ws.projectName,
    quote_date: document.getElementById('ws-quote-date').value || ws.quoteDate,
    sales_rep: document.getElementById('terms-sales-rep').value || ws.salesRep,
    delivery_terms: document.getElementById('terms-delivery').value,
    payment_terms: document.getElementById('terms-payment').value,
    acceptance_terms: document.getElementById('terms-acceptance').value,
    warranty_terms: document.getElementById('terms-warranty').value,
    valid_days: 30,
    invoice_type: '三聯式電子發票',
    total_cost: ws.totalCost,
    subtotal: ws.subtotal,
    tax: ws.tax,
    total_amount: ws.totalAmount,
    gross_profit: ws.grossProfit,
    margin_rate: ws.marginRate,
    bundle_mode: ws.bundleMode,
    bundle_item_name: ws.bundleItemName,
    status: status,
    items: ws.items
  };
}

// 儲存至雲端資料庫
async function saveQuoteToCloud(status) {
  const quoteData = getCurrentWorkstationQuoteData(status);
  try {
    const saved = await SupabaseQuoteService.saveSalesQuote(quoteData, quoteData.items);
    AppState.quotes = await SupabaseQuoteService.getSalesQuotes();
    alert(`報價單 [${saved.quote_no}] 已成功儲存至雲端資料庫！狀態：${status === 'DRAFT' ? '草稿' : '業務已覆核'}`);
    renderQuoteLedger();
  } catch (err) {
    alert('儲存失敗：' + err.message);
  }
}

// 產生標準 Excel 報價單
function generateExcelAction() {
  const quoteData = getCurrentWorkstationQuoteData('APPROVED');
  const filename = ExcelQuoteGenerator.exportToExcel(quoteData);
  alert(`官方 Excel 報價單已成功生成並下載：\n${filename}`);
}

// 同步更新報價單預覽與列印區內容
function syncQuotationPreviewData() {
  const q = getCurrentWorkstationQuoteData('APPROVED');
  if (!q) return;

  const dateEl = document.getElementById('preview-quote-date');
  if (dateEl && q.quote_date) dateEl.innerText = q.quote_date.replace(/-/g, '/');

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val || '';
  };

  setTxt('preview-customer-name', q.customer_name);
  setTxt('preview-site-address', q.site_address);
  setTxt('preview-project-name', q.project_name);
  setTxt('preview-contact-person', q.contact_person);
  setTxt('preview-contact-phone', q.contact_phone);

  setTxt('preview-terms-delivery', q.delivery_terms);
  setTxt('preview-terms-payment', q.payment_terms);
  setTxt('preview-terms-acceptance', q.acceptance_terms);
  setTxt('preview-terms-warranty', q.warranty_terms);

  setTxt('preview-sign-cust-name', q.customer_name);
  setTxt('preview-sign-sales-rep', q.sales_rep);

  const signTaxId = document.getElementById('preview-sign-taxid');
  if (signTaxId) {
    const cust = AppState.customers.find(c => c.id === q.customer_id || c.name === q.customer_name);
    signTaxId.innerText = (cust && cust.tax_id) ? cust.tax_id : (q.customer_tax_id || '83124567');
  }

  // 渲染表格列 (工程項目長名自動換行，規格備註完整呈現換行格式)
  const tbody = document.getElementById('preview-items-tbody');
  if (tbody && q.items) {
    tbody.innerHTML = q.items.map((it, idx) => `
      <tr class="border-b border-slate-800">
        <td class="border border-slate-800 p-2 text-center font-bold align-top">${idx + 1}</td>
        <td class="border border-slate-800 p-2 font-semibold break-words leading-relaxed align-top">${(it.item_name || '').replace(/\n/g, '<br>')}</td>
        <td class="border border-slate-800 p-2 text-center align-top">${it.unit}</td>
        <td class="border border-slate-800 p-2 text-center font-mono align-top">${it.quantity}</td>
        <td class="border border-slate-800 p-2 text-right font-mono align-top">NT$ ${(it.sales_price || 0).toLocaleString()}</td>
        <td class="border border-slate-800 p-2 text-right font-mono font-bold align-top">NT$ ${(it.subtotal || (it.quantity * it.sales_price)).toLocaleString()}</td>
        <td class="border border-slate-800 p-2 text-slate-700 leading-relaxed whitespace-pre-wrap break-words align-top font-sans">${it.notes || ''}</td>
      </tr>
    `).join('');
  }

  setTxt('preview-subtotal-label', `合計(${q.items ? q.items.length : 0}項)`);
  setTxt('preview-subtotal-val', 'NT$ ' + (q.subtotal || 0).toLocaleString());
  setTxt('preview-tax-val', 'NT$ ' + (q.tax || 0).toLocaleString());
  setTxt('preview-total-val', 'NT$ ' + (q.total_amount || 0).toLocaleString());

  const stampChk = document.getElementById('toggle-stamp-chk');
  if (stampChk) toggleStampVisibility(stampChk.checked);
}

// 預覽與列印 PDF
function previewPrintAction() {
  syncQuotationPreviewData();
  document.getElementById('quotation-preview-modal').classList.remove('hidden');
}

// 監聽列印事件 (包含 Ctrl+P) 自動保證最新資料
window.addEventListener('beforeprint', () => {
  syncQuotationPreviewData();
});

// 切換預覽報價單上的進金生官方印章顯示
function toggleStampVisibility(checked) {
  const stampBox = document.getElementById('preview-stamp-box');
  if (!stampBox) return;
  if (checked) {
    stampBox.innerHTML = '<img id="preview-stamp-img" src="assets/stamp.jpg" alt="進金生能源發票章" class="h-24 w-auto object-contain opacity-90 drop-shadow-sm rotate-[-4deg] transition-all">';
  } else {
    stampBox.innerHTML = '<span class="text-slate-400 text-[11px]">【我司發票章 / 大小章用印處】</span>';
  }
}

function closePreviewModal() {
  document.getElementById('quotation-preview-modal').classList.add('hidden');
}

// --- TAB 3: 報價總覽與生命週期追蹤模組 ---

function renderQuoteLedger() {
  const filterStatus = document.getElementById('ledger-filter-status')?.value || 'ALL';
  const searchTerm = (document.getElementById('ledger-search-input')?.value || '').toLowerCase().trim();

  let list = AppState.quotes || [];

  if (filterStatus !== 'ALL') {
    list = list.filter(q => q.status === filterStatus);
  }
  if (searchTerm) {
    list = list.filter(q => 
      (q.customer_name && q.customer_name.toLowerCase().includes(searchTerm)) ||
      (q.project_name && q.project_name.toLowerCase().includes(searchTerm)) ||
      (q.sales_rep && q.sales_rep.toLowerCase().includes(searchTerm)) ||
      (q.quote_no && q.quote_no.toLowerCase().includes(searchTerm))
    );
  }

  // 更新頂部 KPI
  const allQuotes = AppState.quotes || [];
  document.getElementById('ledger-total-count').innerText = allQuotes.length;
  document.getElementById('ledger-pending-count').innerText = allQuotes.filter(q => q.status === 'PENDING_REVIEW' || q.status === 'DRAFT').length;
  document.getElementById('ledger-sent-count').innerText = allQuotes.filter(q => q.status === 'SENT').length;
  document.getElementById('ledger-signed-count').innerText = allQuotes.filter(q => q.status === 'SIGNED').length;

  const totalAmount = allQuotes.reduce((acc, q) => acc + (q.subtotal || 0), 0);
  document.getElementById('ledger-total-amount').innerText = 'NT$ ' + totalAmount.toLocaleString();

  const tbody = document.getElementById('ledger-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="p-6 text-center text-xs text-slate-400">目前尚無符合篩選條件的報價記錄</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(q => {
    let statusBadge = '';
    if (q.status === 'SIGNED') {
      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-circle-check mr-1"></i>已回簽結案</span>';
    } else if (q.status === 'SENT') {
      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800"><i class="fa-solid fa-paper-plane mr-1"></i>已發送客戶</span>';
    } else if (q.status === 'APPROVED') {
      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800"><i class="fa-solid fa-check mr-1"></i>業務已核准</span>';
    } else {
      statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600"><i class="fa-solid fa-file mr-1"></i>草稿 / 待覆核</span>';
    }

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3">
          <span class="font-mono font-bold text-slate-800 block">${q.quote_no}</span>
          <span class="text-[11px] text-slate-400">${q.quote_date}</span>
        </td>
        <td class="p-3 font-semibold text-slate-800">${q.customer_name}</td>
        <td class="p-3">
          <span class="text-slate-800 font-medium block truncate max-w-[200px]">${q.project_name}</span>
          <span class="text-[11px] text-slate-400">${q.site_name || ''}</span>
        </td>
        <td class="p-3 font-medium text-slate-600">${q.sales_rep}</td>
        <td class="p-3 text-right font-mono text-slate-600">NT$ ${(q.total_cost || 0).toLocaleString()}</td>
        <td class="p-3 text-right font-mono font-bold text-slate-900">NT$ ${(q.subtotal || 0).toLocaleString()}</td>
        <td class="p-3 text-center font-mono font-bold text-amber-600">${q.margin_rate}%</td>
        <td class="p-3 text-center">${statusBadge}</td>
        <td class="p-3 text-center space-x-1">
          <button onclick="exportQuoteById('${q.id}')" title="下載 Excel" class="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 rounded"><i class="fa-solid fa-file-excel"></i></button>
          <button onclick="previewQuoteById('${q.id}')" title="預覽 PDF" class="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 rounded"><i class="fa-solid fa-eye"></i></button>
          <button onclick="openSignedModal('${q.id}')" title="登記客戶回簽" class="p-1.5 text-amber-600 hover:text-amber-800 bg-amber-50 rounded"><i class="fa-solid fa-signature"></i></button>
          <button onclick="deleteQuoteAction('${q.id}')" title="刪除" class="p-1.5 text-slate-400 hover:text-red-600 rounded"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function exportQuoteById(id) {
  const quote = AppState.quotes.find(q => q.id === id);
  if (quote) ExcelQuoteGenerator.exportToExcel(quote);
}

function previewQuoteById(id) {
  const quote = AppState.quotes.find(q => q.id === id);
  if (!quote) return;
  AppState.workstation = {
    ...AppState.workstation,
    ...quote,
    terms: {
      delivery: quote.delivery_terms || '依雙方約定為主。',
      payment: quote.payment_terms || 'EOM 60 Days',
      acceptance: quote.acceptance_terms || '請於工程完工後7日內安排驗收，若未能於7日內安排驗收，則視為驗收合格。工程若因不可歸責我司之因致無法驗收時，其逾15日時視同正式驗收。',
      warranty: quote.warranty_terms || '依雙方約定',
      validDays: quote.valid_days || 30,
      invoice: quote.invoice_type || '三聯式電子發票'
    }
  };
  updateWorkstationUI();
  previewPrintAction();
}

async function deleteQuoteAction(id) {
  if (!confirm('確定要刪除這筆報價紀錄嗎？')) return;
  await SupabaseQuoteService.deleteSalesQuote(id);
  AppState.quotes = await SupabaseQuoteService.getSalesQuotes();
  renderQuoteLedger();
}

// 登記客戶回簽彈窗
function openSignedModal(id) {
  AppState.selectedQuoteForSigned = id;
  document.getElementById('signed-date-input').value = new Date().toISOString().slice(0, 10);
  document.getElementById('signed-modal').classList.remove('hidden');
}

function closeSignedModal() {
  document.getElementById('signed-modal').classList.add('hidden');
  AppState.selectedQuoteForSigned = null;
}

async function confirmSignedStatus() {
  if (!AppState.selectedQuoteForSigned) return;
  await SupabaseQuoteService.updateQuoteStatus(AppState.selectedQuoteForSigned, 'SIGNED');
  AppState.quotes = await SupabaseQuoteService.getSalesQuotes();
  closeSignedModal();
  renderQuoteLedger();
  alert('🎉 恭喜！報價單已成功標記為「客戶已回簽」，完成全流程閉環結案！');
}

// --- TAB 4: 客戶與廠商主檔維護模組 ---

function renderMasterData() {
  // 客戶清單
  const custList = document.getElementById('master-customers-list');
  if (custList) {
    custList.innerHTML = AppState.customers.map(c => `
      <div class="py-3 flex items-center justify-between text-xs">
        <div>
          <span class="font-bold text-slate-800 text-sm block">${c.name}</span>
          <span class="text-slate-400">統編: ${c.tax_id || '無'} ｜ 案場: ${c.site_name || '無'}</span>
          <span class="text-slate-500 block mt-0.5">聯絡人: ${c.contact_person || '未註記'} (${c.contact_phone || '無電話'})</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">有效客戶</span>
      </div>
    `).join('');
  }

  // 廠商清單
  const vendList = document.getElementById('master-vendors-list');
  if (vendList) {
    vendList.innerHTML = AppState.vendors.map(v => `
      <div class="py-3 flex items-center justify-between text-xs">
        <div>
          <span class="font-bold text-slate-800 text-sm block">${v.name}</span>
          <span class="text-slate-400">窗口: ${v.contact_person || '業務窗口'} (${v.contact_phone || '未登記'})</span>
          <span class="text-slate-500 block mt-0.5">銀行: ${v.bank_name || '未登錄'} ${v.bank_account || ''}</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">合格協力廠</span>
      </div>
    `).join('');
  }
}

// 客戶彈窗
function openNewCustomerModal() {
  document.getElementById('new-cust-modal').classList.remove('hidden');
}

function closeNewCustomerModal() {
  document.getElementById('new-cust-modal').classList.add('hidden');
}

async function saveNewCustomerAction() {
  const name = document.getElementById('modal-cust-name').value;
  if (!name.trim()) {
    alert('請填寫客戶名稱！');
    return;
  }
  const cust = {
    name: name.trim(),
    tax_id: document.getElementById('modal-cust-taxid').value.trim(),
    site_name: document.getElementById('modal-cust-sitename').value.trim(),
    site_address: document.getElementById('modal-cust-address').value.trim(),
    contact_person: document.getElementById('modal-cust-person').value.trim(),
    contact_phone: document.getElementById('modal-cust-phone').value.trim()
  };
  await SupabaseQuoteService.saveCustomer(cust);
  AppState.customers = await SupabaseQuoteService.getCustomers();
  renderCustomerSelect();
  renderMasterData();
  closeNewCustomerModal();
  alert(`客戶 [${name}] 已成功新增！`);
}

// 廠商彈窗
function openNewVendorModal() {
  document.getElementById('new-vendor-modal').classList.remove('hidden');
}

function closeNewVendorModal() {
  document.getElementById('new-vendor-modal').classList.add('hidden');
}

async function saveNewVendorAction() {
  const name = document.getElementById('modal-vendor-name').value;
  if (!name.trim()) {
    alert('請填寫廠商名稱！');
    return;
  }
  const vendor = {
    name: name.trim(),
    tax_id: document.getElementById('modal-vendor-taxid').value.trim(),
    contact_person: document.getElementById('modal-vendor-person').value.trim(),
    contact_phone: document.getElementById('modal-vendor-phone').value.trim(),
    bank_name: document.getElementById('modal-vendor-bank').value.trim(),
    bank_account: document.getElementById('modal-vendor-account').value.trim()
  };
  await SupabaseQuoteService.saveVendor(vendor);
  AppState.vendors = await SupabaseQuoteService.getVendors();
  renderMasterData();
  closeNewVendorModal();
  alert(`廠商 [${name}] 已成功新增！`);
}

// Supabase 設定彈窗
function openConfigModal() {
  const cfg = SupabaseQuoteService.getStoredConfig();
  document.getElementById('cfg-sb-url').value = cfg.url || '';
  document.getElementById('cfg-sb-key').value = cfg.anonKey || '';
  document.getElementById('config-modal').classList.remove('hidden');
}

function closeConfigModal() {
  document.getElementById('config-modal').classList.add('hidden');
}

async function saveConfigAction() {
  const url = document.getElementById('cfg-sb-url').value.trim();
  const key = document.getElementById('cfg-sb-key').value.trim();
  if (!url || !key) {
    alert('請填寫完整的 Supabase URL 與 Anon Key');
    return;
  }
  SupabaseQuoteService.setStoredConfig(url, key);
  closeConfigModal();
  await initApp();
  alert('連線設定已更新！');
}

async function resetDefaultConfig() {
  localStorage.removeItem('AP_QUOTE_SB_URL');
  localStorage.removeItem('AP_QUOTE_SB_KEY');
  closeConfigModal();
  await initApp();
  alert('已恢復為進金生預設雲端資料庫設定！');
}
