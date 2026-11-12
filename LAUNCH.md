# Launch BLACKBOOK

BLACKBOOK is packaged as a standalone Linux app without Electron.

## From the project directory

```bash
./blackbook-launcher.py
```

The launcher starts a loopback-only Python server and opens BLACKBOOK in a dedicated Chromium app window. Closing the app also stops the local server.

## Application menu

Install the included desktop entry for the current user:

```bash
mkdir -p ~/.local/share/applications
cp blackbook.desktop ~/.local/share/applications/blackbook.desktop
```

The launcher requires Python 3 and Chromium, Chromium Browser, Google Chrome, or Chrome. It does not use Electron.
