# Mario — Unity WebGL

此版本已整理好檔案路徑，並將 Brotli 檔案解壓縮，可直接放到 GitHub Pages。

## 發布

1. 將本資料夾的內容放在 GitHub 儲存庫的最外層，讓 `index.html` 位於根目錄。
2. 開啟儲存庫的 **Settings → Pages**。
3. Source 選 **Deploy from a branch**，Branch 選 **main**，資料夾選 **/(root)**，按 **Save**。
4. 等待發布完成後，使用 Pages 顯示的網址開啟遊戲。

請保留 `Build` 與 `TemplateData` 的目錄名稱。遊戲使用 WebGL 2，建議先用電腦瀏覽器測試。此版本沿用原始 Unity 遊戲內容與操作方式。

## 本機預覽

頁面會配合瀏覽器實際可見範圍，中央遊戲維持原始 960:600 比例完整顯示；兩側預留操作區，按鈕不覆蓋遊戲。Safari 工具列展開或收合時會重新計算尺寸。手機與平板必須轉成橫向才能遊玩；直向時顯示提示並暫停，轉回橫向後繼續。左下角依序為左、下、右箭頭，分別對應 A、S、D。右下角有兩顆無文字圓形按鈕：左邊綠色對應空白鍵，右邊紅色僅對應 Enter。可多指同時按住，放開時釋放各自的按鍵。HTML、CSS 與 controls.js 已附繁體中文註解。右上角的「全螢幕」按鈕可進入或離開瀏覽器全螢幕，並保留方向按鈕。不支援全螢幕的瀏覽器仍會以滿版視窗顯示。

在本資料夾開啟終端機，執行：

```sh
python -m http.server 8000
```

再開啟 `http://localhost:8000/`。請透過 HTTP 伺服器開啟，直接雙擊 `index.html` 無法完整載入 Unity 遊戲。

## 檔案

- `index.html`：遊戲入口。
- `Build/`：Unity 遊戲資料、載入器、JavaScript 與 WebAssembly。
- `TemplateData/`：原始介面樣式與圖片。
- `.nojekyll`：供 GitHub Pages 直接發布靜態檔案。

發布方式參考：[GitHub Pages 官方說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
