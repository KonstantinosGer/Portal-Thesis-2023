package handlers

import (
	"backend/config"
	"backend/database"
	"backend/models"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/casbin/casbin/v2"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/gmail/v1"
)

func UpdateFilesCacheTable() gin.HandlerFunc {
	return func(c *gin.Context) {

		log.Println("Started sync with drive")

		var files []models.CustomerFile

		//
		//Google Drive
		//
		service, err := config.GDrive()
		if err != nil {
			log.Println(err)
		}

		query := fmt.Sprintf("'%s' in parents and trashed = false", CRM_VAULT_ROOT_ID)

		var allCustomersFolders []*drive.File
		pageToken := ""
		for {
			q := service.Files.List().Q(query).Fields("*") // If we have a pageToken set, apply it to the query
			if pageToken != "" {
				q = q.PageToken(pageToken)
			}

			res, err := q.Do()
			if err != nil {
				log.Println(err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				return
			}

			allCustomersFolders = append(allCustomersFolders, res.Files...)
			pageToken = res.NextPageToken
			if pageToken == "" {
				break
			}
		}

		var customerFolderIdList []string

		for _, folder := range allCustomersFolders {
			customerFolderIdList = append(customerFolderIdList, folder.Id)
		}

		//Fetch all files from folders of managed customers
		var fileList []*drive.File

		for _, customerFolderId := range customerFolderIdList {
			query = fmt.Sprintf("'%s' in parents and trashed = false", customerFolderId)

			//fetch in pages
			pageToken = ""
			for {
				q := service.Files.List().Q(query).Fields("*") // If we have a pageToken set, apply it to the query
				if pageToken != "" {
					q = q.PageToken(pageToken)
				}

				res, err := q.Do()
				if err != nil {
					log.Println(err)
					c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
					return
				}

				fileList = append(fileList, res.Files...)
				pageToken = res.NextPageToken
				if pageToken == "" {
					break
				}
			}

		}

		for i, file := range fileList {
			//Check if file is approved (by converting string to boolean)
			isApproved, _ := strconv.ParseBool(file.Properties["approved"])

			// initialize the correct permissions
			// 1. if there is no permission for DM domain members, add it (in every case)
			existsDMPerm := false
			for _, permission := range file.Permissions {
				if permission.Type == "domain" && permission.Domain == "digitalmindsnet.com" {
					existsDMPerm = true
					break
				}
			}
			existsAnyonePerm := false
			for _, permission := range file.Permissions {
				if permission.Type == "anyone" {
					existsAnyonePerm = true
					break
				}
			}

			if !existsDMPerm {
				_, err = service.Permissions.Create(file.Id, &drive.Permission{
					Type:               "domain",
					Domain:             "digitalminds.com",
					Role:               "writer",
					AllowFileDiscovery: false,
				}).SendNotificationEmail(false).Do()
				if err != nil {
					log.Println(err, file.Id, i)
					//c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
					return
				}
			}

			//Change Time format
			creationTime, _ := time.Parse("2006-01-02T15:04:05.000Z", file.CreatedTime)
			creationDate := creationTime.Format("02/01/2006")
			//creationDate := creationTime.Format("2006-01-02")

			//Check if file's property "type" is empty or does not exist
			file_type := file.Properties["type"]
			finalFileType := file_type
			if file_type == "" {
				finalFileType = "unknown"
				if
				//file.MimeType == GOOGLE_SPREADSHEET_MIME_TYPE ||
				file.MimeType == XLS_FILE_MIME_TYPE || file.MimeType == XLSX_FILE_MIME_TYPE {
					finalFileType = "finance"
				} else if file.MimeType == GOOGLE_SLIDE_MIME_TYPE || file.MimeType == PPT_FILE_MIME_TYPE || file.MimeType == PPTX_FILE_MIME_TYPE {
					finalFileType = "performance"
				}
				_, err = service.Files.Update(file.Id, &drive.File{
					Properties: map[string]string{
						"type": finalFileType,
					},
				}).Do()
				if err != nil {
					log.Println(err, file.Id)
					//c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
					return
				}
			}

			// Pre approve all financials
			finalIsApproved := isApproved
			if finalFileType == "finance" {
				//if creationTime.Year() == 2022 && creationTime.Month() == time.October && (creationTime.Day() == 27 || creationTime.Day() == 26) {
				//	_, err = service.Files.Update(file.Id, &drive.File{
				//		Properties: map[string]string{
				//			"approved": "false",
				//		},
				//	}).Do()
				//	if err != nil {
				//		log.Println(err, file.Id)
				//		//c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				//		return
				//	}
				//	finalIsApproved = false
				//} else if !isApproved {
				//	_, err = service.Files.Update(file.Id, &drive.File{
				//		Properties: map[string]string{
				//			"approved": "true",
				//		},
				//	}).Do()
				//	if err != nil {
				//		log.Println(err, file.Id)
				//		//c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				//		return
				//	}
				//	finalIsApproved = true
				//}

				if !isApproved {
					_, err = service.Files.Update(file.Id, &drive.File{
						Properties: map[string]string{
							"approved": "true",
						},
					}).Do()
					if err != nil {
						log.Println(err, file.Id)
						//c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
						return
					}
					finalIsApproved = true
				}
			}

			if finalIsApproved && !existsAnyonePerm {
				_, err := service.Permissions.Create(file.Id, &drive.Permission{
					Type:               "anyone",
					Role:               "reader",
					AllowFileDiscovery: false,
					//}).Do()
				}).SendNotificationEmail(false).Do()
				if err != nil {
					log.Println(err)
					//c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
					//return
				}
			} else if !finalIsApproved && existsAnyonePerm {
				for _, permission := range file.Permissions {
					if permission.Type == "anyone" {
						err := service.Permissions.Delete(file.Id, permission.Id).Do()
						if err != nil {
							log.Println(err)
							return
						}
					}
				}
			}

			//Check if file's property "month" is empty or does not exist
			file_month := file.Properties["month"]
			if file_month == "" {
				file_month = "unknown"
			}
			//Check if file's property "year" is empty or does not exist
			file_year := file.Properties["year"]
			if file_year == "" {
				file_year = "unknown"
			}

			if file.Properties["start_date"] != "" && file.Properties["range"] != "" {
				startDate, err := time.Parse("2006-01-02", file.Properties["start_date"])
				if err != nil {
					log.Println(err)
					return
				} else {
					file_month = startDate.Format("01")
					file_year = startDate.Format("2006")
				}
				//endDate, err := time.Parse("2006-01-02", file.Properties["end_date"])
				//if err != nil {
				//	log.Println(err)
				//	return
				//}
			}

			//Check if file's property "customer" is empty or does not exist
			file_customer := file.Properties["customer"]
			if file_customer == "" {
				file_customer = "unknown"
			}

			customer_podio_id := ""
			for _, folder := range allCustomersFolders {
				if folder.Id == file.Parents[0] {
					customer_podio_id = folder.Name
					break
				}
			}

			channel_id := file.Properties["channelId"]

			//
			//Fill channel_id column with a channel's id,  based on channel's title in channel's file name
			//
			//if channel_id == "" {
			//
			//	//
			//	// Get file's channelTitle, based on its channel_id
			//	//
			//	// fill channel title, thumbnail
			//	service, err := config.YTData()
			//	if err != nil {
			//		c.AbortWithStatusJSON(http.StatusInternalServerError,
			//			gin.H{
			//				"status":  500,
			//				"message": err.Error(),
			//			})
			//		return
			//	}
			//
			//	response, err := service.Channels.List([]string{"snippet"}).Id(channelId).Fields("items/snippet/title,items/snippet/thumbnails").Do()
			//	if err != nil {
			//		c.AbortWithStatusJSON(http.StatusInternalServerError,
			//			gin.H{
			//				"status":  500,
			//				"message": fmt.Sprintf("no YoutTube channel found with channel id %s", channelId),
			//			})
			//		return
			//	}
			//	channelTitle := response.Items[0].Snippet.Title
			//	channelTitleMerged := regexp.MustCompile(`[^a-zA-Z0-9 ]+`).ReplaceAllString(channelTitle, "")
			//
			//
			//
			//	if strings.Contains(file.Name, channelTitle) || strings.Contains(file.Name, channelTitleMerged) {
			//		channel_id = file.Properties["channelId"]
			//	}
			//}

			files = append(files, models.CustomerFile{
				Id:           file.Id,
				Name:         file.Name,
				Type:         finalFileType,
				CreationDate: creationDate,
				CustomerId:   customer_podio_id,
				Url:          file.WebViewLink,
				MimeType:     file.MimeType,
				Month:        file_month,
				Year:         file_year,
				Customer:     file_customer,

				Approved:  finalIsApproved,
				ChannelId: channel_id,
			})
		}
		//log.Println(files)

		databaseP, err := database.ConnectMariaDB()
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}
		defer databaseP.Close()

		_, err = databaseP.Exec("TRUNCATE TABLE customer_portal_files_cache;")
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}

		//language=MariaDB
		//insertQueryStr:="INSERT INTO customer_portal_files_cache (id, name, is_approved, creation_date, file_type, month, year, customer_name, customer_id, mime_type, url) VALUES (:id, :name, :is_approved, :creation_date, :file_type, :month, :year, :customer_name, :customer_id, :mime_type, :url)"
		//_, err = databaseP.NamedExec(insertQueryStr, files)
		//if err != nil {
		//	log.Println(err)
		//	c.AbortWithStatusJSON(http.StatusInternalServerError,
		//		gin.H{"status": 500, "message": err.Error()})
		//	return
		//}

		//for _, file := range files {
		//	//language=MariaDB
		//	_, err = databaseP.Exec("INSERT INTO customer_portal_files_cache (id, name, is_approved, creation_date, file_type, month, year,\n                                         customer_name, customer_id, mime_type, url)\nVALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
		//		file.Id,
		//		file.Name,
		//		file.Approved,
		//		file.CreationDate,
		//		file.Type,
		//		file.Month,
		//		file.Year,
		//		file.Customer,
		//		file.CustomerId,
		//		file.MimeType,
		//		file.Url,
		//	)
		//	if err != nil {
		//		log.Println(err)
		//	}
		//}

		batchSize := 2000

		for i := 0; i < len(files); i += batchSize {
			j := i + batchSize
			if j > len(files) {
				j = len(files)
			}
			//fmt.Println(files[i:j]) // Process the batch.
			batch := files[i:j]

			//language=MariaDB
			insertQueryStr := "INSERT INTO customer_portal_files_cache (id, name, is_approved, creation_date, file_type, month, year, customer_name, customer_id, mime_type, url, channel_id) VALUES (:id, :name, :is_approved, :creation_date, :file_type, :month, :year, :customer_name, :customer_id, :mime_type, :url, :channel_id)"
			_, err = databaseP.NamedExec(insertQueryStr, batch)
			if err != nil {
				log.Println(err)
				c.AbortWithStatusJSON(http.StatusInternalServerError,
					gin.H{"status": 500, "message": err.Error()})
				return
			}
		}

		log.Println("End sync with drive!")
	}
}

