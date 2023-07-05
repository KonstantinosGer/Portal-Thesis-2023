package config

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
	//"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

//LOGGER
func InitLogging() {
	if os.Getenv("APP_ENV") == "prod" {
		if _, err := os.Stat("./logs/"); os.IsNotExist(err) {
			os.MkdirAll("./logs", 0700)
		}
		dt := time.Now()
		file, err := os.OpenFile("./logs/logs."+dt.Format("2006-01-02")+".log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
		if err != nil {
			log.Fatalln(err)
		}
		log.SetOutput(file)
		log.Println("Set log to file")
	} else {
		log.SetOutput(os.Stdout)
		log.Println("Set log to stdout")
	}
	log.SetFlags(log.LstdFlags | log.Lshortfile)
}

func Port() (string, error) {
	var envs map[string]string
	envs, err := godotenv.Read("./info/.env")
	if err != nil {
		log.Fatalln("Error loading .env file")
	}
	port := envs["PORT"]
	return ":" + port, nil
}

func DB() string {
	dbuser := os.Getenv("DBUSER")
	dbpass := os.Getenv("DBPASS")
	dbhost := os.Getenv("DBHOST")
	dbport := os.Getenv("DBPORT")
	dbname := os.Getenv("DBNAME")

	return dbuser + ":" + dbpass + "@tcp(" + dbhost + ":" + dbport + ")/" + dbname
}

func ENV(key string) string {
	return os.Getenv(key)
}

func RBAC_DBConn() (*gorm.DB, error) {

	USER := os.Getenv("RBAC_DBUSER")
	PASS := os.Getenv("RBAC_DBPASS")
	HOST := os.Getenv("RBAC_DBHOST")
	PORT := os.Getenv("RBAC_DBPORT")
	DBNAME := os.Getenv("RBAC_DBNAME")

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold: time.Second, // Slow SQL threshold
			LogLevel:      logger.Info, // Log level
			Colorful:      true,        // Disable color
		},
	)

	url := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", USER, PASS, HOST, PORT, DBNAME)

	return gorm.Open(mysql.Open(url), &gorm.Config{Logger: newLogger})
}
