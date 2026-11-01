FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-impress libreoffice-calc chromium fonts-dejavu fonts-liberation && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir Pillow==11.3.0 PyMuPDF==1.26.3 playwright==1.58.0 pillow-heif==1.1.0 Markdown==3.8.2
ENV XDG_CONFIG_HOME=/tmp/chromium-config XDG_CACHE_HOME=/tmp/chromium-cache
COPY convert.py /app/convert.py
ENTRYPOINT ["python", "/app/convert.py"]