func GetCustomerFiles(isCompanyMember bool, getFinancial bool, enforcer *casbin.SyncedEnforcer) gin.HandlerFunc {
	return func(c *gin.Context) {

		//
		//Firebase
		//
		// Get current user/subject
		firebaseUID, existed := c.Get("UID")
		if !existed {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "No subject found"})
			return
		}

		//Connect remotely to RBAC schema (db = casbin_rule)
		rbacDB, err := database.RBACConnect()
		if err != nil {
			log.Println(err)
			panic(fmt.Sprintf("failed to initialize RBAC connection: %v", err))
		}
		defer rbacDB.Close()

		var files []models.CustomerFileFrontend
		// Initialize object as 0
		files = make([]models.CustomerFileFrontend, 0)

		//
		//For customer use only
		//
		if !isCompanyMember {

			//
			//Check for finance and performance permission
			//
			//Get customer's id associated with his user id in firebase
			var customerIds []int
			err = rbacDB.Select(&customerIds, "SELECT customer_id FROM customer_user WHERE customer_user.user_id = ?;", firebaseUID) /**/
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				return
			}

			//Get filters from frontend
			var filters models.ReportsFilter

			if err := c.Bind(&filters); err != nil {
				c.AbortWithError(http.StatusInternalServerError, err)
				log.Println(err)
				return
			}

			if getFinancial {
				//
				// GET ONLY FINANCIAL REPORTS
				//
				databasePayments, err := database.ConnectToMariaDBGorm()
				if err != nil {
					c.AbortWithError(http.StatusInternalServerError, err)
					log.Println(err)
					return
				}
				defer database.CloseDBConnectionGorm(databasePayments)

				for _, customerId := range customerIds {

					// Casbin enforces policy
					//Finance
					hasPermissionFinance, err := enforcer.Enforce(fmt.Sprint(firebaseUID), fmt.Sprintf("portal::data::%d::finance", customerId), "read")

					if err != nil {
						//c.AbortWithStatusJSON(500, gin.H{"message": "Error occurred when authorizing user"})
						log.Println("Error occurred when authorizing user", err)
					}

					if hasPermissionFinance {
						//Fetch approved files only
						var fileListFinance []models.CustomerFileFrontend

						// GORM QUERY
						//databasePayments.Table("customer_portal_files_cache").
						//	Where("customer_id = ? AND is_approved = 1 AND file_type = 'finance' AND month != 'unknown' AND year != 'unknown' AND name LIKE ?", customerId, "%"+keyword+"%").
						//	Find(&fileListFinance)

						// GORM QUERY
						query := databasePayments.Debug().
							Table("customer_portal_files_cache").
							Select("id, name, file_type, creation_date, url, mime_type, CONCAT(year, '-', month) AS date, customer_name, is_approved, customer_id, channel_id").
							//Where("customer_id = ? AND is_approved = 1 AND file_type = 'finance' AND month != 'unknown' AND year != 'unknown' AND name LIKE ?", customerId, "%"+keyword+"%")
							// month != 'unknown' AND year != 'unknown' -> is not necessary when you filter by date
							Where("customer_id = ? AND is_approved = 1 AND file_type = 'finance' AND name LIKE ?", customerId, "%"+filters.Keyword+"%")

						// Filter date
						query = query.Where(fmt.Sprintf("CONCAT(year, '-', month, '-01') BETWEEN '%s' AND '%s'", filters.StartDate, filters.EndDate))

						if filters.SortCreationDate != "" {
							order := ""
							if strings.Contains(filters.SortCreationDate, "desc") {
								order = "DESC"
							}
							query = query.Order(fmt.Sprintf("STR_TO_DATE(creation_date, '%%d/%%m/%%Y') %v", order))
						} else if filters.SortDate != "" {
							order := ""
							if strings.Contains(filters.SortDate, "desc") {
								order = "DESC"
							}
							query = query.Order(fmt.Sprintf("date %v", order))
						}

						query = query.Find(&fileListFinance)

						//... append each element in the array (for example 500 elements = 500 append calls)
						files = append(files, fileListFinance...)
					}
				}

			} else {
				//
				// GET ONLY PERFORMANCE REPORTS
				//
				databasePayments, err := database.ConnectToMariaDBGorm()
				if err != nil {
					c.AbortWithError(http.StatusInternalServerError, err)
					log.Println(err)
					return
				}
				defer database.CloseDBConnectionGorm(databasePayments)

				for _, customerId := range customerIds {

					// Casbin enforces policy
					//Finance
					hasPermissionPerformance, err := enforcer.Enforce(fmt.Sprint(firebaseUID), fmt.Sprintf("portal::data::%d::performance", customerId), "read")

					if err != nil {
						//c.AbortWithStatusJSON(500, gin.H{"message": "Error occurred when authorizing user"})
						log.Println("Error occurred when authorizing user", err)
					}

					if hasPermissionPerformance {
						//Fetch approved files only
						var fileListPerformance []models.CustomerFileFrontend

						// GORM QUERY
						query := databasePayments.Debug().
							Table("customer_portal_files_cache").
							Select("id, name, file_type, creation_date, url, mime_type, CONCAT(year, '-', month) AS date, customer_name, is_approved, customer_id, channel_id").
							//Where("customer_id = ? AND is_approved = 1 AND file_type = 'performance' AND month != 'unknown' AND year != 'unknown' AND name LIKE ?", customerId, "%"+keyword+"%")
							// month != 'unknown' AND year != 'unknown' -> is not necessary when you filter by date
							Where("customer_id = ? AND is_approved = 1 AND file_type = 'performance' AND name LIKE ?", customerId, "%"+filters.Keyword+"%")

						// Filter date
						query = query.Where(fmt.Sprintf("CONCAT(year, '-', month, '-01') BETWEEN '%s' AND '%s'", filters.StartDate, filters.EndDate))

						if filters.SortCreationDate != "" {
							order := ""
							if strings.Contains(filters.SortCreationDate, "desc") {
								order = "DESC"
							}
							query = query.Order(fmt.Sprintf("STR_TO_DATE(creation_date, '%%d/%%m/%%Y') %v", order))
						} else if filters.SortDate != "" {
							order := ""
							if strings.Contains(filters.SortDate, "desc") {
								order = "DESC"
							}
							query = query.Order(fmt.Sprintf("date %v", order))
						}

						query = query.Find(&fileListPerformance)

						//... append each element in the array (for example 500 elements = 500 append calls)
						files = append(files, fileListPerformance...)
					}
				}

			}

		} else {
			//
			//Get acc manager's name
			//
			//user := c.MustGet("user").(*auth.UserRecord)
			//userName := user.DisplayName
			////userName := "Kostas Chamalidis"
			////userName := "Christos Lamprou"
			//
			////
			////Get acc manager's token
			////
			//token := c.MustGet("idToken").(string)
			//
			////
			////Post Request from Payments2020 - Get acc manager's customers
			////
			////Initialize form
			//form := url.Values{}
			//form.Add("employee", userName)
			////Request
			//bearer := "Bearer " + token
			//req, err := http.NewRequest("POST", fmt.Sprintf("http://164.68.109.200:3030/api/employees/getEmployeeCustomers"), strings.NewReader(form.Encode())) //bytes.NewBuffer([]byte(fmt.Sprintf(`{"employee":"%s"}`, userName)))
			//if err != nil {
			//	log.Println(err)
			//	c.AbortWithStatus(http.StatusInternalServerError)
			//}
			//
			//req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
			//req.Header.Add("Authorization", bearer)
			//
			//// Send req using http Client
			//client := &http.Client{}
			//resp, err := client.Do(req)
			//if err != nil {
			//	log.Println("Error on response.\n[ERROR] -", err)
			//}
			//body, err := ioutil.ReadAll(resp.Body) // response body is []byte
			////defer resp.Body.Close()
			//resp.Body.Close()
			//
			//var managedCustomersPodioIds []int
			//if err := json.Unmarshal(body, &managedCustomersPodioIds); err != nil { // Parse []byte to the go struct pointer
			//	fmt.Println("Can not unmarshal JSON")
			//}

			//Get filters from frontend
			var filters models.FileApprovalFilter

			if err := c.Bind(&filters); err != nil {
				c.AbortWithError(http.StatusInternalServerError, err)
				log.Println(err)
				return
			}

			//Get files from payments db, using gorm
			databasePayments, err := database.ConnectToMariaDBGorm()
			if err != nil {
				c.AbortWithError(http.StatusInternalServerError, err)
				log.Println(err)
				return
			}
			defer database.CloseDBConnectionGorm(databasePayments)

			// GORM QUERY
			query := databasePayments.Debug().
				Table("customer_portal_files_cache").
				Select("id, name, file_type, creation_date, url, mime_type, CONCAT(year, '-', month) AS date, customer_name, is_approved, customer_id, channel_id")
			//if len(filters.CustomerId) == 0 {
			//	query = query.Where("customer_id IN ?", managedCustomersPodioIds)
			//} else {
			//	query = query.Where("customer_id IN ?", filters.CustomerId)
			//}
			if len(filters.CustomerId) != 0 {
				query = query.Where("customer_id IN ?", filters.CustomerId)
			}
			if len(filters.Customer) != 0 {
				query = query.Where("customer_name IN ?", filters.Customer)
			}
			if len(filters.Type) != 0 {
				query = query.Where("file_type IN ?", filters.Type)
			}
			if len(filters.Approved) != 0 {
				query = query.Where("is_approved IN ?", filters.Approved)
			}
			if filters.Keyword != "" {
				query = query.Where("name LIKE ? OR customer_name LIKE ? OR customer_id LIKE ?", "%"+filters.Keyword+"%", "%"+filters.Keyword+"%", "%"+filters.Keyword+"%")
			}

			if filters.EnableDateFilter {
				// Date filter (startDate, endDate)
				query = query.Where(fmt.Sprintf("CONCAT(year, '-', month, '-01') BETWEEN '%s' AND '%s'", filters.StartDate, filters.EndDate))
			}

			if filters.SortCreationDate != "" {
				order := ""
				if strings.Contains(filters.SortCreationDate, "desc") {
					order = "DESC"
				}
				query = query.Order(fmt.Sprintf("STR_TO_DATE(creation_date, '%%d/%%m/%%Y') %v", order))
			} else if filters.SortDate != "" {
				order := ""
				if strings.Contains(filters.SortDate, "desc") {
					order = "DESC"
				}
				query = query.Order(fmt.Sprintf("date %v", order))
			}

			query = query.Find(&files)

		}

		c.JSON(http.StatusOK, files)
	}
}

