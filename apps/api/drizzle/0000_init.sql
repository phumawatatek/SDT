CREATE TYPE "public"."attachment_kind" AS ENUM('truoc', 'sau', 'bo_sung');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('moi_tiep_nhan', 'cho_dieu_phoi', 'da_giao', 'dang_xu_ly', 'cho_bo_sung', 'de_nghi_chuyen', 'de_nghi_gia_han', 'cho_duyet_ket_qua', 'da_giai_quyet', 'mo_lai', 'chuyen_co_quan_khac', 'khong_xu_ly', 'chuyen_khieu_nai', 'da_dong');--> statement-breakpoint
CREATE TYPE "public"."case_channel" AS ENUM('Zalo', 'Web', 'Gửi hộ');--> statement-breakpoint
CREATE TYPE "public"."case_rating" AS ENUM('hai_long', 'khong_hai_long');--> statement-breakpoint
CREATE TYPE "public"."unit_kind" AS ENUM('phong', 'van_phong', 'lien_thong', 'ngoai', 'lanh_dao');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('citizen', 'kp', 'canbo', 'truongphong', 'dieuphoi', 'phochutich', 'chutich', 'admin');--> statement-breakpoint
CREATE TABLE "access_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"case_code" text NOT NULL,
	"action" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"kind" "attachment_kind" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" integer,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"from_status" "case_status",
	"to_status" "case_status",
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "case_senders" (
	"case_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"user_id" integer,
	"entered_by_id" integer,
	"consent_show_kp" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"ord" smallint NOT NULL,
	"name" text NOT NULL,
	"required" boolean NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"skipped_reason" text
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"topic_id" integer NOT NULL,
	"ward_id" integer NOT NULL,
	"address" text NOT NULL,
	"coords" text DEFAULT '' NOT NULL,
	"channel" "case_channel" NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"status" "case_status" NOT NULL,
	"unit_id" integer,
	"handler_id" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" date NOT NULL,
	"received_at" timestamp with time zone,
	"reopened" boolean DEFAULT false NOT NULL,
	"extension_round" smallint,
	"resume_status" "case_status",
	"closed_on_time" boolean,
	"result" text,
	"rating" "case_rating",
	"merged_into_id" integer
);
--> statement-breakpoint
CREATE TABLE "kp_notes" (
	"case_id" integer PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"shared" boolean DEFAULT false NOT NULL,
	"author_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"default_unit_id" integer,
	"sensitive" boolean DEFAULT false NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"flag" text,
	"sla_days" smallint DEFAULT 10 NOT NULL,
	CONSTRAINT "topics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" "unit_kind" NOT NULL,
	CONSTRAINT "units_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_block_units" (
	"user_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	CONSTRAINT "user_block_units_user_id_unit_id_pk" PRIMARY KEY("user_id","unit_id")
);
--> statement-breakpoint
CREATE TABLE "user_topics" (
	"user_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "user_topics_user_id_topic_id_pk" PRIMARY KEY("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"role" "user_role" NOT NULL,
	"unit_id" integer,
	"ward_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "wards_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_senders" ADD CONSTRAINT "case_senders_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_senders" ADD CONSTRAINT "case_senders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_senders" ADD CONSTRAINT "case_senders_entered_by_id_users_id_fk" FOREIGN KEY ("entered_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_steps" ADD CONSTRAINT "case_steps_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_handler_id_users_id_fk" FOREIGN KEY ("handler_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kp_notes" ADD CONSTRAINT "kp_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kp_notes" ADD CONSTRAINT "kp_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_default_unit_id_units_id_fk" FOREIGN KEY ("default_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_block_units" ADD CONSTRAINT "user_block_units_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_block_units" ADD CONSTRAINT "user_block_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cases_code_idx" ON "cases" USING btree ("code");