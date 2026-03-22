# PostHog Impact

**TOP HOG** — Engineering Impact analysis for [PostHog/posthog](https://github.com/PostHog/posthog) contributors (last 90 days). Metrics: ownership (cross-author fix rate), weirdness (scope entropy), and first-mover rate. All derived from conventional commits via GitHub API; no local clone required.

## Data Flow

Scores are **precomputed** (not computed on page load) for fast loads:

- **GitHub Action** (`.github/workflows/compute-impact.yml`) runs daily and on manual trigger
- Fetches all commits (~18k) and merged PRs (~18k) from the last 90 days via GitHub API
- Writes `data/impact.json` and commits it to the repo
- The **API route** (`/api/impact`) reads from this static file—no GitHub API calls at request time

To precompute locally (requires `GITHUB_TOKEN`):

```bash
GITHUB_TOKEN=your_token npm run compute-impact
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
