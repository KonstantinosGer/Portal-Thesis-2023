package migrate

func MigrateDBGorm() {

	//db, err := database.ConnectGormDBClickhouse()
	//if err != nil {
	//	log.Println(err)
	//}
	//defer database.CloseDBConnectionGorm(db)
	//
	//err = db.Migrator().AutoMigrate(
	//	//
	//	// Internal Dashboard
	//	//
	//	// Column Charts
	//	&models.PaymentsAggregatedByProduct{},
	//	&models.PaymentsAggregatedByLabel{},
	//	&models.PaymentsAggregatedByChannel{},
	//	&models.PaymentsAggregatedByOwnerCustomerRevenue{},
	//	&models.PaymentsAggregatedByOwnerDmRevenue{},
	//	// Pie Graphs
	//	&models.PaymentsAggregatedPieGraphYoutubeChannelsByChannelNameAndCountry{},
	//	&models.PaymentsAggregatedPieGraphYoutubeChannelsByVideoTitle{},
	//	&models.PaymentsAggregatedPieGraphYoutubeLabelsByArtistAndCountry{},
	//	&models.PaymentsAggregatedPieGraphYoutubeLabelsByTrack{},
	//	&models.PaymentsAggregatedPieGraphMusicPlatforms{},
	//)
	//if err != nil {
	//	log.Println(err)
	//}
}
