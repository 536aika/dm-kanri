# Instagram DM送信管理

業務委託スタッフがスマホでInstagram DMの送信実績を記録・管理する社内向けWebアプリです。

## 技術スタック

- React + TypeScript + Vite
- Material UI (MUI) v5
- Firebase Firestore（認証なし）
- Google Sheets API v4（Vercel サーバレス経由）
- ホスティング: Vercel

## セットアップ

1. 依存関係のインストール  
   `npm install`

2. 環境変数  
   `.env.example` をコピーして `.env` を作成し、Firebase と Google の値を設定する。

   - **Firebase**: [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成し、Firestore を有効化。設定の「一般」から Web アプリを追加し、`VITE_FIREBASE_*` を取得。
   - **Google スプレッドシート**:  
     - [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成し、Google Sheets API を有効化。  
     - サービスアカウントを作成し、JSON キーをダウンロード。  
     - 使用するスプレッドシートを、サービスアカウントのメールアドレスに「編集者」で共有。  
     - `GOOGLE_SHEET_ID`: スプレッドシートの URL の `/d/` と `/edit` の間の文字列。  
     - `GOOGLE_SERVICE_ACCOUNT_JSON`: サービスアカウント JSON を文字列としてそのまま設定（Vercel の環境変数では改行を `\n` に置換して1行にしても可）。

3. 開発サーバー  
   `npm run dev`  
   フロントのみ。API（スプレッドシート連携）を試す場合は `vercel dev` を利用。

4. ビルド  
   `npm run build`

5. デプロイ  
   Vercel にプロジェクトを接続し、ルートで `vercel` または Git 連携でデプロイ。環境変数は Vercel の「Settings → Environment Variables」で設定。

6. **Firestore 複合インデックス**（名前別の本日件数を使う場合）  
   `dm_records` で `date` と `userName` の複合クエリを使うため、初回実行時に Firebase がインデックス作成を促すことがあります。ブラウザコンソールのエラーに表示されるリンクから作成するか、プロジェクトルートで `firebase deploy --only firestore:indexes`（要 Firebase CLI と `firestore.indexes.json`）で一括作成できます。

## 主な仕様

- 名前入力のみで利用開始（ログイン不要・Cookie/セッション非依存）。
- DM送信記録は Firestore の `dm_records` に保存し、同時に Google スプレッドシートに月別シート（例: 2026-03）で追記。
- 1日 150 件まで。25・50・75・100・125 件で Break Time（1時間送信ロック）。Break Time は localStorage で永続化。
- 0:00（日本時間）で日次リセット（クライアント側の日付フィルタで対応）。

## トラブルシューティング

- **2件目以降送信できない・画面がリセットされない**  
  Firestore の「本日の件数」用クエリで複合インデックスが必要です。上記「Firestore 複合インデックス」を作成してください。

- **スプレッドシートに反映されない**  
  - Vercel の環境変数に `GOOGLE_SHEET_ID` と `GOOGLE_SERVICE_ACCOUNT_JSON` が設定されているか確認。  
  - スプレッドシートをサービスアカウントのメール（JSON 内の `client_email`）に「編集者」で共有しているか確認。  
  - 送信成功時に「（スプレッドシートへの反映に失敗しました）」と出る場合は、上記または API のログ（Vercel Dashboard → Logs）を確認。
