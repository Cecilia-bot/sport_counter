FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY . .

EXPOSE 5500

CMD ["sh", "-c", "python3 -m http.server ${PORT:-5500}"]
