.PHONY: dev dev-local test migrate migration format lint clean

VENV = .venv
PYTHON = $(VENV)/bin/python
PYTEST = $(VENV)/bin/pytest
ALEMBIC = $(VENV)/bin/alembic

dev:
	docker compose up --build

dev-local:
	cd backend && $(VENV)/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	cd backend && PYTHONPATH=. $(PYTEST) -v tests/

migrate:
	cd backend && $(ALEMBIC) upgrade head

migration:
	cd backend && $(ALEMBIC) revision --autogenerate -m "$(m)"

lint:
	cd backend && $(PYTHON) -m ruff check .

format:
	cd backend && $(PYTHON) -m ruff format .

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