func UpdateApprovedState() gin.HandlerFunc {
	return func(c *gin.Context) {
		//From url
		file_id := c.Param("id")
		//From postman's Body/form-data
		approvedChanged := c.PostForm("approvedChanged")

		//
		//Google Drive
		//
		service, err := config.GDrive()
		if err != nil {
			log.Println(err)
		}

		//Update "approved" field on file's properties
		_, err = service.Files.Update(file_id, &drive.File{
			Properties: map[string]string{
				"approved": approvedChanged,
			},
		}).Do()
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}

		// ALSO update in cache table
		databaseP, err := database.ConnectMariaDB()
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}
		defer databaseP.Close()

		binBool := ""
		if approvedChanged == "true" {
			binBool = "1"
		} else {
			binBool = "0"
		}
		_, err = databaseP.Exec("UPDATE customer_portal_files_cache SET is_approved = ? WHERE id = ?", binBool, file_id)
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}
		// updated

		//permissionId consists of customer's firebase id + "::read::" + file's google drive id
		//var permissionId = customerFirebaseId + "::read::" + file_id
		if approvedChanged == "true" { //&& (customerEmail == "kgerasovits@yahoo.gr" || customerEmail == "kgerasovits@gmail.com")
			//Create permission for currently approved file and the customer alluded
			_, err := service.Permissions.Create(file_id, &drive.Permission{
				Type:               "anyone",
				Role:               "reader",
				AllowFileDiscovery: false,
				//}).Do()
			}).SendNotificationEmail(false).Do()
			if err != nil {
				log.Println(err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				return
			}

		} else {
			//Fetch all permissions for currently disapproved file
			permissionsList, err := service.Permissions.List(file_id).Do()
			if err != nil {
				log.Println(err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				return
			}

			for _, permission := range permissionsList.Permissions {
				if permission.Type == "anyone" {
					//Delete all permissions for currently disapproved file with Type = "anyone"
					err := service.Permissions.Delete(file_id, permission.Id).Do()
					if err != nil {
						log.Println(err)
						c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
						return
					}
				}
			}

		}

		c.JSON(http.StatusOK, nil)
	}
}

func UpdateFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		//From url
		fileId := c.Param("id")
		//From postman's Body/form-data
		newCustomerName := c.PostForm("customer")
		newType := c.PostForm("type")
		newMonth := c.PostForm("month")
		newYear := c.PostForm("year")

		log.Println("fileId : " + fileId)
		log.Println("newCustomerName : " + newCustomerName)
		log.Println("newType : " + newType)
		log.Println("newMonth : " + newMonth)
		log.Println("newYear : " + newYear)

		//
		//Google Drive
		//
		service, err := config.GDrive()
		if err != nil {
			log.Println(err)
		}

		_, err = service.Files.Update(fileId, &drive.File{
			Properties: map[string]string{
				"type":     newType,
				"month":    newMonth,
				"year":     newYear,
				"customer": newCustomerName,
			},
		}).Do()

		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}

		// ALSO update in cache table
		databaseP, err := database.ConnectMariaDB()
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}
		defer databaseP.Close()

		_, err = databaseP.Exec("UPDATE customer_portal_files_cache SET file_type = ?, month = ?, year = ?, customer_name = ? WHERE id = ?", newType, newMonth, newYear, newCustomerName, fileId)
		if err != nil {
			log.Println(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"status": 500, "message": err.Error()})
			return
		}
		// updated

	}
}

