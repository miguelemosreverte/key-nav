package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

// Vendor represents a data provider
type Vendor struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Incident represents an event record in the database
type Incident struct {
	ID           int             `json:"id"`
	IncidentDate string          `json:"incident_date"`
	Lat          float64         `json:"lat"`
	Lng          float64         `json:"lng"`
	Data         json.RawMessage `json:"data"`
}

// DateCount represents aggregated incidents by date
type DateCount struct {
	IncidentDate string `json:"incident_date"`
	Count        int    `json:"count"`
}

// VendorDB holds the database connection for each vendor
type VendorDB struct {
	DB *sql.DB
}

// Constants
const (
	dataDir      = "./data"
	port         = 3000
	staticDir    = "./public"
	vendorPrefix = "vendor"
)

var (
	// List of vendor names and IDs
	vendorNames = []string{"Vendor A", "Vendor B", "Vendor C", "Vendor D"}
	vendorIds   = []string{"vendor1", "vendor2", "vendor3", "vendor4"}
	
	// Map to store database connections
	vendorDBs = make(map[string]*VendorDB)
)

func init() {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	// Create data directory if it doesn't exist
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		err := os.MkdirAll(dataDir, 0755)
		if err != nil {
			log.Fatal("Error creating data directory:", err)
		}
	}
}

func main() {
	// Initialize vendor databases
	for _, vendorId := range vendorIds {
		initVendorDB(vendorId)
	}
	defer closeAllDBs()

	// Setup HTTP server with Gin
	router := gin.Default()
	
	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Serve static files
	router.Static("/", staticDir)

	// Setup API routes
	api := router.Group("/api")
	{
		// Get all vendors
		api.GET("/vendors", getVendors)
		
		// Get incidents for a vendor
		api.GET("/vendors/:vendorId/incidents", getVendorIncidents)
		
		// Get incidents by date for a vendor
		api.GET("/vendors/:vendorId/incidents/by-date", getVendorIncidentsByDate)
	}

	// Start the server
	log.Printf("Starting server on port %d\n", port)
	router.Run(fmt.Sprintf(":%d", port))
}

