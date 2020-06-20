gunicorn -w 3 -b 0.0.0.0:8000 datax.wsgi:application -D

celery worker -A datax -D

celery beat -A datax
