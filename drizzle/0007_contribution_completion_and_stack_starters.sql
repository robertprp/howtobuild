ALTER TABLE "project_momentum" ADD COLUMN "seven_week_snapshot_id" uuid;--> statement-breakpoint
ALTER TABLE "project_momentum" ADD COLUMN "absolute_49d" integer;--> statement-breakpoint
ALTER TABLE "project_momentum" ADD COLUMN "relative_49d" real;--> statement-breakpoint
ALTER TABLE "project_momentum" ADD COLUMN "weekly_window_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_momentum" ADD COLUMN "monthly_window_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_momentum" ADD COLUMN "seven_week_window_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stacks" ADD COLUMN "starter_options" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "project_momentum" ADD CONSTRAINT "project_momentum_seven_week_snapshot_id_github_snapshots_id_fk" FOREIGN KEY ("seven_week_snapshot_id") REFERENCES "public"."github_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Reviewed integration options, not unpublished catalog entries. Only offered
-- while the selected application framework is Next.js.
UPDATE "stacks" SET "starter_options" = '[
  {
    "id": "better-auth", "name": "Better Auth", "responsibility": "Authentication",
    "integration": "Application-owned authentication. Mount the Next.js App Router auth handler, configure a supported database adapter, and validate sessions on the server. Use nextCookies last in the plugin list if Server Actions set cookies.",
    "cost": "Open-source core; you operate the database, email delivery, and authentication infrastructure.",
    "sourceUrl": "https://better-auth.com/docs/integrations/next", "checkedAt": "2026-09-05", "requiresProject": "nextjs"
  },
  {
    "id": "clerk", "name": "Clerk", "responsibility": "Authentication",
    "integration": "Managed identity with the Next.js SDK and ClerkProvider. Follow the current App Router guide for middleware/proxy and server-side route protection. Keep application data in the selected database, keyed by the Clerk user ID. Request approval before creating or linking a hosted app.",
    "cost": "Hosted service with free and paid tiers; verify current quotas and feature pricing at https://clerk.com/pricing.",
    "sourceUrl": "https://clerk.com/docs/nextjs/getting-started/quickstart", "checkedAt": "2026-09-05", "requiresProject": "nextjs"
  },
  {
    "id": "shadcn-ui", "name": "shadcn/ui + Tailwind CSS", "responsibility": "Styling",
    "integration": "Add editable React component source using the official Next.js setup. Use Tailwind CSS and shared CSS-variable design tokens. Keep interactive components at client boundaries and preserve keyboard and screen-reader behavior when customizing.",
    "cost": "Open-source components and styling; your team owns customization and upgrades.",
    "sourceUrl": "https://ui.shadcn.com/docs/installation/next", "checkedAt": "2026-09-05", "requiresProject": "nextjs"
  },
  {
    "id": "mantine", "name": "Mantine", "responsibility": "Styling",
    "integration": "Use Mantine components and its theme system. Follow the Next.js guide for stylesheet imports, MantineProvider, and ColorSchemeScript; respect client component boundaries. Tailwind is not required for this choice.",
    "cost": "Open-source component library; your team maintains theme and package upgrades.",
    "sourceUrl": "https://mantine.dev/guides/next/", "checkedAt": "2026-09-05", "requiresProject": "nextjs"
  }
]'::jsonb WHERE "slug" IN ('modern-typescript-saas', 'ai-saas');
