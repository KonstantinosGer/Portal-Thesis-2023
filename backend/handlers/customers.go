package handlers

import (
	"context"
	"firebase.google.com/go/auth"
	"log"

	//gormadapter "github.com/casbin/gorm-adapter/v3"
	"github.com/gin-gonic/gin"
	"net/http"
)

func ChangeFirebasePassword(firebaseAuth *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		tempUser, existed := c.Get("user")
		if !existed {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "No subject found"})
			return
		}
		//Cast to auth.UserRecord
		user := tempUser.(*auth.UserRecord)
		//Get user's email
		email := user.Email

		link, err := firebaseAuth.PasswordResetLink(context.Background(), email)
		if err != nil {
			log.Printf("error generating email link: %v\n", err)
			c.AbortWithStatus(http.StatusInternalServerError)
		}

		c.JSON(http.StatusOK, link)

	}
}
