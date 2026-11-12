#!/usr/bin/env python3
"""Launch BLACKBOOK as a standalone Chromium app window.

This deliberately uses no Electron runtime: Python owns a short-lived local
HTTP server and Chromium renders the existing static UI in app mode.
"""

from __future__ import annotations

import http.server
import os
import shutil
import socket
import subprocess
import sys
import threading
from pathlib import Path


ROOT = Path(__file__).resolve().parent
APP_URL_PATH = "/index.html"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Serve the project without noisy request logs."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, _format, *_args):
        pass


class ReusableServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def browser_binary() -> str | None:
    candidates = ("chromium", "chromium-browser", "google-chrome", "chrome")
    return next((shutil.which(candidate) for candidate in candidates if shutil.which(candidate)), None)


def main() -> int:
    browser = browser_binary()
    if browser is None:
        print("BLACKBOOK needs Chromium or a Chromium-compatible browser.", file=sys.stderr)
        return 1

    port = free_port()
    server = ReusableServer(("127.0.0.1", port), QuietHandler)
    state_root = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local/state")) / "blackbook"
    state_root.mkdir(parents=True, exist_ok=True)
    profile = state_root / "chromium-profile"
    url = f"http://127.0.0.1:{port}{APP_URL_PATH}"
    args = [
        browser,
        f"--app={url}",
        f"--user-data-dir={profile}",
        "--class=Blackbook",
        "--no-first-run",
        "--no-default-browser-check",
    ]

    try:
        process = subprocess.Popen(args, cwd=ROOT)
    except OSError as exc:
        server.server_close()
        print(f"Could not launch Chromium: {exc}", file=sys.stderr)
        return 1

    print(f"BLACKBOOK running at {url}")
    server_thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.25}, daemon=True)
    server_thread.start()
    try:
        process.wait()
    except KeyboardInterrupt:
        if process.poll() is None:
            process.terminate()
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=2)
        if process.poll() is None:
            process.terminate()
        process.wait(timeout=5)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
