package models

type FileApprovalFilter struct {
	// For Filtering
	Customer         []string `form:"customer[]" gorm:"-"`
	CustomerId       []string `form:"customer_id[]" gorm:"-"`
	Type             []string `form:"type[]" gorm:"-"`
	EnableDateFilter bool     `form:"enableDateFilter" gorm:"-"`
	StartDate        string   `form:"startDate" gorm:"-"`
	EndDate          string   `form:"endDate" gorm:"-"`
	Approved         []bool   `form:"approved[]" gorm:"-"`
	Keyword          string   `form:"keyword" gorm:"-"`
	// For Sorting
	SortDate         string `form:"sort_date" gorm:"-"`
	SortCreationDate string `form:"sort_creation_date" gorm:"-"`
}
