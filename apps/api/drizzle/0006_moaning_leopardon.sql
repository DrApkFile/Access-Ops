CREATE TABLE "ao_building_grants" (
	"workspace_id" text NOT NULL,
	"building_id" text NOT NULL,
	"user_id" text NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "ao_building_grants_workspace_id_building_id_user_id_pk" PRIMARY KEY("workspace_id","building_id","user_id"),
	CONSTRAINT "ao_building_grant_permission" CHECK ("ao_building_grants"."permission" in ('read','write','review','manage'))
);
--> statement-breakpoint
CREATE TABLE "ao_project_grants" (
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "ao_project_grants_workspace_id_project_id_user_id_pk" PRIMARY KEY("workspace_id","project_id","user_id"),
	CONSTRAINT "ao_project_grant_permission" CHECK ("ao_project_grants"."permission" in ('read','write','review','manage'))
);
--> statement-breakpoint
ALTER TABLE "ao_building_grants" ADD CONSTRAINT "ao_building_grants_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_building_grants" ADD CONSTRAINT "ao_building_grants_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_building_grants" ADD CONSTRAINT "ao_building_grants_user_id_ao_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_project_grants" ADD CONSTRAINT "ao_project_grants_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_project_grants" ADD CONSTRAINT "ao_project_grants_user_id_ao_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;