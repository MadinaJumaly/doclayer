# Load Django settings once so tests can use Django Ninja's TestClient.
# No test touches the database: auth is faked with a mock user.
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "company.settings")
django.setup()
