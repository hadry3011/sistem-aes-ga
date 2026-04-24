# backend/app/__init__.py
from flask import Flask
from .routes import bp

def create_app():
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
        static_url_path="/static"
    )

    # batas upload 2MB tetap ada
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

    # daftar semua route (AES baseline + AES+GA) dari routes.py
    app.register_blueprint(bp)

    return app
