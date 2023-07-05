package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	//ENV
	err := godotenv.Load("./info/.env")

	// migrate db model to updated (only when gorm is used)
	//migrate.MigrateDBGorm()

	//     LOGGING
	config.InitLogging()

	if err != nil {
		log.Println("Error loading env in main")
	}

	if config.ENV("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, _ := models.DBConnection()

	routes.SetupRoutes(db)
}
