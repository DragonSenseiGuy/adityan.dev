release: .venv/bin/python manage.py migrate --noinput
web: .venv/bin/gunicorn config.wsgi:application --log-file -
