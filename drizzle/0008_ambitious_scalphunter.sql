CREATE TABLE "link_checks" (
	"url_hash" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"status" text NOT NULL,
	"http_status" integer,
	"detail" text NOT NULL,
	"checked_at" timestamp with time zone NOT NULL
);
