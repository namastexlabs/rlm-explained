.PHONY: help check-deps install install-dev setup start start-backend start-frontend lint format test check

help:
	@echo "RLM Explained - Educational Tool for Recursive Language Models"
	@echo ""
	@echo "Setup:"
	@echo "  make install        - Install all dependencies (backend + frontend)"
	@echo "  make install-dev    - Install dev dependencies"
	@echo "  make setup          - Interactive setup wizard (configure LLM provider)"
	@echo ""
	@echo "Running:"
	@echo "  make start          - Start backend (port 8000) and frontend (port 3000)"
	@echo "  make start-backend  - Start only the backend server"
	@echo "  make start-frontend - Start only the frontend dev server"
	@echo ""
	@echo "Development:"
	@echo "  make lint           - Run ruff linter"
	@echo "  make format         - Run ruff formatter"
	@echo "  make test           - Run tests"
	@echo "  make check          - Run lint + format + tests"

check-deps:
	@echo "Checking prerequisites..."
	@# Check UV (handles Python version management)
	@command -v uv >/dev/null 2>&1 || { echo "Error: 'uv' not installed. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
	@# Check Node.js >= 18
	@command -v node >/dev/null 2>&1 || { echo "Error: 'node' not found. Install Node.js 18+ from https://nodejs.org"; exit 1; }
	@node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)" 2>/dev/null || { echo "Error: Node.js 18+ required. Found: $$(node --version)"; exit 1; }
	@# Check pnpm
	@command -v pnpm >/dev/null 2>&1 || { echo "Error: 'pnpm' not installed. Install: npm install -g pnpm"; exit 1; }
	@echo "All prerequisites found."

install: check-deps
	@echo "Installing dependencies..."
	uv sync --extra server
	@echo "Installing frontend..."
	cd visualizer && pnpm install
	@echo "Building frontend..."
	cd visualizer && pnpm build
	@echo "Installation complete!"
	@echo ""
	@uv run python scripts/setup.py

setup: check-deps
	@uv run python scripts/setup.py

install-dev: check-deps
	uv sync --group dev --group test --extra server
	cd visualizer && pnpm install

start-backend:
	uv run python server/main.py

start-frontend:
	cd visualizer && pnpm start

start:
	@echo "Starting RLM servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@trap 'kill 0' EXIT; \
	uv run python server/main.py & \
	cd visualizer && pnpm start

lint: install-dev
	uv run ruff check .

format: install-dev
	uv run ruff format .

test: install-dev
	uv run pytest

check: lint format test
