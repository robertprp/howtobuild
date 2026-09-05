export type BuildGuide = {
  slug: string
  title: string
  description: string
  updatedAt: string
  answer: string
  sections: {
    id: string
    title: string
    paragraphs: string[]
    checklist?: string[]
  }[]
  stacks: { name: string; path: string }[]
  sources: { name: string; url: string }[]
}

export const buildGuides: BuildGuide[] = [
  {
    slug: 'how-to-choose-a-tech-stack',
    title: 'What tech stack should you use for your app?',
    description:
      'Choose a tech stack by product needs, team skills, ownership, and cost. Compare practical starting points for SaaS, content sites, and AI apps.',
    updatedAt: '2026-09-05',
    answer:
      'Choose the smallest stack that can deliver your core user journey and that your team can maintain. Start with the product, choose one tool for each responsibility, and compare operating costs before committing to a framework.',
    sections: [
      {
        id: 'start-with-the-product',
        title: 'Start with what you are building',
        paragraphs: [
          'A tech stack is the set of technologies that run your product: its interface, server behavior, database, authentication, deployment, and monitoring. A language is only one part. TypeScript is a language, React is a UI library, and Next.js is a framework that supplies application structure around React.',
          'Write one sentence describing the main user journey before selecting tools. A public documentation site mostly needs readable pages and a publishing workflow. A subscription app needs accounts, protected data, and entitlement checks. An AI assistant adds model requests, usage budgets, and a way to evaluate answers. These are different requirements, even when their homepages look similar.',
        ],
        checklist: [
          'Who is the first user, and what can they accomplish?',
          'Which data must be private, shared, searchable, or retained?',
          'Does the product need background jobs, real-time updates, or offline use?',
          'Who will respond when a provider or deployment fails?',
        ],
      },
      {
        id: 'choose-by-responsibility',
        title: 'Choose one tool for each job',
        paragraphs: [
          'Separate your choices into application framework, data storage, authentication, styling, deployment, and observability. This prevents comparing unrelated tools: Clerk and Better Auth address identity, while shadcn/ui and Mantine address interface components. Neither choice replaces the application framework.',
          'Our TypeScript SaaS starting point uses Next.js, PostgreSQL, Better Auth, and Tailwind CSS. It is an editorial default for a small TypeScript team, not a universal winner. A content-heavy site may benefit more from a content-oriented framework; a team with an established backend should usually evaluate keeping it before introducing another language or service.',
        ],
      },
      {
        id: 'compare-ownership-and-cost',
        title: 'Compare ownership and the cost of operating it',
        paragraphs: [
          'Open-source software and a free hosted plan describe different things. An application-owned auth library leaves database, email delivery, upgrades, and incident response with your team. Managed identity moves some operations to a provider but introduces its pricing, availability, and migration boundaries.',
          'Create a rough monthly budget for compute, database, storage, email, monitoring, and any model usage. Record what happens when a free tier is exceeded, and include the engineering time required to operate self-hosted components. Do not choose a stack on a pricing headline alone.',
        ],
      },
      {
        id: 'validate-one-slice',
        title: 'Validate the stack with one complete slice',
        paragraphs: [
          'Before expanding the architecture, build a small end-to-end workflow: sign in, create a record, enforce ownership on the server, and recover gracefully from a failed request. Deploy to a controlled preview only when you are ready to configure the required services. Record setup steps and recovery commands.',
          'Use a stack page to inspect alternatives and customize its starter prompt. Tell your coding assistant what the product does and which constraints are non-negotiable. A copied prompt is a starting brief, not proof that the resulting application is secure or production-ready.',
        ],
        checklist: [
          'Can the team explain each component and remove unnecessary ones?',
          'Are protected operations checked on the server?',
          'Are migration, backup, and rollback responsibilities documented?',
          'Can the same setup be reproduced without secrets in source control?',
        ],
      },
    ],
    stacks: [
      {
        name: 'Modern TypeScript SaaS stack',
        path: '/stacks/modern-typescript-saas',
      },
      { name: 'Open-source SaaS stack', path: '/stacks/open-source-saas' },
      { name: 'AI SaaS stack', path: '/stacks/ai-saas' },
    ],
    sources: [
      {
        name: 'React: creating an app and choosing a framework',
        url: 'https://react.dev/learn/creating-a-react-app',
      },
      {
        name: 'Next.js: authentication and authorization boundaries',
        url: 'https://nextjs.org/docs/app/guides/authentication',
      },
    ],
  },
  {
    slug: 'how-to-build-a-saas-app',
    title: 'How to build a SaaS app: choose the stack and first workflow',
    description:
      'Plan a SaaS app with a practical TypeScript stack, authentication, tenant data, billing boundaries, and a copyable starter prompt.',
    updatedAt: '2026-09-05',
    answer:
      'Start with one useful workflow for one customer, then add accounts, server-side data access, and a clear ownership model. Choose billing and infrastructure around that workflow rather than building every SaaS feature before validating the product.',
    sections: [
      {
        id: 'define-the-first-workflow',
        title: 'Define a small first release',
        paragraphs: [
          'Pick an observable outcome: a customer signs in, creates a project, invites a colleague if collaboration is essential, and completes the main task. Write down what is deliberately excluded. A large admin console, multiple paid plans, and a complex permission hierarchy do not belong in the first release unless the user journey requires them.',
          'Separate the product data from identity records. For a team-based product, decide whether a record belongs to a user or to an organization. Make that decision before designing API handlers: retrofitting tenant ownership into already-shared data is harder than expressing it in the first data model.',
        ],
      },
      {
        id: 'select-a-starting-stack',
        title: 'Select a starting stack you can operate',
        paragraphs: [
          'For a TypeScript team, our SaaS stack combines a Next.js React application, PostgreSQL for relational data, an authentication choice, and a styling choice. Next.js is the application framework; React supplies UI components. Keeping these roles explicit makes substitutions easier to reason about.',
          'Choose Better Auth when you want application-owned identity and can operate its supporting infrastructure. Choose Clerk when managed identity is a better fit for the team. For styling, Tailwind provides utilities, shadcn/ui adds editable component source with a Tailwind setup, and Mantine provides its own component and theme system. The stack starter lets you select these alternatives without silently including both auth providers.',
        ],
      },
      {
        id: 'protect-data',
        title: 'Make data protection part of the first slice',
        paragraphs: [
          'A sign-in screen is not authorization. Check the session and the user’s permission to access a particular record inside the server operation. Do not rely on hiding a button, a client-supplied tenant ID, or a route redirect as the only protection for data.',
          'Implement sign-out, session expiry handling, and useful failures alongside the happy path. Keep secrets in server-side configuration. Document environment variables with placeholders, and apply database changes deliberately to the intended environment.',
        ],
        checklist: [
          'A signed-out request cannot read protected records.',
          'A signed-in user cannot read another customer’s records.',
          'Loading, empty, expired-session, and error states are usable.',
          'Logs avoid tokens, passwords, and sensitive customer content.',
        ],
      },
      {
        id: 'billing-and-operations',
        title: 'Add billing and operations deliberately',
        paragraphs: [
          'If the product charges customers, distinguish payment state from product entitlement. Decide what a customer can do during a trial, after cancellation, and when payment fails. Confirm the billing provider’s current event-verification and retry guidance before implementing its integration. The catalog stack is not a complete billing implementation.',
          'Before accepting real customer data, establish backups, recovery ownership, error monitoring, and an account-support path. Estimate database, email, storage, and hosting costs at the expected usage level. These operational decisions matter more than adding another library to the stack.',
        ],
      },
      {
        id: 'use-the-starter',
        title: 'Turn the plan into a build prompt',
        paragraphs: [
          'Open the TypeScript SaaS stack below, enter your product brief, and choose authentication and styling. Copy the generated prompt or download its Markdown file. Include the first workflow, tenant model, required integrations, and what should remain out of scope.',
          'Ask the coding assistant to inspect the repository’s rules and verify current official setup instructions before installing packages. Review its data-access boundaries and validation results before treating the implementation as ready for customers.',
        ],
      },
    ],
    stacks: [
      {
        name: 'Customize the TypeScript SaaS starter',
        path: '/stacks/modern-typescript-saas',
      },
      {
        name: 'Compare the open-source SaaS stack',
        path: '/stacks/open-source-saas',
      },
    ],
    sources: [
      {
        name: 'Next.js authentication guide',
        url: 'https://nextjs.org/docs/app/guides/authentication',
      },
      {
        name: 'Better Auth Next.js integration',
        url: 'https://better-auth.com/docs/integrations/next',
      },
      {
        name: 'Clerk Next.js integration',
        url: 'https://clerk.com/docs/nextjs/getting-started/quickstart',
      },
    ],
  },
  {
    slug: 'react-auth-and-styling-options',
    title: 'React stack choices: Better Auth or Clerk, shadcn/ui or Mantine?',
    description:
      'Understand authentication and styling choices for a React and Next.js stack: identity ownership, server protection, component customization, and costs.',
    updatedAt: '2026-09-05',
    answer:
      'Choose authentication by who should own and operate identity, and choose styling by how your team wants to build and maintain components. These are independent decisions: using Clerk does not require a particular component library, and using shadcn/ui does not provide authentication.',
    sections: [
      {
        id: 'react-and-frameworks',
        title: 'Start with the React framework boundary',
        paragraphs: [
          'React builds interfaces, but an application also needs routing, data access, deployment behavior, and authentication integration. React’s documentation recommends starting new applications with a framework. The options here are researched for Next.js App Router, the framework in our TypeScript SaaS stack.',
          'This is not a claim that the tools only work with Next.js. Their integrations differ across frameworks. If you change the framework, use its corresponding official integration guide instead of carrying over Next.js route handlers or provider setup unchanged.',
        ],
      },
      {
        id: 'better-auth-or-clerk',
        title: 'Better Auth or Clerk?',
        paragraphs: [
          'Better Auth is the application-owned path in this comparison. You configure authentication in your application and select a supported database adapter. In Next.js, its handler mounts in an App Router route. If Server Actions set cookies, the documented nextCookies plugin belongs last in the plugin list. Your team remains responsible for the surrounding infrastructure.',
          'Clerk is the managed-identity path. Its Next.js SDK integrates a provider, sign-in experiences, and server-side session helpers. Follow the current guide for middleware or proxy setup, then protect the actual data operation. Your domain database still needs an ownership relationship to the authenticated identity.',
          'Compare the flows you need—social sign-in, organization membership, account recovery, and session management—along with current provider pricing and migration requirements. Neither choice makes authorization automatic for every application query. Avoid running two identity systems for the same user flow unless you have a specific migration requirement.',
        ],
      },
      {
        id: 'shadcn-or-mantine',
        title: 'Tailwind, shadcn/ui, or Mantine?',
        paragraphs: [
          'Tailwind CSS is a styling utility system, not an authentication library or a complete set of application screens. The shadcn/ui option adds component source that you can customize in your repository, with a Tailwind-based setup. This is useful when owning component implementations and matching a detailed design system are important to the team.',
          'Mantine supplies a component library and theme system. Its Next.js setup includes stylesheets, MantineProvider, and ColorSchemeScript. Tailwind is not required for this choice. Evaluate whether maintaining editable component source or working within a library’s component API better matches your team’s workflow.',
          'With either approach, verify keyboard interaction, field labels, focus states, contrast, and mobile layouts in the finished interface. Accessible primitives are a starting point, not a guarantee after customization. Keep interactive components at the framework’s appropriate client boundaries.',
        ],
      },
      {
        id: 'combine-the-options',
        title: 'Combine the choices without mixing responsibilities',
        paragraphs: [
          'Two reasonable briefs are “Next.js + Better Auth + shadcn/ui” and “Next.js + Clerk + Mantine.” These describe ownership and UI preferences, not benchmark winners. Add your application database and deployment constraints to make either brief useful.',
          'Use the stack starter to select exactly one authentication provider and one styling approach. Its generated prompt includes integration notes, source links, and a requirement to verify package compatibility. Provider quotas and framework setup evolve, so confirm current documentation before implementing rather than copying a version-specific snippet from an old comparison.',
        ],
      },
    ],
    stacks: [
      {
        name: 'Choose auth and styling in the TypeScript stack',
        path: '/stacks/modern-typescript-saas',
      },
      {
        name: 'Choose auth and styling in the AI SaaS stack',
        path: '/stacks/ai-saas',
      },
    ],
    sources: [
      {
        name: 'React framework guidance',
        url: 'https://react.dev/learn/creating-a-react-app',
      },
      {
        name: 'Better Auth Next.js guide',
        url: 'https://better-auth.com/docs/integrations/next',
      },
      {
        name: 'Clerk Next.js guide',
        url: 'https://clerk.com/docs/nextjs/getting-started/quickstart',
      },
      { name: 'Clerk pricing', url: 'https://clerk.com/pricing' },
      {
        name: 'shadcn/ui Next.js setup',
        url: 'https://ui.shadcn.com/docs/installation/next',
      },
      {
        name: 'Mantine Next.js setup',
        url: 'https://mantine.dev/guides/next/',
      },
    ],
  },
]
