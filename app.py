from flask import Flask, render_template, abort
import frontmatter
import markdown
from pathlib import Path
import re

app = Flask(__name__)

BLOGS_DIR = Path(__file__).parent / "blogs"

def get_all_posts():
    posts = []
    if BLOGS_DIR.exists():
        for file in BLOGS_DIR.glob("*.md"):
            post = frontmatter.load(file)
            posts.append({
                "slug": file.stem,
                "title": post.get("title", file.stem),
                "description": post.get("description", ""),
                "pubDate": post.get("pubDate", ""),
            })
    posts.sort(key=lambda x: x["pubDate"], reverse=True)
    return posts

def get_post(slug):
    file_path = BLOGS_DIR / f"{slug}.md"
    if not file_path.exists():
        return None
    post = frontmatter.load(file_path)
    md = markdown.Markdown(extensions=[
        "fenced_code",
        "codehilite",
        "tables",
        "nl2br",
        "sane_lists",
        "md_in_html",
        "def_list",
        "footnotes",
        "toc",
    ])
    content = md.convert(post.content)
    content = content.replace("[ ]", '<input type="checkbox" disabled>')
    content = content.replace("[x]", '<input type="checkbox" checked disabled>')
    content = content.replace("[X]", '<input type="checkbox" checked disabled>')
    content = content.replace("<del>", "<s>").replace("</del>", "</s>")
    content = re.sub(r'~~(.+?)~~', r'<s>\1</s>', content)
    return {
        "slug": slug,
        "title": post.get("title", slug),
        "description": post.get("description", ""),
        "pubDate": post.get("pubDate", ""),
        "content": content,
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/blog")
def blog():
    posts = get_all_posts()
    return render_template("blog.html", posts=posts)

@app.route("/blog/<slug>")
def blog_post(slug):
    post = get_post(slug)
    if not post:
        abort(404)
    return render_template("post.html", post=post)

@app.route("/projects")
def projects():
    return render_template("projects.html")

if __name__ == "__main__":
    app.run()
