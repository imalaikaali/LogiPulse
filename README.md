# LogiPulse

LogiPulse is a logistics and courier-management web app concept designed to bring shipment workflows, delivery tracking, and role-based dashboards into one interface.

> **Repository status:** This repository currently contains the project README only. The application source code still needs to be added before the project can be installed, run, or deployed.

## Planned capabilities

Based on the project's component structure, LogiPulse is intended to include:

- **User dashboard** for customer-facing shipment workflows.
- **Rider dashboard** for delivery and rider workflows.
- **Admin dashboard** for management and oversight.
- **Interactive map** for location and delivery-related views.
- **Authentication interface** for sign-in flows.
- **Chat interface** for in-app assistance.
- **Database schema and seed data** for the app's data model and development examples.

These are intended capabilities; availability and behavior must be verified after the source code is added and tested.

## Technology

The project structure indicates a frontend built with **React/TypeScript** and **Vite**. The repository may also use **Supabase** for data storage and **Google Gemini** for AI features; confirm the actual dependencies and implementation in the source before configuring production.

## Getting started

Once the application source code has been added to this repository:

1. Install a current supported version of Node.js and npm.
2. Open a terminal in the directory containing `package.json`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a local `.env` file only if the application code requires environment variables. Use `.env.example` as a template.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Create a production build:

   ```bash
   npm run build
   ```

These commands assume the final `package.json` defines the corresponding scripts.

## Environment variables

The current example configuration mentions:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | API key for Gemini AI calls, if the app uses Gemini. |
| `APP_URL` | Public application URL, used where the app requires its own URL. |

Set only the variables the source code actually reads. For deployment, set production values in your hosting provider's environment-variable settings.

**Security notes**

- Never commit `.env` files, API keys, passwords, Supabase service-role keys, or other private credentials.
- Keep Gemini API calls that require a private key on a trusted server-side endpoint; do not expose the key in browser code.
- Use public/publishable client keys only where the service explicitly intends them for frontend use, and enforce appropriate database access policies.
- If any secret has been committed or shared publicly, rotate it.

## Deployment

The project is intended to be deployable to a hosting provider such as Netlify after the source code and configuration are committed.

For a typical Vite application, the build settings are often:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Base directory:** the directory containing `package.json`

Confirm these settings against the actual repository structure and build scripts before deploying. Any server-side functions required for AI calls or other private operations must also be configured and tested.

## Development status

This README describes the intended project and setup based on the available project information. Update it as the source code, dependencies, features, database schema, and deployment configuration are added and verified.
