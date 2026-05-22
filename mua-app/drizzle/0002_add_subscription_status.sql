ALTER TABLE `profiles` ADD `subscription_status` text DEFAULT 'trial';
--> statement-breakpoint
ALTER TABLE `profiles` ADD `trial_ends_at` text;
--> statement-breakpoint
ALTER TABLE `profiles` ADD `subscription_ends_at` text;
