# Stack starter choices

Reviewed September 5, 2026. These notes support the extra options for the two Next.js SaaS stacks. A choice is an integration recommendation, not a promise that every combination of catalog alternatives has been verified.

## Framework and language

React is the UI library; Next.js App Router provides the full-stack framework boundary. The generated Next.js brief explicitly requests TypeScript and React, instead of incorrectly treating TypeScript or React as interchangeable with a framework. React's documentation recommends starting new apps with a framework. [React: creating an app](https://react.dev/learn/creating-a-react-app).

## Authentication

- Better Auth: application-owned identity and sessions, with a supported database adapter and a server-mounted Next.js handler. Its `nextCookies` plugin belongs last when Server Actions need to set cookies. This leaves database/email operation with the team. [Next.js integration](https://better-auth.com/docs/integrations/next), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle).
- Clerk: managed identity through its Next.js SDK. Follow the current App Router integration for provider setup and server-side protection; keep domain data in the selected application database. Hosted app creation requires user approval in our prompt. [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart). Costs vary by usage/features, so the UI links to [current pricing](https://clerk.com/pricing) without embedding quota promises.

Choose one auth provider, not both. Switching to Clerk changes identity ownership; it does not remove the product's application database.

## Styling and components

- Tailwind CSS is the existing utility-styling choice in the TypeScript stack. shadcn/ui is an additional component-source option built with a Tailwind-based setup, so the selector labels it “shadcn/ui + Tailwind CSS.” The generated brief includes shared design tokens and accessible interactions. [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next).
- Mantine is a component library with its own theme/provider and CSS setup. Its Next.js guide covers stylesheets, MantineProvider, and ColorSchemeScript. It does not require Tailwind; the prompt does not install both styling approaches by default. [Mantine Next.js guide](https://mantine.dev/guides/next/).

## Product decisions derived from the sources

Supplemental integration notes are restricted to the selected Next.js framework. They disappear when another framework is chosen, rather than exporting mismatched Next.js instructions. Original editorial alternatives remain available on all stacks. The dark prompt panel uses the existing website fonts, colors, and Lucide icons; no new runtime UI framework was installed. All generated prompts include source URLs, safe secret handling, server-side authorization when auth is chosen, and a request to recheck current installation guidance before building.
