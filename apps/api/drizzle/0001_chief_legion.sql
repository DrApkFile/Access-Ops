CREATE TABLE "ao_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finding_id" text NOT NULL,
	"owner_id" text,
	"priority" text NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"proposal" text NOT NULL,
	"due_at" timestamp with time zone,
	"approved_by" text,
	"resolution" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"level_id" text,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_findings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"investigation_id" text NOT NULL,
	"entity_id" text,
	"finding" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_graphs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"version" integer NOT NULL,
	"graph" jsonb NOT NULL,
	"reviewer_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_ingestion_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_id" text NOT NULL,
	"status" text NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ao_investigations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"question" text NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"result" jsonb,
	"error" text,
	"created_by" text NOT NULL,
	"previous_id" text,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ao_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"lease_owner" text,
	"error" text,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ao_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"name" text NOT NULL,
	"ordinal" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_match_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"observation_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_memberships" (
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "ao_memberships_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id"),
	CONSTRAINT "ao_member_role" CHECK ("ao_memberships"."role" in ('viewer','operator','reviewer','source_admin','admin'))
);
--> statement-breakpoint
CREATE TABLE "ao_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_id" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"entity_id" text,
	"external_id" text NOT NULL,
	"hash" text NOT NULL,
	"record" jsonb NOT NULL,
	"match" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_provider_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"investigation_id" text,
	"provider" text NOT NULL,
	"model" text,
	"status" text NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_resolutions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" text NOT NULL,
	"attribute" text NOT NULL,
	"evidence_ids" jsonb NOT NULL,
	"reason" text NOT NULL,
	"reviewer_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"graph_id" text NOT NULL,
	"definition" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"evidence" jsonb NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_id" text NOT NULL,
	"run_id" text NOT NULL,
	"hash" text NOT NULL,
	"record_count" integer NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"building_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"namespace" text NOT NULL,
	"publisher" text NOT NULL,
	"uri" text NOT NULL,
	"license" text NOT NULL,
	"trust" integer NOT NULL,
	"freshness_seconds" integer NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "ao_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ao_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ao_workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exports" ADD COLUMN "tactile_design_id" text;--> statement-breakpoint
ALTER TABLE "exports" ADD COLUMN "floor_model_version" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "ao_actions" ADD CONSTRAINT "ao_actions_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_actions" ADD CONSTRAINT "ao_actions_finding_id_ao_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."ao_findings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_actions" ADD CONSTRAINT "ao_actions_owner_id_ao_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_actions" ADD CONSTRAINT "ao_actions_approved_by_ao_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_audit_events" ADD CONSTRAINT "ao_audit_events_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_buildings" ADD CONSTRAINT "ao_buildings_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_entities" ADD CONSTRAINT "ao_entities_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_entities" ADD CONSTRAINT "ao_entities_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_entities" ADD CONSTRAINT "ao_entities_level_id_ao_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."ao_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_findings" ADD CONSTRAINT "ao_findings_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_findings" ADD CONSTRAINT "ao_findings_investigation_id_ao_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."ao_investigations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_findings" ADD CONSTRAINT "ao_findings_entity_id_ao_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."ao_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_graphs" ADD CONSTRAINT "ao_graphs_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_graphs" ADD CONSTRAINT "ao_graphs_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_graphs" ADD CONSTRAINT "ao_graphs_reviewer_id_ao_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_ingestion_runs" ADD CONSTRAINT "ao_ingestion_runs_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_ingestion_runs" ADD CONSTRAINT "ao_ingestion_runs_source_id_ao_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."ao_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_investigations" ADD CONSTRAINT "ao_investigations_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_investigations" ADD CONSTRAINT "ao_investigations_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_investigations" ADD CONSTRAINT "ao_investigations_created_by_ao_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_jobs" ADD CONSTRAINT "ao_jobs_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_levels" ADD CONSTRAINT "ao_levels_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_levels" ADD CONSTRAINT "ao_levels_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_match_decisions" ADD CONSTRAINT "ao_match_decisions_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_match_decisions" ADD CONSTRAINT "ao_match_decisions_observation_id_ao_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."ao_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_match_decisions" ADD CONSTRAINT "ao_match_decisions_entity_id_ao_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."ao_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_match_decisions" ADD CONSTRAINT "ao_match_decisions_reviewer_id_ao_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_memberships" ADD CONSTRAINT "ao_memberships_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_memberships" ADD CONSTRAINT "ao_memberships_user_id_ao_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_observations" ADD CONSTRAINT "ao_observations_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_observations" ADD CONSTRAINT "ao_observations_source_id_ao_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."ao_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_observations" ADD CONSTRAINT "ao_observations_snapshot_id_ao_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."ao_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_observations" ADD CONSTRAINT "ao_observations_entity_id_ao_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."ao_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_provider_runs" ADD CONSTRAINT "ao_provider_runs_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_provider_runs" ADD CONSTRAINT "ao_provider_runs_investigation_id_ao_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."ao_investigations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_resolutions" ADD CONSTRAINT "ao_resolutions_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_resolutions" ADD CONSTRAINT "ao_resolutions_entity_id_ao_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."ao_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_resolutions" ADD CONSTRAINT "ao_resolutions_reviewer_id_ao_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_scenarios" ADD CONSTRAINT "ao_scenarios_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_scenarios" ADD CONSTRAINT "ao_scenarios_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_scenarios" ADD CONSTRAINT "ao_scenarios_graph_id_ao_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."ao_graphs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_scenarios" ADD CONSTRAINT "ao_scenarios_created_by_ao_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_sessions" ADD CONSTRAINT "ao_sessions_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_sessions" ADD CONSTRAINT "ao_sessions_user_id_ao_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ao_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_snapshots" ADD CONSTRAINT "ao_snapshots_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_snapshots" ADD CONSTRAINT "ao_snapshots_source_id_ao_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."ao_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_snapshots" ADD CONSTRAINT "ao_snapshots_run_id_ao_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ao_ingestion_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_sources" ADD CONSTRAINT "ao_sources_workspace_id_ao_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."ao_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_sources" ADD CONSTRAINT "ao_sources_building_id_ao_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."ao_buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_workspaces" ADD CONSTRAINT "ao_workspaces_organization_id_ao_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."ao_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ao_audit_workspace" ON "ao_audit_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "ao_entity_context" ON "ao_entities" USING btree ("workspace_id","building_id","level_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ao_graph_version" ON "ao_graphs" USING btree ("workspace_id","building_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "ao_job_idempotency" ON "ao_jobs" USING btree ("workspace_id","key");--> statement-breakpoint
CREATE INDEX "ao_job_claim" ON "ao_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE UNIQUE INDEX "ao_level_number" ON "ao_levels" USING btree ("workspace_id","building_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "ao_observation_once" ON "ao_observations" USING btree ("workspace_id","source_id","hash");--> statement-breakpoint
CREATE INDEX "ao_observation_entity" ON "ao_observations" USING btree ("workspace_id","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ao_snapshot_content" ON "ao_snapshots" USING btree ("workspace_id","source_id","hash");--> statement-breakpoint
CREATE UNIQUE INDEX "ao_source_namespace" ON "ao_sources" USING btree ("workspace_id","building_id","namespace");