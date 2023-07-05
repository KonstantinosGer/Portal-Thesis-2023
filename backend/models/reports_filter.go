package models

type ReportsFilter struct {
	// For Filtering
	StartDate string `form:"startDate" gorm:"-"`
	EndDate   string `form:"endDate" gorm:"-"`
	Keyword   string `form:"keyword" gorm:"-"`
	// For Sorting
	SortDate         string `form:"sort_date" gorm:"-"`
	SortCreationDate string `form:"sort_creation_date" gorm:"-"`
}