// Initialize database for a vendor
func initVendorDB(vendorId string) {
	dbPath := filepath.Join(dataDir, fmt.Sprintf("%s.db", vendorId))
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Error opening database for %s: %v", vendorId, err)
	}

	// Create incidents table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS incidents (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			incident_date TEXT,
			lat REAL,
			lng REAL,
			data TEXT
		)
	`)
	if err != nil {
		log.Fatalf("Error creating table for %s: %v", vendorId, err)
	}

	// Check if data exists
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM incidents").Scan(&count)
	if err != nil {
		log.Fatalf("Error checking data for %s: %v", vendorId, err)
	}

	// Seed data if empty
	if count == 0 {
		log.Printf("Seeding data for %s", vendorId)
		seedVendorData(db, vendorId)
	}

	// Store the DB connection
	vendorDBs[vendorId] = &VendorDB{DB: db}
}

// Close all database connections
func closeAllDBs() {
	for vendor, db := range vendorDBs {
		if db.DB != nil {
			db.DB.Close()
			log.Printf("Closed database connection for %s", vendor)
		}
	}
}

// Seed random data for a vendor
func seedVendorData(db *sql.DB, vendorId string) {
	// Extract vendor index from ID
	vendorIndex, _ := strconv.Atoi(strings.TrimPrefix(vendorId, vendorPrefix))
	vendorIndex-- // 0-based index

	// Different number of incidents per vendor
	incidentCount := 20 + (vendorIndex * 5)

	// Base location for each vendor (different areas)
	baseLat := 40.7 + (float64(vendorIndex) * 0.1)
	baseLng := -74.0 - (float64(vendorIndex) * 0.1)

	// Prepare insert statement
	stmt, err := db.Prepare(`
		INSERT INTO incidents (incident_date, lat, lng, data) 
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		log.Fatalf("Error preparing statement for %s: %v", vendorId, err)
	}
	defer stmt.Close()

	// Insert random data
	for i := 0; i < incidentCount; i++ {
		// Random date within last 30 days
		date := time.Now().AddDate(0, 0, -rand.Intn(30))
		dateStr := date.Format("2006-01-02")

		// Random location near base coordinates
		lat := baseLat + (rand.Float64() * 0.1) - 0.05
		lng := baseLng + (rand.Float64() * 0.1) - 0.05

		// Different data schema per vendor
		var data []byte
		switch vendorIndex {
		case 0: // Vendor A: Network issues
			incidentType := []string{"Outage", "Degradation", "Latency"}[rand.Intn(3)]
			severity := rand.Intn(5) + 1
			duration := rand.Intn(120) + 5
			users := rand.Intn(1000) + 10
			data, _ = json.Marshal(map[string]interface{}{
				"type":             incidentType,
				"severity":         severity,
				"duration_minutes": duration,
				"affected_users":   users,
			})

		case 1: // Vendor B: Security incidents
			category := []string{"Malware", "Phishing", "Unauthorized Access"}[rand.Intn(3)]
			impact := []string{"Low", "Medium", "High", "Critical"}[rand.Intn(4)]
			mitigated := rand.Float64() > 0.3
			systems := rand.Intn(20) + 1
			data, _ = json.Marshal(map[string]interface{}{
				"category":         category,
				"impact":           impact,
				"mitigated":        mitigated,
				"systems_affected": systems,
			})

		case 2: // Vendor C: Hardware failures
			deviceType := []string{"Server", "Router", "Switch", "Storage"}[rand.Intn(4)]
			model := fmt.Sprintf("Model-%d", rand.Intn(1000))
			faultCode := fmt.Sprintf("E%d", rand.Intn(1000))
			replaced := rand.Float64() > 0.5
			data, _ = json.Marshal(map[string]interface{}{
				"device_type": deviceType,
				"model":       model,
				"fault_code":  faultCode,
				"replaced":    replaced,
			})

		case 3: // Vendor D: Software bugs
			application := []string{"Frontend", "Backend", "Database", "API"}[rand.Intn(4)]
			version := fmt.Sprintf("%d.%d.%d", rand.Intn(10), rand.Intn(10), rand.Intn(10))
			priority := rand.Intn(5) + 1
			resolution := rand.Intn(72) + 1
			data, _ = json.Marshal(map[string]interface{}{
				"application":           application,
				"version":               version,
				"priority":              priority,
				"resolution_time_hours": resolution,
			})
		}

		// Execute insert
		_, err := stmt.Exec(dateStr, lat, lng, string(data))
		if err != nil {
			log.Printf("Error inserting data for %s: %v", vendorId, err)
		}
	}
}

// API Handler: Get all vendors
func getVendors(c *gin.Context) {
	vendors := make([]Vendor, len(vendorIds))
	for i, id := range vendorIds {
		vendors[i] = Vendor{
			ID:   id,
			Name: vendorNames[i],
		}
	}
	c.JSON(http.StatusOK, vendors)
}

// API Handler: Get incidents for a vendor
func getVendorIncidents(c *gin.Context) {
	vendorId := c.Param("vendorId")
	
	// Check if vendor exists
	vendorDB, exists := vendorDBs[vendorId]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor not found"})
		return
	}
	
	// Query incidents
	rows, err := vendorDB.DB.Query("SELECT id, incident_date, lat, lng, data FROM incidents ORDER BY incident_date DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()
	
	// Parse results
	incidents := []Incident{}
	for rows.Next() {
		var incident Incident
		var dataStr string
		err := rows.Scan(&incident.ID, &incident.IncidentDate, &incident.Lat, &incident.Lng, &dataStr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Data parsing error"})
			return
		}
		
		// Parse the JSON data
		incident.Data = json.RawMessage(dataStr)
		incidents = append(incidents, incident)
	}
	
	c.JSON(http.StatusOK, incidents)
}

// API Handler: Get incidents by date for a vendor
func getVendorIncidentsByDate(c *gin.Context) {
	vendorId := c.Param("vendorId")
	
	// Check if vendor exists
	vendorDB, exists := vendorDBs[vendorId]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vendor not found"})
		return
	}
	
	// Query incidents by date
	rows, err := vendorDB.DB.Query("SELECT incident_date, COUNT(*) as count FROM incidents GROUP BY incident_date ORDER BY incident_date")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()
	
	// Parse results
	dateCounts := []DateCount{}
	for rows.Next() {
		var dateCount DateCount
		err := rows.Scan(&dateCount.IncidentDate, &dateCount.Count)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Data parsing error"})
			return
		}
		dateCounts = append(dateCounts, dateCount)
	}
	
	c.JSON(http.StatusOK, dateCounts)
} 