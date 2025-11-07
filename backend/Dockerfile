FROM python:3.11-slim

WORKDIR /app

# uvをインストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 依存関係ファイルをコピー
COPY pyproject.toml ./

# 依存関係をインストール
RUN uv pip install --system -r pyproject.toml

# アプリケーションコードをコピー
COPY ./app ./app

# ポート公開
EXPOSE 8000

# サーバー起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
