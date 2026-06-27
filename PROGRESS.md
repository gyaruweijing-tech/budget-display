# budget-display 進捗

月次予算ダッシュボード（React + Vite、localStorage保存）。

## 実装済み
- 固定費／準固定費／投資／スラックの編集・追加・削除
- 月次サマリー（収入・支出・スラック計算）
- **銀行 残高カード**（2026-06-27 追加）

## 銀行 残高連携（GAS方式）
銀行のVisaデビット利用メール（`bank-notice@example.com`）を解析して残高を自動表示する。

- **GASコード**: `gas/bank-balance.gs` … メール来るGoogleアカウントのスプレッドシートに紐付けて実行
  - スプレッドシート: タブ「取引」(日付/種別/金額/店名/承認番号) と「設定」(初期残高/基準日/現在残高)
  - 残高 = 初期残高 + 入金合計 − 支出合計（**基準日より後の取引だけ集計**）
  - 入金は毎週木曜の自動加算（¥30,000）
  - Gmail検索は直近14日のみ＋承認番号で重複防止（軽量）
  - `doGet` で残高＋直近取引をJSONで返す（TOKENで保護）
- **React側**: `src/components/BankBalanceCard.jsx` … GASのURLを叩いて残高表示＋🔄更新ボタン
  - 接続情報は `.env.local`（gitに上げない）の `VITE_GAS_URL` / `VITE_GAS_TOKEN`

## デプロイ
- 本番は **Vercel**（スマホからPWAとして利用）
- 残高連携の接続情報は環境変数 `VITE_GAS_URL` / `VITE_GAS_TOKEN`
  - ローカル: `.env.local` または `setx`（gitに上げない）
  - 本番: Vercelの Environment Variables に設定 → 再デプロイで反映
- セキュリティ方針: **公開のまま**（残高は読み取り専用・低リスクと判断。URLを知る人には残高が見える点は許容）

## 残タスク
- [x] GASをWebアプリとして公開しURLを取得
- [x] ローカルで残高表示を確認
- [ ] GASで `createTrigger` を実行（6時間ごとの自動更新ON）
- [ ] Vercelに環境変数を設定 → git push で本番反映
- [ ] スマホ本番で残高が出るか確認
