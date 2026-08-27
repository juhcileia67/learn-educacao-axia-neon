CREATE TABLE `interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroomId` int NOT NULL,
	`teacherId` int NOT NULL,
	`targetType` enum('turma','aluno') NOT NULL,
	`targetStudentId` int,
	`objective` text NOT NULL,
	`status` enum('rascunho','aprovada','encaminhada') NOT NULL DEFAULT 'rascunho',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `interventions_class_idx` ON `interventions` (`classroomId`);