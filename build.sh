#!/bin/bash

# Exit on error
set -o errexit

# Install dependencies
python3 -m pip install -r requirements.txt

# Collect static files
python3 manage.py collectstatic --noinput

# Apply database migrations
python3 manage.py migrate
