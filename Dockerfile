# Gunakan python 3.9
FROM python:3.9-slim

WORKDIR /code

# Install system dependencies (wajib pakai slim agar ringan)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy dan install requirements
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# --- PERBAIKAN FATAL DI SINI ---
# 1. Bikin folder publik untuk cache EasyOCR
RUN mkdir -p /code/.EasyOCR
# 2. Paksa EasyOCR pakai folder publik itu
ENV EASYOCR_MODULE_PATH=/code/.EasyOCR
# 3. Baru suruh dia download
RUN python -c "import easyocr; easyocr.Reader(['id'], gpu=False)"

# Copy sisa file
COPY . /code

# Beri hak akses full ke seluruh folder code
RUN chmod -R 777 /code

# Jalankan aplikasi (tanpa EXPOSE)
CMD ["python", "main.py"]