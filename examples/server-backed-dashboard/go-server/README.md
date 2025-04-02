# Go Server for KeyNav Dashboard Example

This is the Go implementation of the server backend for the KeyNav dashboard example. It provides the same functionality as the Node.js version but is implemented in Go with SQLite.

## Features

- Written in Go using the Gin web framework
- Uses SQLite for database (one per vendor)
- Provides RESTful API endpoints for vendor data
- Serves static frontend files
- Automatically seeds demo data

## Prerequisites

- Go 1.19 or later
- GCC compiler (for SQLite support)

## Setup

1. Install Go dependencies:

```bash
go mod download
```

2. Build the server:

```bash
go build -o server .
```

3. Run the server:

```bash
./server
```

Or run directly without building:

```bash
go run main.go
```

4. Open your browser to http://localhost:3000

## API Endpoints

The server exposes the following API endpoints:

- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:vendorId/incidents` - Get all incidents for a specific vendor
- `GET /api/vendors/:vendorId/incidents/by-date` - Get incidents aggregated by date for a specific vendor

## Data Structure

Each vendor has its own SQLite database with the following schema:

```sql
CREATE TABLE incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_date TEXT,
    lat REAL,
    lng REAL,
    data TEXT
);
```

The `data` field contains JSON with a schema that differs per vendor:

- **Vendor A (Network issues)**: type, severity, duration_minutes, affected_users
- **Vendor B (Security)**: category, impact, mitigated, systems_affected
- **Vendor C (Hardware)**: device_type, model, fault_code, replaced
- **Vendor D (Software)**: application, version, priority, resolution_time_hours

## Integration with Frontend

The Go server serves the static HTML/JS/CSS files from the `public` directory. The frontend uses KeyNav for keyboard navigation and connects to these API endpoints to display vendor data. 