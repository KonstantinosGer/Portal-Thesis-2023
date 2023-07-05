package database

import (
	"backend/config"
	"database/sql"
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/mailru/go-clickhouse/v2"
	"log"
	"os"
	"reflect"

	mysql "github.com/go-sql-driver/mysql"
)

//------------------
//CONNECT TO MAIN DB
//------------------
func Connect() (*sqlx.DB, error) {
	host := GetHost()
	db, errordb := sqlx.Open("mysql", host) // new: use sqlx instead of plain sql driver
	//db, errordb := sql.Open("mysql", host)
	if errordb != nil {
		log.Println("Cannot start database connection")
		return nil, errordb
	}

	CheckDatabase(db)
	return db, errordb
}

func ConnectMariaDB() (*sqlx.DB, error) {
	dbuser := os.Getenv("DBUSER")
	dbpass := os.Getenv("DBPASS")
	dbhost := os.Getenv("DBHOST")
	dbport := os.Getenv("DBPORT")
	dbname := os.Getenv("DBNAME")

	host := dbuser + ":" + dbpass + "@tcp(" + dbhost + ":" + dbport + ")/" + dbname
	db, errordb := sqlx.Open("mysql", host) // new: use sqlx instead of plain sql driver
	//db, errordb := sql.Open("mysql", host)
	if errordb != nil {
		log.Println("Cannot start database connection")
		return nil, errordb
	}

	CheckDatabase(db)
	return db, errordb
}

func AnalyticsConnect() (*sqlx.DB, error) {
	//dbuser := os.Getenv("CLICKHOUSE_DBUSER")
	//dbpass := os.Getenv("CLICKHOUSE_DBPASS")
	dbhost := os.Getenv("CLICKHOUSE_DBHOST")
	dbport := os.Getenv("CLICKHOUSE_DBPORT")
	dbname := os.Getenv("CLICKHOUSE_DBNAME")
	connect, err := sqlx.Open("chhttp", fmt.Sprintf("http://%s:%s/%s?max_query_size=100000000", dbhost, dbport, dbname))
	if err != nil {
		return nil, err
	}
	if err := connect.Ping(); err != nil {
		return nil, err
	}
	return connect, nil
}

func RBACConnect() (*sqlx.DB, error) {
	dbuser := os.Getenv("RBAC_DBUSER")
	dbpass := os.Getenv("RBAC_DBPASS")
	dbhost := os.Getenv("RBAC_DBHOST")
	dbport := os.Getenv("RBAC_DBPORT")
	dbname := os.Getenv("RBAC_DBNAME")

	host := dbuser + ":" + dbpass + "@tcp(" + dbhost + ":" + dbport + ")/" + dbname

	db, errordb := sqlx.Open("mysql", host) // new: use sqlx instead of plain sql driver
	//db, errordb := sql.Open("mysql", host)
	if errordb != nil {
		log.Println("Cannot start database connection")
		return nil, errordb
	}

	CheckDatabase(db)
	return db, errordb
}

//Check Database (PING)
func CheckDatabase(db *sqlx.DB) bool {
	err := db.Ping()
	if err == nil {
		log.Println("Connection with database was successful.")
		return true
	} else {
		log.Println("Something is wrong with the connection +", err.Error())
		db.Close()
		return false
	}
}

//------------------
//CHECK IF DB EXISTS
//------------------
func ExistsDB(db *sqlx.DB) {
	query := `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ` + config.ENV("DBNAME") + `;`
	res, err := db.Query(query)
	log.Println(query)
	if err != nil {
		log.Println(err)
	}
	var result string
	for res.Next() {
		res.Scan(&result)
	}
	print(result)
}

//-------------
//EXECUTE QUERY
//-------------
func Query(query string, db *sqlx.DB) *sql.Rows {
	res, err := db.Query(query)
	if err != nil {
		log.Println(err)
	}
	return res
}

func Exec(query string, db *sqlx.DB) sql.Result {
	res, err := db.Exec(query)
	if err != nil {
		log.Println(err)
		return nil
	}
	return res
}

// func LoadFile(query string, path string, db *sql.DB) *sql.Rows {
func LoadFile(query string, path string, db *sqlx.DB) sql.Result {
	mysql.RegisterLocalFile(path)
	// res, err := db.Query(query)
	// if err != nil {
	// 	log.Println(err)
	// }
	// return res
	res, err := db.Exec(query)
	if err != nil {
		log.Println(err)
		return nil
	}
	return res
}

func QueryAdvanced(query string, db *sqlx.DB) ([]map[string]interface{}, []string) {
	var cols []string

	rows := Query(query, db)
	cols, _ = rows.Columns()

	var results []map[string]interface{}

	var t1 *sql.Rows
	if reflect.TypeOf(rows) == reflect.TypeOf(t1) {
		j := 0
		for rows.Next() {
			result := make(map[string]interface{})
			columns := make([]string, len(cols))
			columnPointers := make([]interface{}, len(cols))
			for i := range columns {
				columnPointers[i] = &columns[i]
			}
			err := rows.Scan(columnPointers...)
			if err != nil {
				log.Println(err.Error())
				fmt.Println(err.Error())
			}
			for i, colName := range cols {

				result[colName] = columns[i]

			}
			j++
			results = append(results, result)
		}

		return results, cols
	}
	return nil, nil
}

//CLOSE CONNECTION
func Close(db *sqlx.DB) {
	db.Close()
}

//GET CONNECTION HOST
func GetHost() string {
	return config.DB()
}
