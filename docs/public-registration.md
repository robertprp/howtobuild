# Public registration

Updated 6 September 2026. Anyone can create a community account through a configured GitHub, Google, or email-code method at `/sign-in`. Registration and returning-user sign-in share the same flow; no separate password or invitation is required.

The backend already permitted community registration. This change makes signup explicit (`disableSignUp: false`, plus `disableImplicitSignUp: false` for social providers), updates the page to explain automatic account creation, and corrects the obsolete invite-only registration instruction in the Phase 1 runbook.

## Permissions remain separate

- Verified community users can use the existing contribution/account features.
- Email verification, OTP expiration/attempt limits, send quotas, authentication rate limits and safe return-path validation remain intact.
- Creating an account does not create an editor/admin role. The existing server-side editorial authorization and editor invitation tooling remain available only for assigning privileged access.
- There is no schema change, migration, new database, or new provider requirement. Existing OAuth and Resend configuration still applies. Deploy the updated application to change production behavior and copy.

## Verification

Run the existing typecheck, lint, test suite and production build. Verify the public sign-in page explains registration, presents only configured methods as enabled, and preserves OTP and OAuth flows.

Before production signoff, use an owner-approved fresh identity without an editorial invitation to complete email/OAuth registration, reach `/account`, and confirm editorial/preview access is denied. Do not fabricate provider sessions or grant a role merely to bypass the check. This real-account check requires email or provider interaction and is distinct from the automated build checks.
