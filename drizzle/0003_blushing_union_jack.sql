CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`taskId` int,
	`dataSourceId` int,
	`title` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`analysisType` enum('trend','anomaly','kpi','customer','revenue','product','funnel','cohort','experiment','operational') NOT NULL,
	`status` enum('planned','retrieving','validating','analyzing','waiting','blocked','completed') NOT NULL DEFAULT 'planned',
	`comparisonPeriod` varchar(160),
	`dataQualityStatus` enum('unknown','good','warning','insufficient') NOT NULL DEFAULT 'unknown',
	`dataQualitySummary` text,
	`confidence` enum('high','medium','low','insufficient') NOT NULL DEFAULT 'medium',
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysisResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`resultType` enum('fact','observation','inference','hypothesis','recommendation') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`evidence` text NOT NULL,
	`impact` text,
	`confidence` enum('high','medium','low','insufficient') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysisResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysisSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int NOT NULL,
	`analysisType` enum('trend','anomaly','kpi','customer','revenue','product','funnel','cohort','experiment','operational') NOT NULL,
	`title` varchar(180) NOT NULL,
	`cronExpression` varchar(100) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`status` enum('draft','active','paused') NOT NULL DEFAULT 'draft',
	`prompt` text NOT NULL,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysisSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysisVisualizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`visualizationType` enum('kpi','table','line','bar','funnel','trend','anomaly') NOT NULL,
	`title` varchar(180) NOT NULL,
	`data` json NOT NULL,
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysisVisualizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`employeeId` int,
	`analysisId` int,
	`taskId` int,
	`action` enum('analysis_started','data_quality_warning','finding_created','insight_shared','developer_handoff','security_handoff','schedule_prepared','analysis_completed') NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataQualityChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`checkType` enum('missing_values','duplicates','invalid_values','schema_change','timestamp_quality','outliers','definition_consistency') NOT NULL,
	`status` enum('passed','warning','failed') NOT NULL,
	`affectedPercent` int NOT NULL DEFAULT 0,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataQualityChecks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataSourcePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`dataSourceId` int,
	`canRead` boolean NOT NULL DEFAULT false,
	`canQuery` boolean NOT NULL DEFAULT false,
	`canAnalyze` boolean NOT NULL DEFAULT false,
	`canWrite` boolean NOT NULL DEFAULT false,
	`requiresApproval` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSourcePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`sourceType` enum('csv','excel','sql_database','rest_api','json','analytics_system','data_warehouse') NOT NULL,
	`status` enum('connected','pending','unavailable','needs_review') NOT NULL DEFAULT 'pending',
	`connectorKey` varchar(120) NOT NULL,
	`schemaSummary` text,
	`metadata` json,
	`lastProfiledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employeeMemories` MODIFY COLUMN `type` enum('technical_fact','decision','preference','task_context','project_context','known_issue','security_architecture','threat_model','compliance','accepted_risk','security_finding','security_incident','dataset_metadata','schema_definition','kpi_definition','reporting_convention','analysis_finding','dashboard_reference','recurring_report') NOT NULL;--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_dataSourceId_dataSources_id_fk` FOREIGN KEY (`dataSourceId`) REFERENCES `dataSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analysisResults` ADD CONSTRAINT `analysisResults_analysisId_analyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analysisSchedules` ADD CONSTRAINT `analysisSchedules_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analysisSchedules` ADD CONSTRAINT `analysisSchedules_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analysisVisualizations` ADD CONSTRAINT `analysisVisualizations_analysisId_analyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataEvents` ADD CONSTRAINT `dataEvents_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataEvents` ADD CONSTRAINT `dataEvents_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataEvents` ADD CONSTRAINT `dataEvents_analysisId_analyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataEvents` ADD CONSTRAINT `dataEvents_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataQualityChecks` ADD CONSTRAINT `dataQualityChecks_analysisId_analyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSourcePermissions` ADD CONSTRAINT `dataSourcePermissions_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSourcePermissions` ADD CONSTRAINT `dataSourcePermissions_dataSourceId_dataSources_id_fk` FOREIGN KEY (`dataSourceId`) REFERENCES `dataSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSources` ADD CONSTRAINT `dataSources_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;