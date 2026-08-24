CREATE TABLE `securityApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`reviewId` int,
	`findingId` int,
	`requestedByEmployeeId` int NOT NULL,
	`approvedByUserId` int,
	`operation` varchar(120) NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `securityApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int,
	`reviewId` int,
	`findingId` int,
	`taskId` int,
	`action` enum('security_scan_started','finding_created','severity_changed','developer_notified','remediation_requested','finding_resolved','verification_completed','approval_requested','approval_resolved') NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`reviewId` int NOT NULL,
	`taskId` int,
	`severity` enum('critical','high','medium','low','informational') NOT NULL,
	`confidence` enum('confirmed','likely','potential','insufficient_evidence') NOT NULL,
	`status` enum('open','acknowledged','remediation_in_progress','resolved','accepted_risk') NOT NULL DEFAULT 'open',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`impact` text NOT NULL,
	`likelihood` varchar(80) NOT NULL,
	`evidence` text NOT NULL,
	`recommendation` text NOT NULL,
	`remediation` text,
	`verification` text,
	`requiresApproval` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityFindings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityRemediations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`findingId` int NOT NULL,
	`taskId` int,
	`assignedEmployeeId` int,
	`status` enum('requested','in_progress','ready_for_verification','verified','blocked') NOT NULL DEFAULT 'requested',
	`summary` text NOT NULL,
	`verificationSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityRemediations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`projectId` int,
	`taskId` int,
	`employeeId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`reviewType` enum('security_assessment','threat_model','code_review','api_review','authentication_review','authorization_review','dependency_review','infrastructure_review','configuration_review','incident_analysis','verification') NOT NULL,
	`status` enum('planned','analyzing','reviewing','waiting','blocked','completed') NOT NULL DEFAULT 'planned',
	`riskScore` int NOT NULL DEFAULT 0,
	`summary` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityToolPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`toolName` varchar(100) NOT NULL,
	`canRead` boolean NOT NULL DEFAULT false,
	`canExecute` boolean NOT NULL DEFAULT false,
	`canWrite` boolean NOT NULL DEFAULT false,
	`requiresApproval` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityToolPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employeeMemories` MODIFY COLUMN `type` enum('technical_fact','decision','preference','task_context','project_context','known_issue','security_architecture','threat_model','compliance','accepted_risk','security_finding','security_incident') NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `status` enum('idle','thinking','planning','working','waiting','reviewing','testing','blocked','completed','error','monitoring','analyzing','investigating','warning','resolved') NOT NULL DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE `securityApprovals` ADD CONSTRAINT `securityApprovals_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityApprovals` ADD CONSTRAINT `securityApprovals_reviewId_securityReviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `securityReviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityApprovals` ADD CONSTRAINT `securityApprovals_findingId_securityFindings_id_fk` FOREIGN KEY (`findingId`) REFERENCES `securityFindings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityApprovals` ADD CONSTRAINT `securityApprovals_requestedByEmployeeId_employees_id_fk` FOREIGN KEY (`requestedByEmployeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityApprovals` ADD CONSTRAINT `securityApprovals_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_reviewId_securityReviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `securityReviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_findingId_securityFindings_id_fk` FOREIGN KEY (`findingId`) REFERENCES `securityFindings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityFindings` ADD CONSTRAINT `securityFindings_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityFindings` ADD CONSTRAINT `securityFindings_reviewId_securityReviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `securityReviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityFindings` ADD CONSTRAINT `securityFindings_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityRemediations` ADD CONSTRAINT `securityRemediations_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityRemediations` ADD CONSTRAINT `securityRemediations_findingId_securityFindings_id_fk` FOREIGN KEY (`findingId`) REFERENCES `securityFindings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityRemediations` ADD CONSTRAINT `securityRemediations_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityRemediations` ADD CONSTRAINT `securityRemediations_assignedEmployeeId_employees_id_fk` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityReviews` ADD CONSTRAINT `securityReviews_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityReviews` ADD CONSTRAINT `securityReviews_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityReviews` ADD CONSTRAINT `securityReviews_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityReviews` ADD CONSTRAINT `securityReviews_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityToolPolicies` ADD CONSTRAINT `securityToolPolicies_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;