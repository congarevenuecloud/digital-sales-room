# Digital Sales Room Reference Template

This is the base reference application for the Conga Digital Sales Room product. Follow the instructions below to get started. See the [docs](https://congarevenuecloud.github.io/202610.1.0/) for more detailed instructions on interacting with the underlying SDK.

---

## Table of content

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Build](#build)
- [Product identifier](#product-identifier)
- [Angular CLI Command](#code-scaffolding)
- [Running unit tests](#running-unit-tests)
- [Running end-to-end tests](#running-end-to-end-tests)
- [Digital Commerce SDK](#digital-commerce-sdk)
- [Digital Commerce for REST API Developers](#digital-commerce-for-rest-api-developers)
- [Further help](#further-help)

## Prerequisites

You will need Node.js, npm, and Angular CLI to work with this project.

- Node.js compatible with Angular 21: `^20.19.0 || ^22.12.0 || >=24.0.0`
- npm
- Access to the `@congarevenuecloud` packages on GitHub Packages
- Angular CLI, installed locally with the project dependencies

Node.js 24.x is recommended. The standalone build and tests were verified with Node.js 24.21.0.

To check the tools available on your machine, run:

```bash
npm -v
node -v
```

After installing the project dependencies, check the local Angular CLI version:

```bash
npm run ng -- version
```

## Installation

---

### Platform & tools

Install Node.js, which includes the [npm](https://www.npmjs.com/) package manager. Angular and Angular CLI are installed by `npm install`; a global CLI installation is not required for the commands below.

- [Node.js](https://nodejs.org)
- [Angular](https://angular.dev/docs)
- [Angular CLI](https://angular.dev/cli)

### Get the Code

Either clone this repository or fork it on GitHub and clone your fork.

```bash
git clone https://github.com/saparmar-conga/digital-sales-room.git
cd digital-sales-room
```

### Update .npmrc file

To install the SDK libraries listed in [package.json](package.json), configure the scoped registry in the project [`.npmrc`](.npmrc):

```ini
@congarevenuecloud:registry=https://npm.pkg.github.com
```

Authenticate using an account and token authorized to read the Conga packages:

```bash
npm login --scope=@congarevenuecloud --registry=https://npm.pkg.github.com --auth-type=legacy
```

Alternatively, configure the registry token in your user-level `.npmrc` or CI secret configuration:

```ini
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Do not commit credentials to this repository.

The following SDK libraries are declared in [package.json](package.json), following the standalone e-commerce reference template:

```json
{
  "@congarevenuecloud/core": "^202610.1.2",
  "@congarevenuecloud/ecommerce": "^202610.1.2",
  "@congarevenuecloud/elements": "^202610.1.2"
}
```

Keep these SDK version ranges aligned when upgrading.

### Dependency installation

To install dependencies, run:

```bash
npm install
```

### Build

Run the following command for a production build:

```bash
npm run build
```

The build artifacts are stored in `dist/digital-sales-room`.

For a development build, run:

```bash
npm run ng -- build --configuration=development
```

### Updating the environment file

Replace the example `endpoint`, `clientId`, `authority`, and `loginEndpoint` values with details of your Conga platform instance in:

- [Development environment](src/environments/environment.ts)
- [Production environment](src/environments/environment.prod.ts)

Also update the runtime configuration in [src/assets/env.json](src/assets/env.json):

- `apiEndpoint`: your Conga API URL
- `authEndpoint`: your identity provider authority URL
- `login`: your identity provider login URL
- `spaClientId`: your registered DSR SPA client ID
- `guestUserId`: the guest user ID, if required by your tenant

The runtime configuration is copied to `env.json` at the build output root and requested relative to the application URL. When loaded successfully, its authentication settings are used instead of the build-time fallback. Configure both sources for your tenant, and register the application's redirect and logout URLs with your SPA client.

Keep `translationModule: 'DSR'` and `applicationType: PlatformConstants.E_COMMERCE` as provided by the upstream DSR configuration.

### Serving the application

**Development Mode**

```bash
npm start
```

Navigate to `http://localhost:4200`. The app automatically reloads when you change source files.

**Production Mode**

Build with `npm run build`, then host `dist/digital-sales-room` on a static web server. The Angular development server is not intended for production hosting.

For storefront-specific URLs such as `/dsr/<storefront>/`, serve the application and its static files under that prefix. The application sets its base URL from the storefront path. Configure the host to serve `index.html` for application routes.

## Product identifier

By default, the DSR environment sets `productIdentifier` to `Id`. To use another supported product field for product routing, update this setting in the environment files. For example:

```typescript
productIdentifier: 'ProductCode'
```

<a id="code-scaffolding"></a>

## Angular CLI Command

Run the following command to generate a component:

```bash
npm run ng -- generate component component-name
```

You can also generate directives, pipes, guards, services, classes, interfaces, enums, and modules:

```text
npm run ng -- generate directive|pipe|service|class|guard|interface|enum|module
```

## Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

For a non-interactive test run with Chrome installed:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Running end-to-end tests

An end-to-end test runner is not configured in this repository. Before running end-to-end tests, add and configure a runner such as [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/).

## Digital Commerce SDK

The SDK provides base libraries, models, components, and services that can be inherited and reused for business logic, including cart, quote, and collaboration workflows used by Digital Sales Room.

The shared Conga libraries are installed as published packages, not copied from the monorepo. Only the DSR application, its assets, and standalone Angular tooling are included in this repository. Internal CI pipelines, documentation output, caches, installed dependencies, and build artifacts are excluded.

See the [Docs](https://congarevenuecloud.github.io/202610.1.0/) for more information.

## Digital Commerce for REST API Developers

This section provides administrators and developers with CPQ API references for integrating commerce functionality into an application.

Refer to the [Docs](https://developer.conga.com/revenue) for detailed information about the CPQ APIs.

## Further help

- [Angular CLI](https://angular.dev/tools/cli)
- [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
