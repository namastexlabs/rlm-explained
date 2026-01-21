.PHONY: help check-deps install install-dev start start-backend start-frontend lint format test check

help:
	@echo "RLM Explained - Educational Tool for Recursive Language Models"
	@echo ""
	@echo "Setup:"
	@echo "  make install        - Install all dependencies (backend + frontend)"
	@echo "  make install-dev    - Install dev dependencies"
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
	@echo "Checking dependencies..."
	@command -v uv >/dev/null 2>&1 || { echo "Error: 'uv' is not installed. Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "Error: 'pnpm' is not installed. Install it with: npm install -g pnpm"; exit 1; }
	@echo "All dependencies found."

install: check-deps
	@echo "Installing backend dependencies..."
	uv pip install -e ".[server]"
	@echo "Installing frontend dependencies..."
	cd visualizer && pnpm install
	@echo "Installation complete!"

install-dev: check-deps
	uv sync --group dev --group test
	uv pip install -e ".[server]"
	cd visualizer && pnpm install

start-backend:
	uv run python server/main.py

start-frontend:
	cd visualizer && pnpm dev

start:
	@echo "Starting RLM servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@trap 'kill 0' EXIT; \
	uv run python server/main.py & \
	cd visualizer && pnpm dev

lint: install-dev
	uv run ruff check .

format: install-dev
	uv run ruff format .

test: install-dev
	uv run pytest

check: lint format test
