.PHONY: build run clean

# Default target
all: build

# Build the Go server
build:
	@echo "Building KeyNav Dashboard Go server..."
	@go build -o server main.go
	@echo "Build complete! Run with: ./server"

# Run the server directly
run:
	@echo "Starting KeyNav Dashboard Go server..."
	@go run main.go

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -f server
	@echo "Cleaned!"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	@go mod download
	@echo "Dependencies downloaded!"

# Create data directory
setup:
	@echo "Setting up data directory..."
	@mkdir -p data
	@echo "Setup complete!"

# Full setup and run
start: deps setup run 