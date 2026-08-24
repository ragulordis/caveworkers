CREATE TABLE `ciAdapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`adapterKey` varchar(120) NOT NULL,
	`status` enum('draft','connected','unavailable','disabled') NOT NULL DEFAULT 'draft',
	`capabilities` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ciAdapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaArtifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int,
	`defectId` int,
	`artifactType` enum('log','screenshot','trace','report','video','response') NOT NULL,
	`title` varchar(180) NOT NULL,
	`storageKey` varchar(512),
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qaArtifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaDefects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`runId` int,
	`taskId` int,
	`reportedByEmployeeId` int NOT NULL,
	`suggestedOwnerEmployeeId` int,
	`defectKey` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`severity` enum('blocker','critical','high','medium','low') NOT NULL,
	`status` enum('open','triaged','in_progress','ready_for_verification','verified','closed','wont_fix') NOT NULL DEFAULT 'open',
	`environment` varchar(100) NOT NULL,
	`stepsToReproduce` text NOT NULL,
	`expectedResult` text NOT NULL,
	`actualResult` text NOT NULL,
	`evidence` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qaDefects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int,
	`testPlanId` int,
	`runId` int,
	`defectId` int,
	`taskId` int,
	`action` enum('plan_created','run_started','run_completed','defect_created','developer_notified','security_regression_created','data_regression_created','verification_requested','verification_completed','permission_denied') NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qaEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaTestCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`testType` enum('unit','integration','api','ui','end_to_end','regression','smoke','performance','security_regression') NOT NULL,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`preconditions` text,
	`steps` text NOT NULL,
	`expectedResult` text NOT NULL,
	`automationStatus` enum('manual','candidate','automated','flaky') NOT NULL DEFAULT 'candidate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qaTestCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaTestPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`taskId` int,
	`title` varchar(255) NOT NULL,
	`featureDescription` text NOT NULL,
	`status` enum('planned','designing','ready','running','blocked','completed') NOT NULL DEFAULT 'planned',
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qaTestPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaTestResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`testCaseId` int,
	`name` varchar(255) NOT NULL,
	`status` enum('passed','failed','skipped','flaky','environment_error') NOT NULL,
	`failureClass` enum('application_bug','broken_test','environment_failure','dependency_problem','flaky_test','none') NOT NULL DEFAULT 'none',
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qaTestResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaTestRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`planId` int,
	`taskId` int,
	`toolName` varchar(120) NOT NULL,
	`suiteName` varchar(255) NOT NULL,
	`environment` varchar(100) NOT NULL,
	`status` enum('queued','running','passed','failed','blocked','cancelled') NOT NULL DEFAULT 'queued',
	`total` int NOT NULL DEFAULT 0,
	`passed` int NOT NULL DEFAULT 0,
	`failed` int NOT NULL DEFAULT 0,
	`skipped` int NOT NULL DEFAULT 0,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `qaTestRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaToolPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`toolName` varchar(120) NOT NULL,
	`toolType` varchar(80) NOT NULL,
	`canRead` boolean NOT NULL DEFAULT false,
	`canExecute` boolean NOT NULL DEFAULT false,
	`canWrite` boolean NOT NULL DEFAULT false,
	`requiresApproval` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qaToolPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`defectId` int,
	`runId` int,
	`taskId` int,
	`employeeId` int NOT NULL,
	`status` enum('pending','verified','failed','blocked') NOT NULL DEFAULT 'pending',
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qaVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employeeMemories` MODIFY COLUMN `type` enum('technical_fact','decision','preference','task_context','project_context','known_issue','security_architecture','threat_model','compliance','accepted_risk','security_finding','security_incident','dataset_metadata','schema_definition','kpi_definition','reporting_convention','analysis_finding','dashboard_reference','recurring_report','test_suite','regression_history','recurring_bug','testing_convention','flaky_test','important_user_flow','quality_risk') NOT NULL;--> statement-breakpoint
ALTER TABLE `ciAdapters` ADD CONSTRAINT `ciAdapters_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaArtifacts` ADD CONSTRAINT `qaArtifacts_runId_qaTestRuns_id_fk` FOREIGN KEY (`runId`) REFERENCES `qaTestRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaArtifacts` ADD CONSTRAINT `qaArtifacts_defectId_qaDefects_id_fk` FOREIGN KEY (`defectId`) REFERENCES `qaDefects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaDefects` ADD CONSTRAINT `qaDefects_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaDefects` ADD CONSTRAINT `qaDefects_runId_qaTestRuns_id_fk` FOREIGN KEY (`runId`) REFERENCES `qaTestRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaDefects` ADD CONSTRAINT `qaDefects_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaDefects` ADD CONSTRAINT `qaDefects_reportedByEmployeeId_employees_id_fk` FOREIGN KEY (`reportedByEmployeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaDefects` ADD CONSTRAINT `qaDefects_suggestedOwnerEmployeeId_employees_id_fk` FOREIGN KEY (`suggestedOwnerEmployeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaEvents` ADD CONSTRAINT `qaEvents_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaEvents` ADD CONSTRAINT `qaEvents_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaEvents` ADD CONSTRAINT `qaEvents_testPlanId_qaTestPlans_id_fk` FOREIGN KEY (`testPlanId`) REFERENCES `qaTestPlans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaEvents` ADD CONSTRAINT `qaEvents_runId_qaTestRuns_id_fk` FOREIGN KEY (`runId`) REFERENCES `qaTestRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaEvents` ADD CONSTRAINT `qaEvents_defectId_qaDefects_id_fk` FOREIGN KEY (`defectId`) REFERENCES `qaDefects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaEvents` ADD CONSTRAINT `qaEvents_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestCases` ADD CONSTRAINT `qaTestCases_planId_qaTestPlans_id_fk` FOREIGN KEY (`planId`) REFERENCES `qaTestPlans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestPlans` ADD CONSTRAINT `qaTestPlans_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestPlans` ADD CONSTRAINT `qaTestPlans_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestPlans` ADD CONSTRAINT `qaTestPlans_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestResults` ADD CONSTRAINT `qaTestResults_runId_qaTestRuns_id_fk` FOREIGN KEY (`runId`) REFERENCES `qaTestRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestResults` ADD CONSTRAINT `qaTestResults_testCaseId_qaTestCases_id_fk` FOREIGN KEY (`testCaseId`) REFERENCES `qaTestCases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestRuns` ADD CONSTRAINT `qaTestRuns_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestRuns` ADD CONSTRAINT `qaTestRuns_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestRuns` ADD CONSTRAINT `qaTestRuns_planId_qaTestPlans_id_fk` FOREIGN KEY (`planId`) REFERENCES `qaTestPlans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaTestRuns` ADD CONSTRAINT `qaTestRuns_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaToolPolicies` ADD CONSTRAINT `qaToolPolicies_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaVerifications` ADD CONSTRAINT `qaVerifications_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaVerifications` ADD CONSTRAINT `qaVerifications_defectId_qaDefects_id_fk` FOREIGN KEY (`defectId`) REFERENCES `qaDefects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaVerifications` ADD CONSTRAINT `qaVerifications_runId_qaTestRuns_id_fk` FOREIGN KEY (`runId`) REFERENCES `qaTestRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaVerifications` ADD CONSTRAINT `qaVerifications_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qaVerifications` ADD CONSTRAINT `qaVerifications_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;