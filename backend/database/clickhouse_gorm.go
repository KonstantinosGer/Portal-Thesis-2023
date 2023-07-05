package database

import (
	"fmt"
	"gorm.io/driver/clickhouse"
	"gorm.io/gorm"
	"os"
)

func ConnectGormDBClickhouse() (*gorm.DB, error) {

	dbhost := os.Getenv("CLICKHOUSE_DBHOST")
	dbport := "9000"
	dbname := os.Getenv("CLICKHOUSE_DBNAME")
	dbuser := os.Getenv("CLICKHOUSE_DBUSER")
	dbpass := os.Getenv("CLICKHOUSE_DBPASS")

	dsn := fmt.Sprintf("tcp://%s:%s?database=%s&username=%s&password=%s&max_query_size=100000000", dbhost, dbport, dbname, dbuser, dbpass)

	db, err := gorm.Open(clickhouse.Open(dsn), &gorm.Config{})
	return db, err
}
