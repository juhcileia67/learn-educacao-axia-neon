ALTER TABLE `recognitions` ADD `sourceType` enum('atividade','intervencao');--> statement-breakpoint
ALTER TABLE `recognitions` ADD `activityId` int;--> statement-breakpoint
ALTER TABLE `recognitions` ADD `interventionId` int;