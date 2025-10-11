FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY sport_counter.py .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn sport_counter:app --host 0.0.0.0 --port ${PORT:-8000}"]
