#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os

PORT = 5500
DIRECTORY = "c:\\Users\\ghost\\OneDrive\\Documentos\\Pilates-Pulse"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print(f"Server also accessible at http://YOUR_IP:{PORT}")
        print(f"Serving files from: {DIRECTORY}")
        print("Press Ctrl+C to stop the server")
        webbrowser.open(f"http://localhost:{PORT}/index.html")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
