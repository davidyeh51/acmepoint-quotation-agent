/**
 * 進金生能源 6692 ｜ AI 智能報價協同平台
 * B2B 官方標準銷售報價單 Excel (.xlsx) 產生模組
 * 依據範本「大安龜殼-除草鋸樹作業 報價單 20261002.xlsx」1:1 純前端原生重構
 */

const ExcelQuoteGenerator = {
  /**
   * 導出標準 AcmePoint B2B 報價單 Excel
   * @param {Object} quote 報價單主物件
   */
  exportToExcel(quote) {
    if (!window.XLSX) {
      alert('Excel 引擎載入中，請稍候重試！');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = {};

    // 1. 設定欄寬 (工程項目與規格備註擴大加寬)
    ws['!cols'] = [
      { wch: 8 },   // A: 項次
      { wch: 48 },  // B: 工程項目 (擴大寬度，支援長篇工程項目)
      { wch: 8 },   // C: 單位
      { wch: 12 },  // D: 數量(容量)
      { wch: 16 },  // E: 單價(未稅)
      { wch: 18 },  // F: 複價(未稅)
      { wch: 48 }   // G: 規格備註 (擴大寬度，支援換行規格條列)
    ];

    // 輔助函式：設定儲存格
    function setCell(coord, value, formula = null, type = 's') {
      const cell = { v: value };
      if (typeof value === 'number') {
        cell.t = 'n';
        cell.z = '#,##0';
      } else {
        cell.t = type;
      }
      if (formula) {
        cell.f = formula;
      }
      ws[coord] = cell;
    }

    // 格式化日期為 YYYY/MM/DD
    const rawDate = quote.quote_date ? new Date(quote.quote_date) : new Date();
    const formattedDate = `${rawDate.getFullYear()}/${rawDate.getMonth() + 1}/${rawDate.getDate()}`;

    // 2. 標題與公司資訊 (Row 1 - Merged A1:G1)
    setCell('A1', '進金生能源服務股份有限公司\n高雄市前鎮區中山二路2號14樓之3\nTEL:(07) 334-7879  FAX:(07) 334-0635');

    // 3. 報價單抬頭與日期 (Row 2 - Merged A2:G2)
    setCell('A2', `報價單                                                                   日期：${formattedDate}`);

    // 4. 客戶基本資訊 (Row 3 & 4)
    setCell('A3', '客戶名稱');
    setCell('B3', quote.customer_name || '宇豐綠能股份有限公司');
    setCell('C3', '裝置地址');
    setCell('E3', quote.site_address || '');

    setCell('A4', '工程名稱');
    setCell('B4', quote.project_name || '太陽光電設施運維工程');
    setCell('E4', '連絡人');
    setCell('F4', quote.contact_person || '');
    setCell('G4', (quote.contact_phone ? `連絡電話：${quote.contact_phone}` : ''));

    // 5. 表頭欄位 (Row 5 & 6)
    setCell('A5', '項次');
    setCell('B5', '工程項目');
    setCell('C5', '單位');
    setCell('D5', '數量(容量)');
    setCell('E5', '單價(未稅)');
    setCell('F5', '複價(未稅)');
    setCell('G5', '規格備註');

    // 6. 細項明細列 (Row 7 開始)
    const items = (quote.items && quote.items.length > 0) ? quote.items : [
      {
        item_index: 1,
        item_name: quote.bundle_item_name || '除草工程',
        unit: '式',
        quantity: 1,
        sales_price: quote.subtotal || 45000,
        subtotal: quote.subtotal || 45000,
        notes: ''
      }
    ];

    let startRow = 7;
    items.forEach((item, idx) => {
      const r = startRow + idx;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.sales_price) || 0;
      const lineSubtotal = qty * price;

      setCell(`A${r}`, idx + 1, null, 'n');
      setCell(`B${r}`, item.item_name || '');
      setCell(`C${r}`, item.unit || '式');
      setCell(`D${r}`, qty, null, 'n');
      setCell(`E${r}`, price, null, 'n');
      setCell(`F${r}`, lineSubtotal, `D${r}*E${r}`, 'n');
      setCell(`G${r}`, item.notes || '');
    });

    // 保持標準範本的版面行數（至少 8 行間距）
    const totalItemRows = Math.max(items.length, 8);
    const lastItemRow = startRow + totalItemRows - 1;

    // 填補空白行以維持典範格式
    for (let r = startRow + items.length; r <= lastItemRow; r++) {
      setCell(`A${r}`, '');
      setCell(`B${r}`, '');
      setCell(`C${r}`, '');
      setCell(`D${r}`, '');
      setCell(`E${r}`, '');
      setCell(`F${r}`, '');
      setCell(`G${r}`, '');
    }

    // 7. 合計與稅額 (Rows following items)
    const subtotalRow = lastItemRow + 1;
    const taxRow = subtotalRow + 1;
    const totalRow = taxRow + 1;

    setCell(`B${subtotalRow}`, `合計(${items.length}項)`);
    setCell(`F${subtotalRow}`, quote.subtotal || 0, `SUM(F7:F${lastItemRow})`, 'n');

    setCell(`B${taxRow}`, '營業稅(5%)');
    setCell(`F${taxRow}`, quote.tax || Math.round((quote.subtotal || 0) * 0.05), `F${subtotalRow}*0.05`, 'n');

    setCell(`B${totalRow}`, '總計(含稅)');
    setCell(`F${totalRow}`, quote.total_amount || Math.round((quote.subtotal || 0) * 1.05), `F${subtotalRow}+F${taxRow}`, 'n');

    // 8. 官方條款說明 (Row totalRow + 1 - Merged A:G)
    const termsRow = totalRow + 1;
    const delivery = quote.delivery_terms || '依雙方約定為主。';
    const payment = quote.payment_terms || 'EOM 60 Days';
    const acceptance = quote.acceptance_terms || '請於工程完工後7日內安排驗收，若未能於7日內安排驗收，則視為驗收合格。工程若因不可歸責我司之因致無法驗收時，其逾15日時視同正式驗收。';
    const warranty = quote.warranty_terms || '依雙方約定';
    const validDays = quote.valid_days || 30;
    const invoice = quote.invoice_type || '三聯式電子發票';

    const termsText = `說明\n訂單交期:${delivery} \n付款條件:${payment}\n驗收條件:${acceptance}\n保固條件:${warranty}\n報價效期:本報價有效期間為${validDays}天\n發票事項:${invoice}`;
    setCell(`A${termsRow}`, termsText);

    // 9. 簽章與業務聯絡資訊 (Row termsRow + 1 & termsRow + 2)
    const signRow1 = termsRow + 1;
    const signRow2 = termsRow + 2;

    setCell(`A${signRow1}`, `${quote.customer_name || '客戶公司'}                                                                                                                                進金生能源服務股份有限公司`);
    setCell(`A${signRow2}`, `     請簽署回簽訂單                                                                                                                                     負責業務： ${quote.sales_rep || '鍾依靜#3273'} `);

    // 10. 設定合併儲存格 (Merges)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // A1:G1 公司抬頭
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // A2:G2 報價單與日期
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3 裝置地址標籤
      { s: { r: 2, c: 4 }, e: { r: 2, c: 6 } }, // E3:G3 裝置地址值
      { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } }, // B4:D4 工程名稱值
      
      // 表頭上下合併 (Row 5 & 6)
      { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // A5:A6 項次
      { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // B5:B6 工程項目
      { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // C5:C6 單位
      { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // D5:D6 數量
      { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } }, // E5:E6 單價
      { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } }, // F5:F6 複價
      { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } }, // G5:G6 規格備註
      
      // 底部說明與簽章合併
      { s: { r: termsRow - 1, c: 0 }, e: { r: termsRow - 1, c: 6 } },
      { s: { r: signRow1 - 1, c: 0 }, e: { r: signRow1 - 1, c: 6 } },
      { s: { r: signRow2 - 1, c: 0 }, e: { r: signRow2 - 1, c: 6 } }
    ];

    // 設定行高 (特別拉高最下方的雙方簽章與用印欄位，以利蓋公司與客戶印章)
    ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 58 }; // Row 1 公司抬頭
    ws['!rows'][1] = { hpt: 24 }; // Row 2 報價單
    ws['!rows'][2] = { hpt: 40 }; // Row 3 客戶與地址
    ws['!rows'][3] = { hpt: 24 }; // Row 4 工程與連絡人
    ws['!rows'][termsRow - 1] = { hpt: 120 }; // Row 18 說明條款
    ws['!rows'][signRow1 - 1] = { hpt: 85 };  // Row 19 簽章公司抬頭 (大幅拉高便於蓋印)
    ws['!rows'][signRow2 - 1] = { hpt: 65 };  // Row 20 回簽簽名欄 (大幅拉高便於蓋印)

    // 設定工作表有效範圍
    ws['!ref'] = `A1:G${signRow2}`;

    // 11. 封裝並觸發下載
    XLSX.utils.book_append_sheet(wb, ws, '報價單');

    const cleanProjectName = (quote.project_name || '工程報價').replace(/[\\/:*?"<>|]/g, '_');
    const dateStamp = rawDate.toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${cleanProjectName} 報價單 ${dateStamp}.xlsx`;

    XLSX.writeFile(wb, filename);
    return filename;
  }
};
