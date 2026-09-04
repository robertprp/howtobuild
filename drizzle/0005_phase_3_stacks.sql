CREATE TABLE "stack_alternatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stack_item_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"rationale" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stack_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stack_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"responsibility" text NOT NULL,
	"rationale" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stack_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stack_id" uuid NOT NULL,
	"claim" text NOT NULL,
	"url" text NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"checked_by" text
);
--> statement-breakpoint
CREATE TABLE "stacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"target_user" text NOT NULL,
	"early_stage_fit" text NOT NULL,
	"open_source_summary" text NOT NULL,
	"cost_summary" text NOT NULL,
	"tradeoffs" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "stacks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stack_alternatives" ADD CONSTRAINT "stack_alternatives_stack_item_id_stack_items_id_fk" FOREIGN KEY ("stack_item_id") REFERENCES "public"."stack_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_alternatives" ADD CONSTRAINT "stack_alternatives_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_items" ADD CONSTRAINT "stack_items_stack_id_stacks_id_fk" FOREIGN KEY ("stack_id") REFERENCES "public"."stacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_items" ADD CONSTRAINT "stack_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_sources" ADD CONSTRAINT "stack_sources_stack_id_stacks_id_fk" FOREIGN KEY ("stack_id") REFERENCES "public"."stacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stacks" ADD CONSTRAINT "stacks_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stacks" ADD CONSTRAINT "stacks_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stack_alternative_item_project_idx" ON "stack_alternatives" USING btree ("stack_item_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stack_item_responsibility_idx" ON "stack_items" USING btree ("stack_id","responsibility");--> statement-breakpoint
CREATE INDEX "stack_item_project_idx" ON "stack_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "stack_status_name_idx" ON "stacks" USING btree ("status","name");
--> statement-breakpoint
ALTER TABLE "stacks" ADD COLUMN "search_document" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english'::regconfig, coalesce("name", '')), 'A') ||
  setweight(to_tsvector('english'::regconfig, coalesce("summary", '') || ' ' || coalesce("target_user", '') || ' ' || coalesce("early_stage_fit", '')), 'B') ||
  setweight(to_tsvector('english'::regconfig, coalesce("description", '') || ' ' || coalesce("open_source_summary", '') || ' ' || coalesce("cost_summary", '')), 'C')
) STORED;
--> statement-breakpoint
CREATE INDEX "stacks_search_document_idx" ON "stacks" USING gin ("search_document");
--> statement-breakpoint
INSERT INTO "stacks" ("slug","name","summary","description","target_user","early_stage_fit","open_source_summary","cost_summary","tradeoffs","status","published_at","updated_at") VALUES
('modern-typescript-saas','Modern TypeScript SaaS','A cohesive TypeScript web stack for shipping a subscription product with managed infrastructure.','Use an integrated React framework for the product surface, PostgreSQL for durable application data, application-owned authentication, utility-first styling, managed deployment, and focused error monitoring. The choices optimize for one language across the application and fast feedback from preview to production.','Small TypeScript product teams that want strong defaults and limited infrastructure work.','Excellent for bootstrapping','Five of the six recommended components are source-available under established open-source licenses; Vercel is the managed deployment layer.','The core software is free to adopt. Hosting, email, database capacity, and monitoring move to paid usage as the product grows.','["The framework and hosting platform are closely aligned, which increases platform coupling.","Application-owned authentication gives control but also leaves security operations with the product team.","This stack favors TypeScript breadth over specialized backend languages."]'::jsonb,'published','2026-09-04T00:00:00Z','2026-09-04T00:00:00Z'),
('open-source-saas','Open-Source SaaS','A self-hostable product stack that keeps every critical runtime component under team control.','Combine a content-efficient web framework, a compact TypeScript API, PostgreSQL, application-owned authentication, containers, and an integrated OpenTelemetry-native observability backend. The stack is designed to remain portable across infrastructure providers.','Teams with operational capacity that value portability, inspectable systems, and a credible self-hosting path.','Optimized for self-hosting','Every selected component is open source and can run on infrastructure controlled by the team. Individual licenses and trademark terms still need review before redistribution.','There are no mandatory software subscription fees, but compute, storage, email delivery, backups, and the labor of operating the stack are real costs.','["Owning the runtime means owning upgrades, backups, incident response, and capacity planning.","Astro and a separate API create a clearer boundary but more deployment topology than one full-stack framework.","Self-hosting is not automatically cheaper once operational time is counted."]'::jsonb,'published','2026-09-04T00:00:00Z','2026-09-04T00:00:00Z'),
('ai-saas','AI SaaS','A TypeScript-first application stack for streamed model features, retrieval, and an optional self-hosted inference path.','Start with a server-rendered product shell and provider-neutral AI SDK, add retrieval only when the product has a real data-grounding requirement, keep product state in PostgreSQL, and use a dedicated model server only when operating open models is justified.','Product teams building an AI feature or vertical AI application that need a pragmatic route from hosted APIs to owned model infrastructure.','Good for startups','The application framework, AI libraries, database, and model server are open source. Model providers and the selected deployment and monitoring services may be proprietary.','Early prototypes can use free tiers, but model tokens, vector or relational storage, GPU inference, observability, and abuse controls become usage-sensitive costs.','["AI model cost and latency remain product constraints no framework removes.","A retrieval framework is unnecessary complexity for features that do not need grounded private data.","Self-hosted inference requires GPU operations expertise and should not be adopted by default."]'::jsonb,'published','2026-09-04T00:00:00Z','2026-09-04T00:00:00Z'),
('modern-observability','Modern Observability','A portable telemetry pipeline for metrics, logs, traces, visualization, and application errors.','Instrument services with OpenTelemetry, retain focused stores for metrics, logs, and traces, investigate them through Grafana, and keep product-facing exception triage in Sentry. This separates portable instrumentation from storage and incident workflows.','Teams operating production services that want open telemetry standards and control over their storage backends.','Optimized for scale','The instrumentation and core telemetry backends are open source and self-hostable. Sentry has source-available components and a managed cloud option with separate terms.','Software can be self-hosted, but telemetry storage, retention, high-cardinality data, on-call operations, and managed alternatives can become substantial costs.','["Several specialized backends create more operational work than a unified managed platform.","Cross-signal correlation requires disciplined resource attributes and configuration.","High-cardinality telemetry can create unpredictable storage and query costs."]'::jsonb,'published','2026-09-04T00:00:00Z','2026-09-04T00:00:00Z')
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
WITH choices("stack_slug","project_slug","responsibility","rationale","sort_order") AS (VALUES
('modern-typescript-saas','nextjs','Application framework','Next.js supplies React rendering, routing, server behavior, and production-oriented conventions in one TypeScript application boundary.',1),
('modern-typescript-saas','postgresql','Database','PostgreSQL is a durable relational default with strong constraints, transactions, indexing, and a broad managed-hosting ecosystem.',2),
('modern-typescript-saas','better-auth','Authentication','Better Auth keeps sessions and account data in the application database while supplying typed integrations and extensible flows.',3),
('modern-typescript-saas','tailwind-css','Styling','Tailwind CSS gives a small product team a constrained styling vocabulary without requiring a separate component runtime.',4),
('modern-typescript-saas','vercel','Deployment','Vercel minimizes early deployment work for preview environments and globally delivered web applications.',5),
('modern-typescript-saas','sentry','Error monitoring','Sentry turns releases and application exceptions into an actionable product-engineering workflow.',6),
('open-source-saas','astro','Web application','Astro keeps browser JavaScript deliberate and works well for product surfaces with substantial content and selective interactivity.',1),
('open-source-saas','fastify','API layer','Fastify provides a focused Node.js HTTP foundation with a mature plugin model and low framework overhead.',2),
('open-source-saas','postgresql','Database','PostgreSQL keeps transactional product data portable and independently operable.',3),
('open-source-saas','better-auth','Authentication','Better Auth provides application-owned identity without requiring a proprietary identity service.',4),
('open-source-saas','docker','Packaging and deployment','OCI containers make the runtime explicit and portable across a wide range of infrastructure.',5),
('open-source-saas','signoz','Observability','SigNoz offers one self-hostable surface for OpenTelemetry traces, metrics, logs, and alerts.',6),
('ai-saas','nextjs','Application framework','Next.js provides the server-rendered React surface and server boundary for streaming model interactions.',1),
('ai-saas','ai-sdk','Model integration','AI SDK offers typed, provider-neutral streaming, structured output, and tool-call primitives for TypeScript products.',2),
('ai-saas','llamaindex','Retrieval layer','LlamaIndex adds ingestion and retrieval workflows when model responses must be grounded in product or customer data.',3),
('ai-saas','postgresql','Application data','PostgreSQL remains the system of record for users, entitlements, jobs, and auditable product state.',4),
('ai-saas','vllm','Open-model serving','vLLM is the scale-oriented option when the team has evidence that operating open models is worth the GPU complexity.',5),
('ai-saas','sentry','Error monitoring','Sentry captures failures around model calls, streaming boundaries, and the rest of the application release.',6),
('modern-observability','opentelemetry','Instrumentation','OpenTelemetry keeps traces, metrics, and logs portable at the collection boundary.',1),
('modern-observability','prometheus','Metrics','Prometheus supplies the established labeled time-series model and alert-rule ecosystem.',2),
('modern-observability','loki','Logs','Loki keeps log indexing focused on labels and integrates directly with Grafana workflows.',3),
('modern-observability','jaeger','Traces','Jaeger provides a focused backend and investigation surface for distributed traces.',4),
('modern-observability','grafana','Visualization','Grafana gives operators one dashboard and exploration surface across the selected telemetry stores.',5),
('modern-observability','sentry','Application errors','Sentry complements infrastructure telemetry with release-aware exception grouping and user-impact context.',6)
)
INSERT INTO "stack_items" ("stack_id","project_id","responsibility","rationale","sort_order")
SELECT stacks."id", projects."id", choices."responsibility", choices."rationale", choices."sort_order"
FROM choices JOIN stacks ON stacks."slug"=choices."stack_slug" JOIN projects ON projects."slug"=choices."project_slug"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
WITH alternatives("stack_slug","responsibility","project_slug","rationale") AS (VALUES
('modern-typescript-saas','Application framework','astro','Choose Astro when content delivery matters more than a uniformly interactive React application.'),
('modern-typescript-saas','Deployment','docker','Choose containers when deployment portability matters more than a tightly integrated managed workflow.'),
('open-source-saas','Web application','nextjs','Choose Next.js when the product needs a more integrated, React-centered full-stack model.'),
('open-source-saas','Observability','prometheus','Choose Prometheus first when metrics and alerting are the immediate need and an integrated platform is premature.'),
('ai-saas','Retrieval layer','postgresql','Use PostgreSQL directly when modest retrieval needs do not justify a separate framework.'),
('ai-saas','Open-model serving','vercel','Stay with hosted model APIs and managed deployment when GPU operations are not a product advantage.'),
('modern-observability','Traces','signoz','Choose SigNoz when one integrated OpenTelemetry backend is preferable to several specialized stores.'),
('modern-observability','Application errors','signoz','Use the integrated platform when reducing tool count matters more than Sentry''s focused exception workflow.')
)
INSERT INTO "stack_alternatives" ("stack_item_id","project_id","rationale")
SELECT stack_items."id", projects."id", alternatives."rationale" FROM alternatives
JOIN stacks ON stacks."slug"=alternatives."stack_slug"
JOIN stack_items ON stack_items."stack_id"=stacks."id" AND stack_items."responsibility"=alternatives."responsibility"
JOIN projects ON projects."slug"=alternatives."project_slug"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
WITH sources("stack_slug","claim","url") AS (VALUES
('modern-typescript-saas','Framework capabilities and deployment model','https://nextjs.org/docs'),
('modern-typescript-saas','Authentication architecture and supported database adapters','https://www.better-auth.com/docs'),
('open-source-saas','Astro rendering and islands architecture','https://docs.astro.build/en/concepts/islands/'),
('open-source-saas','OpenTelemetry-native observability platform capabilities','https://signoz.io/docs/'),
('ai-saas','Provider-neutral streaming and tool integration capabilities','https://ai-sdk.dev/docs'),
('ai-saas','High-throughput open-model serving characteristics','https://docs.vllm.ai/en/latest/'),
('modern-observability','Vendor-neutral telemetry signals and collector model','https://opentelemetry.io/docs/'),
('modern-observability','Prometheus metrics and alerting model','https://prometheus.io/docs/introduction/overview/')
)
INSERT INTO "stack_sources" ("stack_id","claim","url","checked_at","checked_by")
SELECT stacks."id",sources."claim",sources."url",'2026-09-04T00:00:00Z','HowToBuild.dev editorial'
FROM sources JOIN stacks ON stacks."slug"=sources."stack_slug";
