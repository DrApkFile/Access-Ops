ALTER TABLE ao_buildings ADD CONSTRAINT ao_buildings_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_levels ADD CONSTRAINT ao_levels_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_entities ADD CONSTRAINT ao_entities_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_sources ADD CONSTRAINT ao_sources_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_snapshots ADD CONSTRAINT ao_snapshots_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_observations ADD CONSTRAINT ao_observations_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_ingestion_runs ADD CONSTRAINT ao_ingestion_runs_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_graphs ADD CONSTRAINT ao_graphs_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_investigations ADD CONSTRAINT ao_investigations_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_findings ADD CONSTRAINT ao_findings_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_actions ADD CONSTRAINT ao_actions_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_scenarios ADD CONSTRAINT ao_scenarios_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_jobs ADD CONSTRAINT ao_jobs_workspace_identity UNIQUE (workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_levels ADD CONSTRAINT ao_levels_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_entities ADD CONSTRAINT ao_entities_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_entities ADD CONSTRAINT ao_entities_level_id_tenant FOREIGN KEY(workspace_id,level_id) REFERENCES ao_levels(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_sources ADD CONSTRAINT ao_sources_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_snapshots ADD CONSTRAINT ao_snapshots_source_id_tenant FOREIGN KEY(workspace_id,source_id) REFERENCES ao_sources(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_snapshots ADD CONSTRAINT ao_snapshots_run_id_tenant FOREIGN KEY(workspace_id,run_id) REFERENCES ao_ingestion_runs(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_ingestion_runs ADD CONSTRAINT ao_ingestion_runs_source_id_tenant FOREIGN KEY(workspace_id,source_id) REFERENCES ao_sources(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_observations ADD CONSTRAINT ao_observations_source_id_tenant FOREIGN KEY(workspace_id,source_id) REFERENCES ao_sources(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_observations ADD CONSTRAINT ao_observations_snapshot_id_tenant FOREIGN KEY(workspace_id,snapshot_id) REFERENCES ao_snapshots(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_observations ADD CONSTRAINT ao_observations_entity_id_tenant FOREIGN KEY(workspace_id,entity_id) REFERENCES ao_entities(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_match_decisions ADD CONSTRAINT ao_match_decisions_observation_id_tenant FOREIGN KEY(workspace_id,observation_id) REFERENCES ao_observations(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_match_decisions ADD CONSTRAINT ao_match_decisions_entity_id_tenant FOREIGN KEY(workspace_id,entity_id) REFERENCES ao_entities(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_graphs ADD CONSTRAINT ao_graphs_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_investigations ADD CONSTRAINT ao_investigations_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_findings ADD CONSTRAINT ao_findings_investigation_id_tenant FOREIGN KEY(workspace_id,investigation_id) REFERENCES ao_investigations(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_findings ADD CONSTRAINT ao_findings_entity_id_tenant FOREIGN KEY(workspace_id,entity_id) REFERENCES ao_entities(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_actions ADD CONSTRAINT ao_actions_finding_id_tenant FOREIGN KEY(workspace_id,finding_id) REFERENCES ao_findings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_scenarios ADD CONSTRAINT ao_scenarios_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_scenarios ADD CONSTRAINT ao_scenarios_graph_id_tenant FOREIGN KEY(workspace_id,graph_id) REFERENCES ao_graphs(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_floor_plan_links ADD CONSTRAINT ao_floor_plan_links_building_id_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_floor_plan_links ADD CONSTRAINT ao_floor_plan_links_level_id_tenant FOREIGN KEY(workspace_id,level_id) REFERENCES ao_levels(workspace_id,id);
--> statement-breakpoint
CREATE UNIQUE INDEX floor_models_project_version ON floor_models(project_id,version);
--> statement-breakpoint
ALTER TABLE projects ADD CONSTRAINT projects_workspace_fk FOREIGN KEY(workspace_id) REFERENCES ao_workspaces(id);
--> statement-breakpoint
ALTER TABLE exports ADD CONSTRAINT exports_tactile_design_fk FOREIGN KEY(tactile_design_id) REFERENCES tactile_designs(id);
--> statement-breakpoint
ALTER TABLE ao_levels ADD CONSTRAINT ao_levels_building_identity UNIQUE(workspace_id,building_id,id);
--> statement-breakpoint
ALTER TABLE ao_entities ADD CONSTRAINT ao_entities_level_building_context FOREIGN KEY(workspace_id,building_id,level_id) REFERENCES ao_levels(workspace_id,building_id,id);
--> statement-breakpoint
CREATE FUNCTION ao_reject_evidence_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Immutable evidence: append a new observation or review decision'; END; $$;
--> statement-breakpoint
CREATE TRIGGER ao_observations_immutable BEFORE UPDATE OR DELETE ON ao_observations FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER ao_snapshots_immutable BEFORE UPDATE OR DELETE ON ao_snapshots FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER ao_match_decisions_immutable BEFORE UPDATE OR DELETE ON ao_match_decisions FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER ao_resolutions_immutable BEFORE UPDATE OR DELETE ON ao_resolutions FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER ao_graphs_immutable BEFORE UPDATE OR DELETE ON ao_graphs FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER ao_findings_immutable BEFORE UPDATE OR DELETE ON ao_findings FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER ao_audit_events_immutable BEFORE UPDATE OR DELETE ON ao_audit_events FOR EACH ROW EXECUTE FUNCTION ao_reject_evidence_mutation();
--> statement-breakpoint
ALTER TABLE ao_sources ADD CONSTRAINT ao_source_freshness CHECK(freshness_seconds BETWEEN 60 AND 31536000);
--> statement-breakpoint
ALTER TABLE ao_jobs ADD CONSTRAINT ao_job_states CHECK(status IN ('queued','running','succeeded','failed','cancelled'));
--> statement-breakpoint
ALTER TABLE ao_actions ADD CONSTRAINT ao_action_states CHECK(status IN ('proposed','approved','in_progress','resolved','rejected'));
--> statement-breakpoint
ALTER TABLE ao_jobs ADD CONSTRAINT ao_job_attempts CHECK(attempts>=0 AND max_attempts BETWEEN 1 AND 10);
