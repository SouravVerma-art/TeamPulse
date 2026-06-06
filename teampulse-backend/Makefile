.PHONY: run build tidy test curl-health curl-brief curl-stream

# ── Development ───────────────────────────────────────────────────────────────

run:
	@echo "Starting TeamPulse backend..."
	GITHUB_TOKEN=$(GITHUB_TOKEN) go run ./main.go

build:
	go build -o bin/teampulse ./main.go

tidy:
	go mod tidy

test:
	go test ./...

# ── Quick API tests (run while server is up) ──────────────────────────────────

curl-health:
	curl -s http://localhost:9090/health | jq .

curl-brief:
	curl -s -X POST http://localhost:9090/brief | jq .

curl-stream:
	@echo "Streaming SSE trace (Ctrl+C to stop):"
	curl -N http://localhost:9090/brief/stream

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build:
	docker build -t teampulse-backend .

docker-run:
	docker run -p 9090:9090 -e GITHUB_TOKEN=$(GITHUB_TOKEN) teampulse-backend
