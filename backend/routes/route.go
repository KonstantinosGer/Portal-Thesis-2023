package routes

import (
	"backend/config"
	"backend/handlers"
	"backend/middleware"
	"fmt"
	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"
	"net/http"
)

// SetupRoutes : all the routes are defined here
func SetupRoutes(db *gorm.DB) {
	httpRouter := gin.Default()

	//CORS
	cors_conf := cors.DefaultConfig()
	cors_conf.AllowAllOrigins = true
	cors_conf.AllowCredentials = true
	cors_conf.AddAllowHeaders("authorization")
	cors_conf.AddAllowHeaders("Access-Control-Allow-Credentials")
	cors_conf.AddAllowHeaders("Access-Control-Allow-Origin")
	cors_conf.AddAllowHeaders("accept")
	httpRouter.Use(cors.New(cors_conf))
	httpRouter.MaxMultipartMemory = 1024 << 20

	//------
	//Casbin
	//------

	// Initialize casbin adapter
	//Connect remotely to RBAC schema (db = casbin_rule)
	rbacDB, err := config.RBAC_DBConn()
	if err != nil {
		log.Println(err)
		panic(fmt.Sprintf("failed to initialize RBAC connection: %v", err))
	}
	adapter, err := gormadapter.NewAdapterByDB(rbacDB)
	if err != nil {
		log.Println(err)
		panic(fmt.Sprintf("failed to initialize casbin adapter: %v", err))
	}

	// Load models configuration file and policy store adapter
	enforcer, err := casbin.NewSyncedEnforcer("config/rbac_model.conf", adapter)

	if err != nil {
		log.Println(err)
		panic(fmt.Sprintf("failed to create casbin enforcer: %v", err))
	}

	//--------
	//Firebase
	//--------
	// configure firebase
	firebaseAuth := config.SetupFirebase()

	// set db & firebase auth to gin context with a middleware to all incoming request
	httpRouter.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Set("firebaseAuth", firebaseAuth)
	})

	apiRoutes := httpRouter.Group("/api", middleware.AuthMiddleware)

	//------------
	//FILES ROUTES
	//------------
	fileProtectedRoutes := apiRoutes.Group("/files")
	{
		fileProtectedRoutes.GET("/getall", middleware.Authorize("portal::data::manager", "read", enforcer), handlers.GetCustomerFiles(true, false, enforcer))
		fileProtectedRoutes.GET("/getfinancialapproved", middleware.Authorize("portal::data::customer", "read", enforcer), handlers.GetCustomerFiles(false, true, enforcer))
		fileProtectedRoutes.GET("/getperformanceapproved", middleware.Authorize("portal::data::customer", "read", enforcer), handlers.GetCustomerFiles(false, false, enforcer))
		fileProtectedRoutes.POST("/updatefilescache", middleware.Authorize("portal::data::manager", "read", enforcer), handlers.UpdateFilesCacheTable())
		fileProtectedRoutes.POST("/updateapprovedstate/:id", middleware.Authorize("portal::data::manager", "read", enforcer), handlers.UpdateApprovedState())
		fileProtectedRoutes.POST("/updatefile/:id", middleware.Authorize("portal::data::manager", "write", enforcer), handlers.UpdateFile())
		fileProtectedRoutes.POST("/sendemail/:id", middleware.Authorize("portal::data::manager", "write", enforcer), handlers.SendEmail())
	}

	//------------
	//CUSTOMERS ROUTES
	//------------
	customerProtectedRoutes := apiRoutes.Group("/customers")
	{
		customerProtectedRoutes.POST("/changepassword", middleware.Authorize("portal::data::customer", "read", enforcer), handlers.ChangeFirebasePassword(firebaseAuth))
	}

	// handler for getting the number of registered handlers
	httpRouter.GET("/handlers", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"httpRouter": len(httpRouter.RouterGroup.Handlers),
			"apiRouter":  len(apiRoutes.Handlers),
		})
	})

	// For production
	// SERVE FRONTEND
	if config.ENV("APP_ENV") == "prod" {
		httpRouter.LoadHTMLGlob("../frontend/build/index.html")
		httpRouter.Use(static.Serve("/", static.LocalFile("../frontend/build", true)))
		httpRouter.NoRoute(func(c *gin.Context) {
			//r.LoadHTMLGlob("../frontend/build/index.html")
			c.HTML(http.StatusOK, "index.html", nil)
		})
	}

	//Which port should the app use? (in env.)
	port := config.ENV("APIPORT")
	fmt.Println("Gin Started on port: " + port)
	httpRouter.Run(":" + port)
	log.Println("Gin Stopped")

}
