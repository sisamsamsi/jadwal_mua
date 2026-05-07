CREATE TABLE `booking_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`previous_status` text,
	`new_status` text,
	`created_at` text NOT NULL,
	`created_by` text,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`service_id` text,
	`package_id` text,
	`booking_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`location_name` text,
	`location_address` text,
	`location_lat` real,
	`location_lng` real,
	`travel_time_minutes` integer DEFAULT 0 NOT NULL,
	`num_persons` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`total_price` real DEFAULT 0 NOT NULL,
	`cancellation_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `bridal_party` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`service_id` text,
	`notes` text,
	`price` real DEFAULT 0,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `client_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`booking_id` text,
	`photo_url` text NOT NULL,
	`caption` text,
	`photo_type` text DEFAULT 'after',
	`created_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`city` text,
	`skin_type` text,
	`allergies` text,
	`preferences` text,
	`notes` text,
	`tags` text,
	`is_active` integer DEFAULT true NOT NULL,
	`total_bookings` integer DEFAULT 0 NOT NULL,
	`last_booking_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`expense_date` text NOT NULL,
	`receipt_image_url` text,
	`notes` text,
	`created_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0,
	`tax` real DEFAULT 0,
	`total_amount` real DEFAULT 0 NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`due_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `package_items` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`service_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price_override` real,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`total_price` real DEFAULT 0 NOT NULL,
	`discount_percent` real DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`invoice_id` text,
	`amount` real NOT NULL,
	`payment_type` text NOT NULL,
	`payment_method` text DEFAULT 'transfer' NOT NULL,
	`payment_date` text NOT NULL,
	`reference_number` text,
	`proof_image_url` text,
	`notes` text,
	`created_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`category` text NOT NULL,
	`current_stock` integer DEFAULT 0 NOT NULL,
	`minimum_stock` integer DEFAULT 5 NOT NULL,
	`purchase_price` real DEFAULT 0,
	`expiry_date` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`phone` text,
	`business_name` text,
	`bio` text,
	`profile_photo_url` text,
	`city` text,
	`instagram_handle` text,
	`whatsapp_number` text,
	`fcm_token` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text,
	`reminder_type` text NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`reminder_date` text NOT NULL,
	`is_sent` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`duration_minutes` integer DEFAULT 60 NOT NULL,
	`base_price` real DEFAULT 0 NOT NULL,
	`additional_person_price` real DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_synced` integer DEFAULT true NOT NULL,
	`local_updated_at` text
);
