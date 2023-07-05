package config

import (
	"context"
	"log"
	"path/filepath"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"google.golang.org/api/option"
)

func SetupFirebase() *auth.Client {

	serviceAccountKeyFilePath, err := filepath.Abs("../backend/credentials/firebase-service-account-key.json")
	if err != nil {
		log.Println(err)
		panic("Unable to load serviceAccountKeys.json file")
	}

	opt := option.WithCredentialsFile(serviceAccountKeyFilePath)

	//Firebase admin SDK initialization
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Println(err)
		panic("Firebase load error")
	}

	//Firebase Auth
	auth, err := app.Auth(context.Background())
	if err != nil {
		log.Println(err)
		panic("Firebase load error")
	}

	return auth
}
