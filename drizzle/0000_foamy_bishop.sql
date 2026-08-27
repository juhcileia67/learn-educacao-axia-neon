CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroomId` int NOT NULL,
	`createdById` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`subject` varchar(90) NOT NULL,
	`contentTopic` varchar(140),
	`instructions` text NOT NULL,
	`dueAt` timestamp,
	`points` int NOT NULL DEFAULT 100,
	`aiMode` enum('ESTUDO','ATIVIDADE','AVALIACAO') NOT NULL DEFAULT 'ESTUDO',
	`activityType` varchar(50) NOT NULL DEFAULT 'resposta_aberta',
	`status` enum('rascunho','agendada','publicada','encerrada') NOT NULL DEFAULT 'rascunho',
	`attachmentKey` varchar(500),
	`publishedAt` timestamp,
	`scheduledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`studentId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_assignments_unique` UNIQUE(`activityId`,`studentId`)
);
--> statement-breakpoint
CREATE TABLE `class_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroomId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('aluno','professor') NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_memberships_unique` UNIQUE(`classroomId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`grade` varchar(60) NOT NULL,
	`name` varchar(90) NOT NULL,
	`code` varchar(18) NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classrooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `classrooms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`code` varchar(24) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `institutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `institutions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `learning_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroomId` int NOT NULL,
	`studentId` int NOT NULL,
	`subject` varchar(90) NOT NULL,
	`contentTopic` varchar(140) NOT NULL,
	`category` varchar(90) NOT NULL,
	`status` enum('bem','observar','atencao','intervencao') NOT NULL DEFAULT 'bem',
	`evidence` text,
	`suggestedAction` text,
	`reviewedByTeacher` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recognitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`teacherId` int NOT NULL,
	`category` varchar(70) NOT NULL,
	`message` text,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recognitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`studentId` int NOT NULL,
	`answerText` text,
	`attachmentKey` varchar(500),
	`status` enum('pendente','enviada','devolvida','concluida') NOT NULL DEFAULT 'pendente',
	`score` int,
	`teacherFeedback` text,
	`submittedAt` timestamp,
	`feedbackAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `submissions_unique` UNIQUE(`activityId`,`studentId`)
);
--> statement-breakpoint
CREATE TABLE `teacher_journals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`classroomId` int NOT NULL,
	`subject` varchar(90) NOT NULL,
	`contentTopic` varchar(140) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_journals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','aluno','professor','coordenacao','diretoria','admin') NOT NULL DEFAULT 'aluno',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `activities_classroom_idx` ON `activities` (`classroomId`);--> statement-breakpoint
CREATE INDEX `activities_creator_idx` ON `activities` (`createdById`);--> statement-breakpoint
CREATE INDEX `activity_assignments_student_idx` ON `activity_assignments` (`studentId`);--> statement-breakpoint
CREATE INDEX `class_memberships_user_idx` ON `class_memberships` (`userId`);--> statement-breakpoint
CREATE INDEX `classrooms_institution_idx` ON `classrooms` (`institutionId`);--> statement-breakpoint
CREATE INDEX `learning_signals_class_idx` ON `learning_signals` (`classroomId`);--> statement-breakpoint
CREATE INDEX `learning_signals_student_idx` ON `learning_signals` (`studentId`);--> statement-breakpoint
CREATE INDEX `recognitions_student_idx` ON `recognitions` (`studentId`);--> statement-breakpoint
CREATE INDEX `submissions_student_idx` ON `submissions` (`studentId`);--> statement-breakpoint
CREATE INDEX `teacher_journals_class_idx` ON `teacher_journals` (`classroomId`);