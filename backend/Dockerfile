FROM python:3.12-slim

# Prevent Python from writing pyc files and enable immediate stdout flushing
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=wsgi.py

WORKDIR /phk

# Create non-root runtime user
RUN addgroup --system phkgroup && adduser --system --ingroup phkgroup phkuser

# Install production dependencies
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Fix ownership and make entrypoint executable
RUN chown -R phkuser:phkgroup /phk \
    && chmod +x /phk/docker-entrypoint.sh

USER phkuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["web"]
