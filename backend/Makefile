.PHONY: dev seed migrate migrate-create docker-up docker-down

# Start dev server
dev:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Seed database with test data
seed:
	python -m app.seed

# Run Alembic migrations
migrate:
	alembic upgrade head

# Create a new migration
migrate-create:
	alembic revision --autogenerate -m "$(msg)"

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

# Full setup: docker + migrate + seed
setup: docker-up
	sleep 3
	alembic upgrade head
	python -m app.seed
