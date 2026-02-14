#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_tasks

# Create superuser
python manage.py shell << EOF
from django.contrib.auth.models import User
import os

username = 'admin'
password = 'supermanisonfly'
email = 'admin@bingo.local'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"✓ Superuser '{username}' created successfully")
else:
    print(f"✓ Superuser '{username}' already exists")
EOF
