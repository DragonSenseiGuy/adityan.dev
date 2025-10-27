# Local Setup

1.  **Install dependencies:**
    First, you need to install the required Python packages. I recommend doing this in a virtual environment.

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

2.  **Run database migrations:**
    This will set up the necessary database tables.

    ```bash
    python manage.py migrate
    ```

3.  **Start the development server:**
    This will start the Django development server.

    ```bash
    python manage.py runserver
    ```

After running the last command, you should be able to access the website at `http://127.0.0.1:8000` in your web browser.
