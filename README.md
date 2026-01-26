# 📋 Form2 Replier with Smart on FHIR

> 整合 Smart on FHIR 的醫療表單填寫組件 - Angular 11

## 🌟 功能特色

- ✅ **FormIO 動態表單渲染**：支援複雜的醫療表單
- ✅ **Smart on FHIR 整合**：自動載入病患資料和藥物資訊
- ✅ **PrimeNG UI 組件**：美觀的使用者介面
- ✅ **表單驗證**：必填欄位檢查和資料驗證
- ✅ **模擬資料支援**：可在非 FHIR 環境中使用模擬資料

## 🏗️ 技術架構

- **前端框架**: Angular 11
- **表單引擎**: FormIO
- **FHIR Client**: fhirclient
- **UI 庫**: PrimeNG
- **樣式框架**: Bootstrap 3

## 🚀 快速開始

### 1. 安裝依賴

```bash
yarn install
```

### 2. 啟動開發伺服器

```bash
# 解決 Node.js 版本兼容性問題
$env:NODE_OPTIONS="--openssl-legacy-provider"

# 啟動應用
ng serve --port 4200
```

### 3. 存取應用

- **主要應用**: http://localhost:4200
- **Smart Launch 頁面**: http://localhost:4200/smart-launch.html

## 🏥 Smart on FHIR 整合說明

### 回答你的問題：

#### 1. **可以將 Smart on FHIR 功能搬到 app.component 嗎？**
**答案：可以！** 我們已經實作了：
- 建立 `FhirService` 服務來處理所有 FHIR 相關功能
- 在 `app.component.ts` 中整合 FHIR 資料流
- 動態載入 `fhirclient` 函式庫（不依賴 CDN）

#### 2. **是否因為有從 CDN 取得內容才能呼叫 FHIR？**
**答案：不是！** 重點是：
- **FHIR Client 函式庫**：可以用 CDN 或 npm 安裝
- **Smart on FHIR 授權流程**：需要正確的 OAuth2 設定
- **合法的 FHIR 伺服器**：需要有可存取的 FHIR 端點

### 如何運作

1. **自動偵測環境**：檢查是否在 Smart on FHIR 環境中
2. **動態載入 Client**：如果需要，從 CDN 載入 fhirclient
3. **OAuth2 授權**：透過 Smart on FHIR 流程進行身份驗證
4. **資料擷取**：載入病患和藥物資料
5. **降級處理**：如果 FHIR 不可用，使用模擬資料

### 實作架構

```typescript
// FhirService 提供 Observable 資料流
export class FhirService {
  patient$: Observable<PatientData>
  medications$: Observable<MedicationData>
  error$: Observable<string>
  loading$: Observable<boolean>
}

// AppComponent 訂閱並顯示資料
export class AppComponent {
  constructor(private fhirService: FhirService) {}
  
  ngOnInit() {
    this.fhirService.patient$.subscribe(patient => {
      this.patientData = patient;
    });
  }
}
```

## 📁 主要檔案

- `src/app/services/fhir.service.ts` - Smart on FHIR 整合服務
- `src/app/app.component.ts` - 主應用組件（整合 FHIR 資料）
- `src/smart-launch.html` - Smart on FHIR 啟動頁面（類似原 index2.html）

## ❓ 常見問題

**Q: 為什麼不直接用 CDN？**
A: 使用 npm 套件更好管理版本和依賴，也可以進行 TypeScript 型別檢查。

**Q: 在非 FHIR 環境會怎樣？**
A: 系統會自動偵測並使用模擬資料，不會影響基本功能。

**Q: 如何測試 Smart on FHIR 功能？**
A: 可以使用 smart-launch.html 頁面，或整合到現有的 FHIR sandbox 環境。

## 📄 授權

此專案僅供展示和學習用途。
