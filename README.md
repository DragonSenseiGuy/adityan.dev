# dragons-website

The code that runs my weblog

## Local Development

1.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up the database:**
    For local development, it's easiest to use a SQLite database. You can configure this by setting the `DATABASE_URL` environment variable. It's recommended to add this to a `.env` file in the root of your project:

    ```
    DATABASE_URL=sqlite:///db.sqlite3
    ```

    You will also need to install `python-dotenv` to load this file:
    ```bash
    pip install python-dotenv
    ```

4.  **Run database migrations:**
    ```bash
    python3 manage.py migrate
    ```

5.  **Create a superuser:**
    To access the Django admin, you'll need a superuser account:
    ```bash
    python3 manage.py createsuperuser
    ```

6.  **Start the development server:**
    ```bash
    python3 manage.py runserver
    ```

The site will be available at `http://127.0.0.1:8000/` and the admin interface at `http://127.0.0.1:8000/admin`.

## Search Engine

This blog includes a built-in search engine. Here's how it works:

1. The search functionality is implemented in the `search` function in `blog/search.py`.
2. It uses a combination of full-text search and tag-based filtering.
3. The search index is built and updated automatically when new content is added to the blog.
4. Users can search for content using keywords, which are matched against the full text of blog entries and blogmarks.
5. The search results are ranked based on relevance and can be further filtered by tags.
6. The search interface is integrated into the blog's user interface, allowing for a seamless user experience.

For more details on the implementation, refer to the `search` function in `blog/search.py`.
