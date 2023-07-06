package database

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"os"
)

func ConnectToRBACGorm() (*gorm.DB, error) {
	dbHost := os.Getenv("RBAC_DBHOST")
	dbPort := os.Getenv("RBAC_DBPORT")
	dbName := os.Getenv("RBAC_DBNAME")
	dbUser := os.Getenv("RBAC_DBUSER")
	dbPass := os.Getenv("RBAC_DBPASS")

	dsn := dbUser + ":" + dbPass + "@tcp(" + dbHost + ":" + dbPort + ")/" + dbName + "?charset=utf8mb4&parseTime=True&loc=UTC"
	db, err := gorm.Open(mysql.Open(dsn))

	return db, err
}
