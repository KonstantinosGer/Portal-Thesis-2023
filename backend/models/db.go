package models

import (
	"backend/config"
	"gorm.io/gorm"
)

//DBConnection -> return db instance
func DBConnection() (*gorm.DB, error) {
	return config.RBAC_DBConn()
}
