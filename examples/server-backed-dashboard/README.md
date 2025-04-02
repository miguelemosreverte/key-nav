# KeyNav Server-Backed Dashboard Example

This example demonstrates how to use KeyNav with a server-backed dashboard featuring dynamic content loading. It showcases:

1. A sidenav with vendors loaded from an API
2. Dedicated SQLite databases per vendor with common schema
3. Dynamic loading of content when navigating with keyboard
4. Multiple visualization types:
   - Chart.js histogram of incidents by date
   - Leaflet map showing incident locations
   - Dynamic table with vendor-specific JSON schema

## Server Options

This example includes two server implementations with identical functionality:

- [Node.js Server](#nodejs-server) - Using Express and SQLite
- [Go Server](#go-server) - Using Gin framework and SQLite

## Prerequisites

### Node.js Server
- Node.js 14+ installed
- npm or yarn package manager

### Go Server
- Go 1.19+ installed
- GCC compiler (for SQLite support)

## Setup & Running

### Node.js Server

1. Navigate to the base directory:
```bash
cd examples/server-backed-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

### Go Server

1. Navigate to the Go server directory:
```bash
cd examples/server-backed-dashboard/go-server
```

2. Install Go dependencies:
```bash
go mod download
```

3. Run the server:
```bash
go run main.go
```

4. Open your browser to http://localhost:3000

## How it Works

### Server Side

- Server (Node.js or Go) with SQLite databases (one per vendor)
- Each vendor has incidents with:
  - Date
  - Latitude/Longitude
  - JSON data (schema consistent per vendor)
- API endpoints for:
  - `/api/vendors` - List of vendors
  - `/api/vendors/:vendorId/incidents` - Incidents for a specific vendor
  - `/api/vendors/:vendorId/incidents/by-date` - Incidents aggregated by date

### Frontend

- Uses KeyNav's sidenav-viewport pattern
- Vendors listed in left sidebar
- Dynamic loading of data when a vendor is selected
- Automatic refresh of KeyNav when new DOM elements are added

## KeyNav Features Demonstrated

- Arrow key navigation between vendors
- Enter to view vendor details
- Escape to return to vendor list
- Dynamic DOM additions with automatic KeyNav refresh
- Sidenav-viewport pattern for dashboard layout

## Navigation Instructions

- **Arrow Up/Down**: Navigate between vendors in the sidebar
- **Enter**: Select a vendor to view their incidents
- **Escape**: Return to the vendor list from a vendor's dashboard 