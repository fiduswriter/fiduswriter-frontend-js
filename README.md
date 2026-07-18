<p align="center">
  <img src="logo.svg" alt="@fiduswriter/frontend" width="100" height="100">
</p>

<h1 align="center">@fiduswriter/frontend</h1>

<p align="center">Fidus Writer shared page chrome and utilities</p>

---

## What it does

Holds Fidus Writer-specific shared page chrome, utilities, and ProseMirror
state plugins that are reused between the standalone editor and bibliography
manager applications. These are not generic enough to live in `fwtoolkit`.

## Exports

### Components

| Export | Description |
|--------|-------------|
| `baseBodyTemplate` | Base HTML body template with common meta tags and CSS |
| `FeedbackTab` | Feedback and support sidebar tab |
| `SiteMenu` | Top-level site navigation menu with plugin registry |

### State plugins

| Export path | Description |
|-------------|-------------|
| `./state_plugins/contributor_input` | Contributor field input plugin for ProseMirror |
| `./state_plugins/tag_input` | Tag field input plugin for ProseMirror |

### Types

The package exports 26 TypeScript interfaces and types for app configuration,
menu items, routes, settings, users, and plugin registrations. See the
TypeScript declarations in `dist/` for the full API.

## Installation

```bash
npm install @fiduswriter/frontend
```

## Usage

```ts
import {baseBodyTemplate, FeedbackTab, SiteMenu} from "@fiduswriter/frontend"
import {contributorInputPlugin} from "@fiduswriter/frontend/state_plugins/contributor_input"
import {tagInputPlugin} from "@fiduswriter/frontend/state_plugins/tag_input"
```

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run typecheck    # Check types without emitting
npm run lint         # Lint with ESLint
npm run format:check # Check formatting with Prettier
```

## License

AGPL-3.0 — see [LICENSE](LICENSE) for details.
