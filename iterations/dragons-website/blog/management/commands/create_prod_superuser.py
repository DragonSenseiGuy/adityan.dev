import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Creates a superuser for the production environment using environment variables"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("SUPERUSER_USERNAME")
        password = os.environ.get("SUPERUSER_PASSWORD")
        email = os.environ.get("SUPERUSER_EMAIL")

        if not all([username, password, email]):
            self.stderr.write(self.style.ERROR("SUPERUSER_USERNAME, SUPERUSER_PASSWORD, and SUPERUSER_EMAIL environment variables are required."))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' already exists."))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Successfully created superuser '{username}'"))
