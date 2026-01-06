# M3U8 Recorder

m3u8形式のIPTVストリームを録画するためのWebアプリケーションです。

## 機能

- **チャンネル管理**: 複数のm3u8 URLをチャンネルとして登録可能（タイムゾーン設定付き）
- **録画予約**: 分単位での録画スケジュール設定
- **タイムゾーン対応**: チャンネルのタイムゾーンとブラウザのタイムゾーン両方で時刻を確認可能
- **録画ファイル管理**: 録画済みファイルの閲覧・ダウンロード・削除

## 技術スタック

| コンポーネント | 技術 |
|---------------|------|
| フロントエンド | Next.js 14, TailwindCSS, React Query |
| バックエンド | Python 3.11, FastAPI, SQLAlchemy, APScheduler |
| データベース | PostgreSQL 16 |
| 録画エンジン | ffmpeg |
| コンテナ | Docker Compose |

## セットアップ

### 必要条件

- Docker
- Docker Compose

### 起動方法

```bash
# プロジェクトをクローン
cd m3u8_recorder

# Docker Composeで起動
docker compose up -d

# ログを確認
docker compose logs -f
```

### アクセス

- **フロントエンド**: http://localhost:3002
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 使い方

### 1. チャンネルを登録

1. サイドバーの「チャンネル」をクリック
2. 「チャンネル追加」ボタンをクリック
3. 以下の情報を入力:
   - チャンネル名
   - m3u8 URL
   - タイムゾーン（番組表の時間帯）

### 2. 録画予約を作成

1. サイドバーの「録画予約」をクリック
2. 「録画予約」ボタンをクリック
3. 以下の情報を入力:
   - チャンネル選択
   - タイトル
   - 開始日時・終了日時
   - タイムゾーン（チャンネル or ブラウザ）

### 3. 録画ファイルをダウンロード

1. サイドバーの「録画ファイル」をクリック
2. ダウンロードアイコンをクリック

## API エンドポイント

### チャンネル管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/channels` | チャンネル一覧取得 |
| GET | `/api/channels/{id}` | チャンネル詳細取得 |
| POST | `/api/channels` | チャンネル作成 |
| PUT | `/api/channels/{id}` | チャンネル更新 |
| DELETE | `/api/channels/{id}` | チャンネル削除 |

### 録画予約管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/recordings` | 録画予約一覧取得 |
| GET | `/api/recordings/{id}` | 録画予約詳細取得 |
| POST | `/api/recordings` | 録画予約作成 |
| PUT | `/api/recordings/{id}` | 録画予約更新 |
| DELETE | `/api/recordings/{id}` | 録画予約キャンセル/削除 |
| GET | `/api/recordings/{id}/convert-time` | タイムゾーン変換 |

### 録画ファイル管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/files` | ファイル一覧取得 |
| GET | `/api/files/{id}` | ファイル詳細取得 |
| GET | `/api/files/{id}/download` | ファイルダウンロード |
| DELETE | `/api/files/{id}` | ファイル削除 |

## ディレクトリ構成

```
m3u8_recorder/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── scheduler.py
│       ├── models/
│       ├── schemas/
│       └── routers/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
└── README.md
```

## トラブルシューティング

### 録画が開始されない

- チャンネルのm3u8 URLが有効か確認してください
- Docker コンテナのログを確認してください: `docker compose logs backend`

### データベース接続エラー

- PostgreSQLコンテナが正常に起動しているか確認してください
- `docker compose ps` でステータスを確認

### 録画ファイルが見つからない

- 録画が正常に完了したか確認してください
- ファイルボリュームのパーミッションを確認してください

## ライセンス

MIT License