func SendEmail() gin.HandlerFunc {
	return func(c *gin.Context) {
		//From url
		file_id := c.Param("id")

		//
		//Google Drive
		//
		service, err := config.GDrive()
		if err != nil {
			log.Println(err)
		}

		//
		//Gmail
		//
		serviceGmail, err := config.Gmail()
		if err != nil {
			log.Println(err)
		}
		log.Println(serviceGmail)

		//
		//Casbin
		//
		//Connect remotely to RBAC schema (db = casbin_rule)
		rbacDB, err := database.RBACConnect()
		if err != nil {
			log.Println(err)
			panic(fmt.Sprintf("failed to initialize RBAC connection: %v", err))
		}
		defer rbacDB.Close()

		//
		//Get customer's folder id (parent folder id), based on customer's file id (file that just got approved)
		//
		currentFilePropertiesList, err := service.Files.Get(file_id).Fields("*").Do()
		if err != nil {
			log.Println(err)
		}
		var parentFolderId = currentFilePropertiesList.Parents[0]
		fmt.Println(parentFolderId)

		//
		//Get customer's folder name (parent folder name), based on customer's folder id (parent folder id)
		//
		parentFolderPropertiesList, err := service.Files.Get(parentFolderId).Fields("*").Do()
		if err != nil {
			log.Println(err)
		}
		//Customer's podio_id is equal to parent folder "Name" attribute
		//Convert from string to int with "strconv.Atoi(s string), which returns (int, error)"
		var customerId, _ = strconv.Atoi(parentFolderPropertiesList.Name)
		fmt.Println(customerId)

		//
		//Get customer's email from rbac db, using the association between his podio_id (customer id), his user_id (firebase id), and his email (firebase email).
		//
		//Get customer's firebase id from rbac db, based on his podio_id (customer id)
		var customerFirebaseId string
		err = rbacDB.QueryRowx("SELECT user_id FROM customer_user WHERE customer_user.customer_id = ?;", customerId).Scan(&customerFirebaseId)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		fmt.Println(customerFirebaseId)
		//Get customer's email from rbac db, based on his firebase id
		var customerEmail string
		err = rbacDB.QueryRowx("SELECT email FROM users WHERE users.id = ?;", customerFirebaseId).Scan(&customerEmail)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		fmt.Println(customerEmail)

		var selectedFileName = currentFilePropertiesList.Name

		// Compose the message
		messageStr := []byte(
			"From: me\r\n" +
				"To: " + customerEmail + "\r\n" +
				"Subject: Digital Minds - New Report\r\n\r\n" +
				"A new report was uploaded to your vault!\n" +
				"Title: " + selectedFileName + "\n\n" +
				"Visit Digital Minds Portal to securely view it.\n" +
				"https://portal.digitalminds-dashboard.com\n\n" +
				"This email is an automated notification, please do not reply to this message.")

		//Send email
		_, err = serviceGmail.Users.Messages.Send("me", &gmail.Message{
			Raw: base64.URLEncoding.EncodeToString(messageStr),
		}).Do()
		if err != nil {
			log.Printf("Error: %v", err)
		} else {
			fmt.Println("Message sent!")
		}

		c.JSON(http.StatusOK, nil)
	}
}
