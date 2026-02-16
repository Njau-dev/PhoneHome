#!/bin/sh
set -e

case "${1:-web}" in
  migrate)
    flask db upgrade
    ;;
  web)
    if [ "${AUTO_MIGRATE:-1}" = "1" ]; then
      echo "Running database migrations..."
      flask db upgrade
    fi

    exec gunicorn wsgi:app \
      --bind 0.0.0.0:8000 \
      --workers "${GUNICORN_WORKERS:-4}" \
      --threads "${GUNICORN_THREADS:-2}" \
      --timeout "${GUNICORN_TIMEOUT:-120}"
    ;;
  *)
    exec "$@"
    ;;
esac
