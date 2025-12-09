# 🌑 Rockshop App Demo

A portable **Node + PostgreSQL** stack that lets rock-shop owners catalog, search, add, edit, and delete mineral inventory— all wrapped in Docker so it boots with a single command.

---

## Features

* **PostgreSQL 16** with an example `receipts` table and seed data  
* **Express 5** back-end (`/api/receipts`)  
* Static **Bootstrap 5** front-end (`public/`)  
* One-click **Adminer** (DB UI) on port `8080`  
* Works on Windows 10/11, macOS, Linux—anywhere Docker runs

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Docker Desktop 4.25+** | Windows 10/11: enable *WSL 2* and turn on **WSL integration** for your distro.<br>macOS / Linux: regular Docker Engine. |
| **Git** | For cloning this repo (`git clone …`). |

> **No local Node / PostgreSQL required**—everything lives in containers.

---

## Quick-start

```bash
git clone git@github.com:QuadeCSquared/rockshop.git
cd rockshop/rockshop-app

# Build & launch in background
docker compose up --build # Add '-d' after '--build' to run in background. Use 'CTRL + C' to shutdown the docker when running not in the background
docker compose down # Clean up the docker. Add '-v' after 'down' to fully delete the docker volumes so its a clean start, most important for the database

Visit http://localhost:3000/