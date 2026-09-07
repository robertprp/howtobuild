# Security

Never include credentials, database URLs with real passwords, `.env` files, or raw log exports in commits or public issues. `.env.example` must contain only placeholders and empty secret values. Anything prefixed with `VITE_` is public browser configuration.

## Check changes

Install [Gitleaks](https://github.com/gitleaks/gitleaks) (on macOS: `brew install gitleaks`), then run:

```sh
pnpm security:staged # scan staged changes before committing
pnpm security:scan   # scan all locally available branch history
```

The Secret scan workflow checks pushes and pull requests with redacted output. It does not prevent a secret from being pushed in the first place. Enable GitHub secret scanning and push protection, and require the scan check in branch protection. Scanners cannot guarantee every credential will be detected.

## If a credential is exposed

1. Revoke or rotate it at its provider immediately, even if it has since been deleted from a file. Update local and deployed configuration, and review access logs.
2. Coordinate application-secret changes with deployment. Changing `BETTER_AUTH_SECRET` can invalidate sessions; update `CRON_SECRET` in every scheduler and application environment together.
3. Clean every affected branch and tag using GitHub's [sensitive-data removal procedure](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository). Coordinate rewritten history with collaborators; do not merge old history back in.
4. Contact GitHub Support for affected pull-request refs and cached views. Forks and existing clones may retain copies, so history cleanup is not a substitute for rotation.

Report vulnerabilities through the repository's private vulnerability reporting feature when enabled. Do not post live credentials or exploit details in public issues. If private reporting is unavailable, ask the maintainer for a private channel without disclosing sensitive details.
