# Carnival Escape - Room Control Panel

A web-based control panel for managing a creepy carnival-themed escape room. Communicates with Node-RED via HTTP REST for room and prop control.

## Features

- **Countdown Timer** — configurable duration (default 60 min), start/stop/reset, visual urgency as time runs low
- **Hint Display** — send custom messages to the in-room display, or clear it
- **Display Settings** — brightness slider (0–255) and RGB colour picker for the ESP32 LED display
- **Prop Controls** — 4 props with lock/unlock toggle, reset, and editable names (persisted in localStorage)
- **Creepy Carnival Theme** — dark aesthetic with animated fog, carnival fonts, red/gold/purple palette

## Quick Start

```bash
docker build -t carnival-escape .
docker run -p 8080:80 carnival-escape
```

Open `http://localhost:8080`

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `NODERED_URL` | `http://nodered.local` | Base URL of your Node-RED instance |

```bash
docker run -p 8080:80 -e NODERED_URL=http://your-nodered-host:1880 carnival-escape
```

## Node-RED Endpoints

Create HTTP-in nodes in Node-RED for the following endpoints:

| Method | Path | Payload |
|---|---|---|
| POST | `/api/timer` | `{ "action": "start\|stop\|reset", "duration": <seconds>, "remaining": <seconds> }` |
| POST | `/api/hint` | `{ "message": "<text>" }` |
| POST | `/api/display` | `{ "brightness": 0-255, "color": "#rrggbb" }` |
| POST | `/api/prop` | `{ "id": 1-4, "action": "lock\|unlock\|reset" }` |

## Custom Background Image

Drop an image as `public/img/bg.jpg` before building the Docker image. It displays as a darkened overlay (25% opacity) behind the UI.

## Project Structure

```
carnival-escape/
├── Dockerfile
├── entrypoint.sh
├── nginx.conf.template
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    ├── js/
    │   └── app.js
    └── img/              ← place bg.jpg here
```

## Architecture

- **Frontend**: Vanilla HTML/CSS/JS — no build step
- **Server**: nginx (static files + reverse proxy to Node-RED)
- **Container**: nginx:alpine with `envsubst` for runtime config injection
