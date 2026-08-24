CREATE TABLE `taskDependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentTaskId` int NOT NULL,
	`childTaskId` int NOT NULL,
	`dependencyType` enum('blocks','relates_to','handoff') NOT NULL DEFAULT 'handoff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskDependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companyContext` MODIFY COLUMN `category` enum('identity','business_context','products','projects','technology_stack','infrastructure','databases','apis','repositories','policies','goals','constraints','team','kpis','reporting','dashboards','data_sources') NOT NULL;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_parentTaskId_tasks_id_fk` FOREIGN KEY (`parentTaskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_childTaskId_tasks_id_fk` FOREIGN KEY (`childTaskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;