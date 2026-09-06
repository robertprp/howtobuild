# Admin access and community reviews

Register normally and verify your email first. Registration alone never grants editorial access.

From the application directory, grant access to an existing account:

```sh
pnpm admin:grant --email person@example.com
# Or select the exact Better Auth user ID (not a provider account ID):
pnpm admin:grant --user-id ACCOUNT_ID
```

The command loads `.env` when present; an already exported `DATABASE_URL` takes precedence. Confirm it points to the intended environment before running. Run only from a trusted machine with database access. It updates the existing role to `admin`, is safe to repeat, and does not create accounts, send invitations, or run migrations. Unknown, ambiguous, and unverified accounts are rejected. No migration is needed for this dashboard or command.

Sign in as that account and open `/admin/submissions` (also linked from `/admin`). Roles are checked on each server request, so no redeployment is required after granting access. Existing explicitly authorized editors retain review access.

The dashboard provides status totals, search by project/repository/contributor, category and status filters, oldest/newest ordering, ten projects per page, decision notes, and dated review history. Pagination is currently client-side over the protected moderation queue. Edit suggestions and abuse reports remain available below the project queue.

Use **under review**, **changes requested**, **approved**, or **rejected** as available for the current state. A decision note is required. Approval is not publication: prepare the editorial draft, verify its sources and content, then publish through the project editor. Contributors can respond to change requests through their account.

The legacy `editor:invite` command remains available for the existing editorial invitation workflow; `admin:grant` grants directly to an existing verified account without an invitation.
