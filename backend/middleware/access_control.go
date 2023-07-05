package middleware

import (
	"fmt"
	"github.com/casbin/casbin/v2"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

// Authorize determines if current user has been authorized to take an action on an object.
func Authorize(obj string, act string, enforcer *casbin.SyncedEnforcer) gin.HandlerFunc {
	return func(c *gin.Context) {

		// Get current user/subject
		firebaseUID, existed := c.Get("UID")

		if !existed {
			//Προσοχή! Πάντα θα επιστρέφουμε "message"! (σαν σύμβαση)
			//c.AbortWithStatusJSON(401, gin.H{"message": "User hasn't logged in yet"})
			log.Println("User hasn't logged in yet")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "User hasn't logged in yet"})
			return
		}

		// Load policy from Database
		err := enforcer.LoadPolicy()

		if err != nil {
			//c.AbortWithStatusJSON(500, gin.H{"message": "Failed to load policy from DB"})
			log.Println("Failed to load policy from DB", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Failed to load policy from DB"})
			return
		}

		// Casbin enforces policy
		ok, err := enforcer.Enforce(fmt.Sprint(firebaseUID), obj, act)

		if err != nil {
			//c.AbortWithStatusJSON(500, gin.H{"message": "Error occurred when authorizing user"})
			log.Println("Error occurred when authorizing user", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Error occurred when authorizing user"})
			return
		}

		if !ok {
			log.Println("You are not authorized")
			//
			//"You are not authorized" bug message when customer log in
			//
			//c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "You are not authorized"})
			return
		}

		// save role in state
		//rolesForUser, err := enforcer.GetRolesForUser(firebaseUID.(string))
		//if err != nil {
		//	log.Println(err)
		//	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": err})
		//	return
		//}
		//if len(rolesForUser) > 1 || len(rolesForUser) == 0 {
		//	log.Println("None or too many roles for user " + firebaseUID.(string))
		//	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "None or too many roles for user " + firebaseUID.(string)})
		//	return
		//}
		//c.Set("role", rolesForUser[0])

		c.Next()
	}
}
