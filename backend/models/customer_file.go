package models

type CustomerFile struct {
	Id           string `json:"id" db:"id"`
	Name         string `json:"name" db:"name"`
	Type         string `json:"type" db:"file_type" gorm:"column:file_type"` //finance, performance
	CreationDate string `json:"creation_date" db:"creation_date"`
	//LastModified string `json:"last_modified"`
	Url      string `json:"url" db:"url"`
	MimeType string `json:"mime_type" db:"mime_type"`
	Month    string `json:"month" db:"month"`
	Year     string `json:"year" db:"year"`
	Customer string `json:"customer" db:"customer_name" gorm:"column:customer_name"`

	Approved   bool   `json:"approved" db:"is_approved" gorm:"column:is_approved"`
	CustomerId string `json:"customer_id" db:"customer_id"`
	Manager    string `json:"manager" db:"manager"`
	ChannelId  string `json:"channel_id" db:"channel_id"`
}

func (CustomerFile) TableName() string {
	return "customer_portal_files_cache"
}
