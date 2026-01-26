# 🏥 政府 Smart on FHIR 沙盒設定指南

## 📋 應用程式資訊

**應用程式名稱**: Form2 Replier  
**類型**: Public Client (公開客戶端)  
**目標平台**: Web Application  

## 🔗 URL 設定

### Launch URL (啟動 URL)
```
https://csuperk.github.io/PROM/launch.html
```

### Redirect URI (重導向 URI)
```
https://csuperk.github.io/PROM/
```

### App URL (應用程式主頁)
```
https://csuperk.github.io/PROM/
```

## 🔐 權限範圍 (Scopes)

```
launch openid fhirUser patient/*.read
```

**各項權限說明**:
- `launch`: 允許從 EHR 啟動應用程式
- `openid`: 使用 OpenID Connect 身份驗證
- `fhirUser`: 取得目前使用者資訊
- `patient/*.read`: 讀取病患相關的所有資源

## 📝 沙盒註冊步驟

### 1. 前往政府 Smart on FHIR 沙盒
- 登入沙盒管理介面
- 選擇「註冊新應用程式」

### 2. 填寫應用程式基本資訊
```
應用程式名稱: Form2 Replier
描述: 醫療表單填寫工具，整合 Smart on FHIR 功能
開發者: [你的名稱/組織]
聯絡信箱: [你的信箱]
```

### 3. 設定 OAuth2 參數
```
Client Type: Public
Grant Types: Authorization Code with PKCE
Launch URL: https://csuperk.github.io/PROM/launch.html
Redirect URIs: https://csuperk.github.io/PROM/
Scopes: launch openid fhirUser patient/*.read
```

### 4. 取得 Client ID
- 註冊完成後會取得一個 Client ID (例如: `form2-replier-app`)
- 記錄這個 Client ID，稍後需要更新到應用程式中

## 🔧 更新 Client ID

註冊完成後，需要更新 `src/launch.html` 中的 Client ID:

```javascript
// 將這行
clientId: "form2-replier-app",

// 改為沙盒提供的實際 Client ID
clientId: "你的實際Client ID",
```

## 🧪 測試流程

### 1. 從沙盒啟動
- 在沙盒中選擇病患
- 點擊「Launch App」
- 系統會重導向到 `launch.html`

### 2. 授權流程
- 系統自動進行 OAuth2 授權
- 使用者同意權限
- 重導向到主應用程式

### 3. 驗證功能
- 確認病患資料正確顯示
- 確認藥物資訊載入
- 測試表單填寫功能

## ❓ 常見問題

### Q: 啟動時出現 "缺少必要參數" 錯誤
A: 檢查沙盒中的 Launch URL 是否正確設定為 `https://csuperk.github.io/PROM/launch.html`

### Q: 重導向失敗
A: 確認 Redirect URI 設定為 `https://csuperk.github.io/PROM/` (注意結尾的斜線)

### Q: 權限不足錯誤
A: 檢查 Scopes 是否包含 `launch openid fhirUser patient/*.read`

### Q: Client ID 錯誤
A: 確認在 `launch.html` 中使用的是沙盒提供的正確 Client ID

## 📞 支援聯絡

如果在設定過程中遇到問題，可以:
1. 檢查瀏覽器開發者工具的 Console 輸出
2. 聯絡沙盒管理員
3. 參考政府 Smart on FHIR 說明文件

---

**注意**: 這個設定適用於測試環境。正式環境部署時需要額外的安全性設定和審核流程。
