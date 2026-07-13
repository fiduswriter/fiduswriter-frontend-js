# @fiduswriter/common

Fidus-Writer-specific shared utilities and UI chrome.

This package holds code that is reused between the standalone Fidus Writer
applications (`@fiduswriter/editor`, `@fiduswriter/bibliography-manager`) but is
not generic enough to live in [`fwtoolkit`](https://codeberg.org/fiduswriter/fwtoolkit).

## Contents

- `baseBodyTemplate` and `filterPrimaryEmail`
- `FeedbackTab`
- `SiteMenu`

## Build

```bash
npm install
npm run build
```

## Status

This is an initial extraction from the main Fidus Writer Django app. The code is
still JavaScript and will be migrated to TypeScript over time. Some of the UI
components listed above may eventually move into `fwtoolkit`.
