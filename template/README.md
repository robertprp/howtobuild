# Resend template setup

Create or update the published Resend template with the alias `how-to-build-generic`, then paste the contents of `generic.html` into its HTML editor.

Define these string variables in Resend:

- `TITLE`
- `PREHEADER`
- `INTRO`
- `CODE_LABEL`
- `CODE`
- `FOOTER`

The application supplies every variable from `src/lib/email.server.ts`. Resend replaces variables using the `{{{VARIABLE}}}` syntax in the HTML file.

The email mark loads from `https://howtobuild.dev/assets/howtobuild-mark.png`. Confirm that URL is publicly reachable in the deployed environment before sending production mail. The text wordmark remains visible when an email client blocks remote images.
