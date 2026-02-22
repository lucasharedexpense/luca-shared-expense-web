# Gunakan python 3.9
FROM python:3.9

WORKDIR /code

# UPDATE PENTING:
# Ganti 'libgl1-mesa-glx' menjadi 'libgl1' dan 'libglib2.0-0'
# Ini kompatibel dengan Debian versi terbaru (Bookworm/Trixie)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy dan install requirements
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy sisa file
COPY . /code

EXPOSE 7860

# Beri hak akses (optional tapi aman)
RUN chmod -R 777 /code

# Jalankan aplikasi
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]