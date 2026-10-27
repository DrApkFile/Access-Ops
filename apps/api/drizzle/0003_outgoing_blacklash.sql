CREATE TABLE "ao_floor_plan_links" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"level_id" text NOT NULL,
	"project_id" text NOT NULL,
	"model_version" integer NOT NULL,
	"reviewer_id" text NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ao_floor_plan_links" ADD CONSTRAINT "ao_floor_plan_links_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_floor_plan_links" ADD CONSTRAINT "ao_floor_plan_links_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_floor_plan_links" ADD CONSTRAINT "ao_floor_plan_links_level_id_ao_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."ao_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_floor_plan_links" ADD CONSTRAINT "ao_floor_plan_links_reviewer_id_ao_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;