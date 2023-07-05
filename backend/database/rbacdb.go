package database

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"os"
)

func ConnectToRBACDB() (*gorm.DB, error) {
	dbHost := os.Getenv("RBAC_DBHOST")
	dbPort := os.Getenv("RBAC_DBPORT")
	dbName := os.Getenv("RBAC_DBNAME")
	dbUser := os.Getenv("RBAC_DBUSER")
	dbPass := os.Getenv("RBAC_DBPASS")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", dbUser, dbPass, dbHost, dbPort, dbName)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	return db, err
}
