CREATE TABLE `activityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int,
	`taskId` int,
	`action` varchar(160) NOT NULL,
	`summary` text NOT NULL,
	`status` enum('started','completed','blocked','failed') NOT NULL DEFAULT 'started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`industry` varchar(120),
	`goals` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companyContext` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`category` enum('identity','business_context','products','projects','technology_stack','infrastructure','databases','apis','repositories','policies','goals','constraints','team') NOT NULL,
	`title` varchar(180) NOT NULL,
	`value` text NOT NULL,
	`source` varchar(120) NOT NULL DEFAULT 'onboarding',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companyContext_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companyMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companyMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`projectId` int,
	`title` varchar(180) NOT NULL,
	`visibility` enum('company','team','private') NOT NULL DEFAULT 'company',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`taskId` int,
	`employeeId` int,
	`title` varchar(180) NOT NULL,
	`rationale` text NOT NULL,
	`status` enum('proposed','accepted','superseded') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeMemories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`projectId` int,
	`type` enum('technical_fact','decision','preference','task_context','project_context','known_issue') NOT NULL,
	`title` varchar(180) NOT NULL,
	`value` text NOT NULL,
	`importance` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeMemories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`key` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`role` varchar(160) NOT NULL,
	`status` enum('idle','thinking','planning','working','waiting','reviewing','testing','blocked','completed','error') NOT NULL DEFAULT 'idle',
	`model` varchar(160) NOT NULL,
	`systemPromptKey` varchar(100) NOT NULL,
	`temperature` int NOT NULL DEFAULT 20,
	`maxTokens` int NOT NULL DEFAULT 1200,
	`toolPermissions` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderType` enum('user','employee','system') NOT NULL,
	`senderUserId` int,
	`senderEmployeeId` int,
	`content` text NOT NULL,
	`replyToMessageId` int,
	`messageType` enum('message','task_assignment','task_update','progress_report','clarification','recommendation','escalation','handoff') NOT NULL DEFAULT 'message',
	`visibility` enum('company','team','private') NOT NULL DEFAULT 'company',
	`relatedTaskId` int,
	`createdBy` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`orderIndex` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('pending','active','completed','skipped','blocked') NOT NULL DEFAULT 'pending',
	`resultSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`projectId` int,
	`assignedEmployeeId` int,
	`requestedByUserId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('backlog','planning','in_progress','waiting','review','completed','blocked') NOT NULL DEFAULT 'backlog',
	`progress` int NOT NULL DEFAULT 0,
	`resultSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toolExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`taskId` int,
	`toolName` varchar(100) NOT NULL,
	`permission` varchar(100) NOT NULL,
	`inputSummary` text,
	`resultSummary` text,
	`status` enum('requested','running','completed','failed','denied') NOT NULL DEFAULT 'requested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `toolExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companyContext` ADD CONSTRAINT `companyContext_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companyMembers` ADD CONSTRAINT `companyMembers_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companyMembers` ADD CONSTRAINT `companyMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeeMemories` ADD CONSTRAINT `employeeMemories_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeeMemories` ADD CONSTRAINT `employeeMemories_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeeMemories` ADD CONSTRAINT `employeeMemories_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderUserId_users_id_fk` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderEmployeeId_employees_id_fk` FOREIGN KEY (`senderEmployeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_relatedTaskId_tasks_id_fk` FOREIGN KEY (`relatedTaskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskSteps` ADD CONSTRAINT `taskSteps_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedEmployeeId_employees_id_fk` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolExecutions` ADD CONSTRAINT `toolExecutions_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolExecutions` ADD CONSTRAINT `toolExecutions_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolExecutions` ADD CONSTRAINT `toolExecutions_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;