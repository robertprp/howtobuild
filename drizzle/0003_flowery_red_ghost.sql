CREATE TABLE "project_repositories" (
	"project_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_repositories" ADD CONSTRAINT "project_repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_repositories" ADD CONSTRAINT "project_repositories_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_repository_idx" ON "project_repositories" USING btree ("project_id","repository_id");
--> statement-breakpoint
INSERT INTO "categories" ("slug", "name", "description", "accent", "sort_order") VALUES
  ('frontend', 'Frontend', 'Frameworks, component systems, styling tools, and browser-focused development.', '#c65132', 1),
  ('backend', 'Backend', 'Runtimes, API frameworks, databases, authentication, and server infrastructure.', '#2d6a58', 2),
  ('mobile', 'Mobile', 'Native and cross-platform frameworks, runtimes, and mobile developer tooling.', '#7b5aa6', 3),
  ('devops', 'DevOps', 'Deployment, infrastructure, containers, CI/CD, and platform engineering.', '#9a671d', 4),
  ('observability', 'Observability', 'Logging, tracing, metrics, errors, and application monitoring.', '#386d8b', 5),
  ('ai-tools', 'AI Tools', 'Coding agents, AI SDKs, model infrastructure, and AI application frameworks.', '#a04435', 6)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "facets" ("kind", "slug", "name") VALUES
  ('language', 'typescript', 'TypeScript'), ('language', 'javascript', 'JavaScript'),
  ('language', 'dart', 'Dart'), ('language', 'go', 'Go'), ('language', 'python', 'Python'),
  ('ecosystem', 'infrastructure-as-code', 'Infrastructure as Code'),
  ('ecosystem', 'containers', 'Containers'), ('ecosystem', 'opentelemetry', 'OpenTelemetry'),
  ('ecosystem', 'dashboards', 'Dashboards'), ('ecosystem', 'ai-applications', 'AI Applications'),
  ('ecosystem', 'local-models', 'Local Models')
ON CONFLICT ("kind", "slug") DO NOTHING;
--> statement-breakpoint
WITH seed("slug", "name", "short_description", "editorial_description", "why_interesting", "best_for", "not_ideal_for", "project_type", "category_slug", "open_source", "license", "self_hostable", "pricing_label", "pricing_summary", "recommended", "worth_watching") AS (VALUES
  ('react', 'React', 'A component library for web and native user interfaces.', 'React remains a foundational UI layer with a broad ecosystem and multiple production framework choices.', 'Its component model is still a common interoperability point across modern frontend tooling.', '["Teams that need a mature component ecosystem","Applications shared across web and native"]'::jsonb, '["Small static sites that need almost no client JavaScript"]'::jsonb, 'Library', 'frontend', true, 'MIT', true, 'Open Source', 'The library is free and open source; hosting and framework costs vary.', true, false),
  ('svelte', 'Svelte', 'A compiler-led UI framework with concise component syntax.', 'Svelte shifts much of the framework work to compilation and pairs with SvelteKit for full-stack applications.', 'It offers a direct authoring model while retaining a serious application framework and active ecosystem.', '["Interactive sites that value concise components","Teams adopting SvelteKit"]'::jsonb, '["Teams dependent on React-only component libraries"]'::jsonb, 'Framework', 'frontend', true, 'MIT', true, 'Open Source', 'Svelte and SvelteKit are free and open source; deployment costs vary.', true, false),
  ('fastify', 'Fastify', 'A low-overhead Node.js web framework with schema-based tooling.', 'Fastify combines a plugin architecture with JSON Schema integration and a deliberate focus on server performance.', 'Its encapsulated plugin model makes large Node.js services easier to compose and test.', '["TypeScript or JavaScript APIs","Services that benefit from schema-driven validation"]'::jsonb, '["Teams wanting a batteries-included full-stack framework"]'::jsonb, 'Framework', 'backend', true, 'MIT', true, 'Open Source', 'The framework is free and self-hostable.', true, false),
  ('hono', 'Hono', 'A small web framework designed for multiple JavaScript runtimes.', 'Hono provides one compact API across edge, serverless, Bun, Deno, and Node.js environments.', 'Its portability gives teams room to change runtime without rewriting the HTTP layer.', '["Portable APIs across JavaScript runtimes","Edge and serverless handlers"]'::jsonb, '["Applications needing a large built-in enterprise framework"]'::jsonb, 'Framework', 'backend', true, 'MIT', true, 'Open Source', 'The framework is free and self-hostable; runtime costs vary.', false, true),
  ('flutter', 'Flutter', 'A multi-platform UI toolkit built around Dart.', 'Flutter ships a rendering and widget system for building mobile, web, and desktop experiences from one codebase.', 'It is one of the clearest options when visual consistency across platforms matters more than native UI reuse.', '["Cross-platform products with custom interfaces","Teams comfortable adopting Dart"]'::jsonb, '["Apps that must use each platform’s native UI controls throughout"]'::jsonb, 'Framework', 'mobile', true, 'BSD-3-Clause', true, 'Open Source', 'The SDK is free and open source.', true, false),
  ('expo', 'Expo', 'A React Native platform for building and shipping mobile apps.', 'Expo layers tooling, libraries, updates, and build services around React Native while keeping an open-source local workflow.', 'It reduces the amount of native build machinery teams must own at the beginning of a mobile project.', '["React teams shipping iOS and Android","Products that value managed builds and updates"]'::jsonb, '["Apps whose core work is deeply custom native platform code"]'::jsonb, 'Platform', 'mobile', true, 'MIT', true, 'Generous Free Tier', 'Open-source tooling can be self-hosted; hosted Expo Application Services has free and paid tiers.', true, false),
  ('opentofu', 'OpenTofu', 'An open-source infrastructure-as-code tool under the Linux Foundation.', 'OpenTofu is a community-governed Terraform-compatible workflow for declarative infrastructure management.', 'It gives infrastructure teams a vendor-neutral path with a familiar configuration model.', '["Teams standardizing declarative cloud infrastructure","Organizations prioritizing open governance"]'::jsonb, '["Infrastructure that is better expressed through an imperative SDK"]'::jsonb, 'CLI', 'devops', true, 'MPL-2.0', true, 'Open Source', 'The CLI is free and self-hostable.', true, false),
  ('kubernetes', 'Kubernetes', 'A system for automating deployment and operation of containerized applications.', 'Kubernetes provides a common control plane for scheduling, networking, configuration, and resilience across clusters.', 'It remains the central interoperability layer for teams that genuinely need a programmable container platform.', '["Multi-service platforms with dedicated operations capacity","Workloads requiring portable orchestration"]'::jsonb, '["Small products without staff to operate a cluster"]'::jsonb, 'Platform', 'devops', true, 'Apache-2.0', true, 'Open Source', 'The software is free; cluster infrastructure and managed services carry costs.', false, false),
  ('opentelemetry', 'OpenTelemetry', 'A vendor-neutral standard and toolkit for telemetry data.', 'OpenTelemetry supplies APIs, SDKs, semantic conventions, and a collector for traces, metrics, and logs.', 'It separates application instrumentation from the observability backend selected later.', '["Teams that want portable instrumentation","Services adopting distributed tracing"]'::jsonb, '["Teams seeking a complete hosted monitoring product by itself"]'::jsonb, 'Toolkit', 'observability', true, 'Apache-2.0', true, 'Open Source', 'The project is free and self-hostable; storage and analysis backends may cost money.', true, false),
  ('grafana', 'Grafana', 'A visualization platform for metrics, logs, traces, and other operational data.', 'Grafana combines open-source dashboards with a hosted service and integrations across common telemetry stores.', 'It provides a familiar operational surface without forcing teams into one telemetry database.', '["Teams combining several observability data sources","Operational dashboards and investigation"]'::jsonb, '["Teams wanting instrumentation collection without configuring data sources"]'::jsonb, 'Platform', 'observability', true, 'AGPL-3.0', true, 'Generous Free Tier', 'Grafana OSS is self-hostable; Grafana Cloud offers free and paid plans.', true, false),
  ('langchain', 'LangChain', 'An open-source framework for applications built around language models.', 'LangChain provides model integrations and composable application patterns across Python and JavaScript ecosystems.', 'Its broad integration surface makes it useful for evaluating and assembling changing AI application components.', '["AI applications that need many provider integrations","Teams prototyping agent and retrieval workflows"]'::jsonb, '["Small model calls where a provider SDK is sufficient"]'::jsonb, 'Framework', 'ai-tools', true, 'MIT', true, 'Open Source', 'Core libraries are free and self-hostable; related hosted services have separate plans.', false, false),
  ('ollama', 'Ollama', 'A local runtime and CLI for running open models.', 'Ollama packages model acquisition and local inference behind a straightforward command-line and HTTP interface.', 'It makes local model experiments accessible without requiring teams to assemble the runtime layer first.', '["Local model development and privacy-sensitive prototypes","Developers exploring models on their own hardware"]'::jsonb, '["Production inference that needs managed scaling across many machines"]'::jsonb, 'Runtime', 'ai-tools', true, 'MIT', true, 'Open Source', 'The local runtime is free and open source; hardware remains the user’s responsibility.', true, true)
)
INSERT INTO "projects" ("slug", "name", "short_description", "editorial_description", "why_interesting", "best_for", "not_ideal_for", "project_type", "category_id", "status", "open_source", "license", "self_hostable", "pricing_label", "pricing_summary", "recommended", "worth_watching", "reviewed_at", "published_at")
SELECT seed."slug", seed."name", seed."short_description", seed."editorial_description", seed."why_interesting", seed."best_for", seed."not_ideal_for", seed."project_type", categories."id", 'published', seed."open_source", seed."license", seed."self_hostable", seed."pricing_label", seed."pricing_summary", seed."recommended", seed."worth_watching", '2026-09-04T00:00:00Z'::timestamptz, '2026-09-04T00:00:00Z'::timestamptz
FROM seed JOIN "categories" ON categories."slug" = seed."category_slug"
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
WITH links("slug", "website", "docs", "repository") AS (VALUES
  ('react', 'https://react.dev', 'https://react.dev/learn', 'https://github.com/facebook/react'),
  ('svelte', 'https://svelte.dev', 'https://svelte.dev/docs', 'https://github.com/sveltejs/svelte'),
  ('fastify', 'https://fastify.dev', 'https://fastify.dev/docs/latest/', 'https://github.com/fastify/fastify'),
  ('hono', 'https://hono.dev', 'https://hono.dev/docs/', 'https://github.com/honojs/hono'),
  ('flutter', 'https://flutter.dev', 'https://docs.flutter.dev', 'https://github.com/flutter/flutter'),
  ('expo', 'https://expo.dev', 'https://docs.expo.dev', 'https://github.com/expo/expo'),
  ('opentofu', 'https://opentofu.org', 'https://opentofu.org/docs/', 'https://github.com/opentofu/opentofu'),
  ('kubernetes', 'https://kubernetes.io', 'https://kubernetes.io/docs/', 'https://github.com/kubernetes/kubernetes'),
  ('opentelemetry', 'https://opentelemetry.io', 'https://opentelemetry.io/docs/', 'https://github.com/open-telemetry/opentelemetry-specification'),
  ('grafana', 'https://grafana.com/oss/grafana/', 'https://grafana.com/docs/grafana/latest/', 'https://github.com/grafana/grafana'),
  ('langchain', 'https://www.langchain.com', 'https://docs.langchain.com', 'https://github.com/langchain-ai/langchain'),
  ('ollama', 'https://ollama.com', 'https://github.com/ollama/ollama/tree/main/docs', 'https://github.com/ollama/ollama')
), expanded AS (
  SELECT "slug", 'website' AS "kind", "website" AS "url" FROM links UNION ALL
  SELECT "slug", 'documentation', "docs" FROM links UNION ALL
  SELECT "slug", 'repository', "repository" FROM links
)
INSERT INTO "project_links" ("project_id", "kind", "url", "last_successful_check_at")
SELECT projects."id", expanded."kind", expanded."url", '2026-09-04T00:00:00Z'::timestamptz
FROM expanded JOIN "projects" ON projects."slug" = expanded."slug"
ON CONFLICT ("project_id", "kind") DO NOTHING;
--> statement-breakpoint
INSERT INTO "project_sources" ("project_id", "claim", "source_type", "url", "checked_at", "checked_by")
SELECT projects."id", 'Canonical project facts and open-source license', 'maintainer', project_links."url", '2026-09-04T00:00:00Z'::timestamptz, 'HowToBuild.dev editorial'
FROM "projects" JOIN "project_links" ON project_links."project_id" = projects."id" AND project_links."kind" = 'repository'
WHERE projects."slug" IN ('react','svelte','fastify','hono','flutter','expo','opentofu','kubernetes','opentelemetry','grafana','langchain','ollama');
--> statement-breakpoint
WITH pricing_sources("slug", "url") AS (VALUES
  ('expo', 'https://expo.dev/pricing'),
  ('grafana', 'https://grafana.com/pricing/'),
  ('langchain', 'https://www.langchain.com/pricing')
)
INSERT INTO "project_sources" ("project_id", "claim", "source_type", "url", "checked_at", "checked_by")
SELECT projects."id", 'Hosted-service pricing classification', 'maintainer', pricing_sources."url", '2026-09-04T00:00:00Z'::timestamptz, 'HowToBuild.dev editorial'
FROM pricing_sources JOIN "projects" ON projects."slug" = pricing_sources."slug";
--> statement-breakpoint
WITH pricing_links("slug", "url") AS (VALUES
  ('expo', 'https://expo.dev/pricing'),
  ('grafana', 'https://grafana.com/pricing/'),
  ('langchain', 'https://www.langchain.com/pricing')
)
INSERT INTO "project_links" ("project_id", "kind", "url", "last_successful_check_at")
SELECT projects."id", 'pricing', pricing_links."url", '2026-09-04T00:00:00Z'::timestamptz
FROM pricing_links JOIN "projects" ON projects."slug" = pricing_links."slug"
ON CONFLICT ("project_id", "kind") DO NOTHING;
