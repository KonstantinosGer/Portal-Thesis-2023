package config

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// Google Drive API helper functions
const (
	// See, edit, create, and delete all of your Google Drive files
	DriveScope = "https://www.googleapis.com/auth/drive"

	// See, edit, create, and delete only the specific Google Drive files
	// you use with this app
	DriveFileScope = "https://www.googleapis.com/auth/drive.file"

	// See and download all your Google Drive files
	DriveReadonlyScope = "https://www.googleapis.com/auth/drive.readonly"
)

// Use this as a singleton object for the Google Sheets service
var driveService *drive.Service

// Retrieve a token, saves the token, then returns the generated client.
func getDriveClient(config *oauth2.Config) *http.Client {
	// The file token.json stores the user's access and refresh tokens, and is
	// created automatically when the authorization flow completes for the first
	// time.
	tokFile := "secrets/drive_token.json"
	tok, err := tokenDriveFromFile(tokFile)
	if err != nil {
		tok = getDriveTokenFromWeb(config)
		saveDriveToken(tokFile, tok)
	}
	return config.Client(context.Background(), tok)
}

// Request a token from the web, then returns the retrieved token.
func getDriveTokenFromWeb(config *oauth2.Config) *oauth2.Token {
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	fmt.Printf("Go to the following link in your browser then type the "+
		"authorization code: \n%v\n", authURL)

	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("Unable to read authorization code %v", err)
	}

	tok, err := config.Exchange(context.TODO(), authCode)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web %v", err)
	}
	return tok
}

// Retrieves a token from a local file.
func tokenDriveFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

// Saves a token to a file path.
func saveDriveToken(path string, token *oauth2.Token) {
	fmt.Printf("Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

func GDrive() (*drive.Service, error) {
	if driveService != nil {
		return driveService, nil
	}

	ctx := context.Background()
	b, err := ioutil.ReadFile("secrets/client_secret.json")
	if err != nil {
		log.Fatalf("Unable to read client secret file: %v", err)
	}

	// If modifying these scopes, delete your previously saved token.json.
	config, err := google.ConfigFromJSON(b, DriveScope, DriveFileScope, DriveReadonlyScope, drive.DriveMetadataScope, drive.DriveMetadataReadonlyScope)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}
	client := getDriveClient(config)

	newService, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err == nil {
		driveService = newService
	}
	return newService, err

}
