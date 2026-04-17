FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml /app/pyproject.toml
COPY alembic.ini /app/alembic.ini
COPY alembic /app/alembic
COPY app /app/app
COPY start.sh /app/start.sh

RUN pip install --no-cache-dir uv && uv pip install --system .
RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]
