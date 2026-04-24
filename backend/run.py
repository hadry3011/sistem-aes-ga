from app import create_app

print(">>> RUN.PY DIEKSEKUSI")

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)
