package middleware

import (
	"context"
	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"strings"
)

// AuthMiddleware : to verify all authorized operations
func AuthMiddleware(c *gin.Context) {

	firebaseAuth := c.MustGet("firebaseAuth").(*auth.Client)

	authorizationToken := c.GetHeader("Authorization")
	idToken := strings.TrimSpace(strings.Replace(authorizationToken, "Bearer", "", 1))

	if idToken == "" {
		log.Println("Id token not available")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Id token not available"})
		c.Abort()
		return
	}

	//verify token
	token, err := firebaseAuth.VerifyIDToken(context.Background(), idToken)
	if err != nil {
		log.Println("invalid token")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token"})
		c.Abort()
		return
	}

	c.Set("idToken", idToken)
	c.Set("UID", token.UID)

	// set the whole user object in state
	user, err := firebaseAuth.GetUser(context.Background(), token.UID)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		c.Abort()
		return
	}
	c.Set("user", user)

	c.Next()
}
