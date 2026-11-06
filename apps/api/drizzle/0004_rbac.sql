CREATE TYPE "public"."role_scope" AS ENUM('own', 'ward', 'assigned', 'unit', 'all', 'none');--> statement-breakpoint
CREATE TABLE "role_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" integer NOT NULL,
	"role_name" text NOT NULL,
	"change" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"perm" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_perm_pk" PRIMARY KEY("role_id","perm")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" "user_role" NOT NULL,
	"scope" "role_scope" NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- 8 vai trò gốc với quyền mặc định = hành vi trước RBAC (sinh từ DEFAULT_ROLES).
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Người dân', 'citizen', 'own', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['gui_phan_anh', 'sua_noi_dung', 'rut', 'bo_sung', 'danh_gia', 'mo_lai', 'xem_danh_tinh']) AS p WHERE "kind" = 'citizen' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Trưởng khu phố', 'kp', 'ward', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['gui_phan_anh', 'ghi_chu']) AS p WHERE "kind" = 'kp' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Cán bộ', 'canbo', 'assigned', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['nhan_viec', 'gui_ket_qua', 'hoi_bo_sung', 'xin_gia_han', 'de_nghi_chuyen', 'xem_danh_tinh']) AS p WHERE "kind" = 'canbo' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Trưởng phòng', 'truongphong', 'unit', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['giao_can_bo', 'giao_lai', 'duyet_ket_qua', 'tra_lai', 'duyet_gia_han', 'tu_choi_gia_han', 'xem_danh_tinh']) AS p WHERE "kind" = 'truongphong' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Điều phối viên', 'dieuphoi', 'all', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['giao_phong', 'chuyen_co_quan', 'chuyen_khieu_nai', 'gop_trung', 'khong_xu_ly', 'chap_nhan_chuyen', 'tu_choi_chuyen', 'xem_danh_tinh']) AS p WHERE "kind" = 'dieuphoi' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Phó Chủ tịch', 'phochutich', 'all', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['duyet_gia_han_2', 'xem_danh_tinh']) AS p WHERE "kind" = 'phochutich' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Chủ tịch', 'chutich', 'all', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['xem_luong_kin', 'xu_ly_luong_kin', 'duyet_luong_kin', 'duyet_gia_han_ct', 'nhan_viec', 'gui_ket_qua', 'hoi_bo_sung', 'xin_gia_han', 'de_nghi_chuyen', 'xem_danh_tinh']) AS p WHERE "kind" = 'chutich' AND "system";--> statement-breakpoint
INSERT INTO "roles" ("name", "kind", "scope", "system") VALUES ('Quản trị', 'admin', 'none', true);--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "perm") SELECT "id", p FROM "roles", unnest(ARRAY['admin.users', 'admin.roles', 'admin.topics', 'admin.wards', 'admin.assignments', 'admin.delegations', 'admin.holidays', 'admin.log']) AS p WHERE "kind" = 'admin' AND "system";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role_id" integer;--> statement-breakpoint
UPDATE "users" u SET "role_id" = r."id" FROM "roles" r WHERE r."kind" = u."role" AND r."system";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "role_audit" ADD CONSTRAINT "role_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;