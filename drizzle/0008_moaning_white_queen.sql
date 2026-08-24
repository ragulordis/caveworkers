CREATE TABLE `companyDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`contentType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companyDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companyDocuments` ADD CONSTRAINT `companyDocuments_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companyDocuments` ADD CONSTRAINT `companyDocuments_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `companyDocuments_companyId_createdAt_idx` ON `companyDocuments` (`companyId`,`createdAt`);