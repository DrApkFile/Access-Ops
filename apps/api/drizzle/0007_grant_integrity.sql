ALTER TABLE projects ADD CONSTRAINT projects_workspace_identity UNIQUE(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_building_grants ADD CONSTRAINT ao_building_grants_tenant FOREIGN KEY(workspace_id,building_id) REFERENCES ao_buildings(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_project_grants ADD CONSTRAINT ao_project_grants_tenant FOREIGN KEY(workspace_id,project_id) REFERENCES projects(workspace_id,id);
--> statement-breakpoint
ALTER TABLE ao_floor_plan_links ADD CONSTRAINT ao_plan_project_tenant FOREIGN KEY(workspace_id,project_id) REFERENCES projects(workspace_id,id);
