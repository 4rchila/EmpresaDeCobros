FROM python:3.12

WORKDIR /app

COPY requirements.txt .
RUN apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]