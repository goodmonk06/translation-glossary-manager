# Translation & Glossary Manager

A centralized translation and glossary management system built with Next.js, TypeScript, Prisma, and PostgreSQL. This system allows you to manage translatable strings and glossary terms across multiple projects, and provides APIs and SDKs for easy integration into your applications.

**Status**: Phase 2 - Production-ready with end-to-end vertical slice, Docker support, comprehensive tests, and seed data.

## Overview

This repository serves as a **reusable building block** for managing translations across your entire ecosystem. It provides:

- **Centralized Translation Management**: Single source of truth for all translatable strings
- **Multi-Project Architecture**: Manage translations for web apps, mobile apps, and marketing sites in one place
- **Public APIs**: Export translations and glossary terms via simple REST endpoints
- **Type-Safe SDK**: JavaScript/TypeScript client for seamless integration
- **Admin UI**: Beautiful, responsive interface for managing content
- **Developer Experience**: Docker, testing, seeding, and standardized scripts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Testing**: Vitest
- **Containerization**: Docker & Docker Compose

## Domain Model

### Core Entities

**Project**
- Represents a distinct application or project (e.g., "My Web App", "Mobile App")
- Has a unique slug for API access
- Defines a default locale

**LocaleString**
- A translatable string with a key, locale, and value
- Belongs to a project
- Unique constraint on (project, key, locale)
- Example: `key: "app.welcome"`, `locale: "ja-JP"`, `value: "ようこそ"`

**GlossaryTerm**
- Translation glossary entry for consistency
- Maps source term to target term across locales
- Includes notes and tags for translators
- Example: `dashboard` (en-US) → `ダッシュボード` (ja-JP)

### Relationships

```
Project (1) ─── (N) LocaleString
        └─── (N) GlossaryTerm
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (recommended)
- **PostgreSQL** 16+ (if running locally without Docker)

### Quick Start with Docker (Recommended)

1. **Clone and setup**:
```bash
git clone <your-repo-url>
cd translation-glossary-manager
cp .env.example .env
```

2. **Start everything**:
```bash
docker compose up -d
```

This will:
- Start PostgreSQL database
- Run database migrations
- Start the Next.js app on http://localhost:3000

3. **Seed demo data**:
```bash
docker compose exec app npm run db:seed
```

4. **Access the application**:
- **Web UI**: http://localhost:3000
- **Projects**: http://localhost:3000/projects

### Local Development (Without Docker)

1. **Install dependencies**:
```bash
npm install
```

2. **Setup database**:
```bash
# Copy environment file
cp .env.example .env

# Edit .env and set your DATABASE_URL
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/translation_glossary?schema=public"

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

3. **Seed demo data**:
```bash
npm run db:seed
```

4. **Start development server**:
```bash
npm run dev
```

5. **Open http://localhost:3000**

### Development with Docker (Hot Reload)

```bash
docker compose --profile dev up
```

This starts the app with volume mounts for hot reload during development.

## Example End-to-End Flow

### Vertical Slice: Project → Strings → API → SDK

This implementation includes a complete working vertical slice:

#### 1. Create a Project

Via UI:
- Go to http://localhost:3000/projects
- Click "New Project"
- Enter name: `My Web App`, slug: `my-web-app`, default locale: `en-US`

Via API:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Web App",
    "slug": "my-web-app",
    "defaultLocale": "en-US"
  }'
```

#### 2. Add Translation Strings

Via UI:
- Navigate to `/projects/{id}/strings`
- Click "New String"
- Add strings:
  - Key: `app.welcome`, Locale: `en-US`, Value: `Welcome!`
  - Key: `app.welcome`, Locale: `ja-JP`, Value: `ようこそ！`

Via API:
```bash
curl -X POST http://localhost:3000/api/strings \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "key": "app.welcome",
    "locale": "ja-JP",
    "value": "ようこそ！"
  }'
```

#### 3. Export Translations

Fetch all Japanese translations for the project:
```bash
curl http://localhost:3000/api/export/my-web-app?locale=ja-JP
```

Response:
```json
{
  "app.welcome": "ようこそ！",
  "app.login": "ログイン",
  "nav.dashboard": "ダッシュボード"
}
```

#### 4. Use in Your App (SDK)

```typescript
import { createTranslationClient } from './sdk/client'

const translator = createTranslationClient({
  baseUrl: 'http://localhost:3000',
  projectSlug: 'my-web-app',
  locale: 'ja-JP',
})

await translator.load()

console.log(translator.t('app.welcome'))  // "ようこそ！"
console.log(translator.t('app.login'))    // "ログイン"
```

## Available Scripts

### Development
```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
```

### Testing
```bash
npm test              # Run tests with Vitest
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Database
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB (dev)
npm run db:migrate    # Create and run migrations
npm run db:seed       # Populate with demo data
npm run db:studio     # Open Prisma Studio
npm run db:reset      # Reset database (caution!)
```

### Docker
```bash
npm run docker:up     # Start containers
npm run docker:down   # Stop containers
npm run docker:logs   # View logs
```

### Quick Setup
```bash
npm run setup         # Install + push schema + seed
```

## API Reference

### Admin Endpoints (CRUD)

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Strings
- `GET /api/strings?projectId=xxx&locale=en-US` - List strings
- `POST /api/strings` - Create string
- `GET /api/strings/:id` - Get string
- `PATCH /api/strings/:id` - Update string
- `DELETE /api/strings/:id` - Delete string

#### Glossary Terms
- `GET /api/glossary-terms?projectId=xxx` - List terms
- `POST /api/glossary-terms` - Create term
- `GET /api/glossary-terms/:id` - Get term
- `PATCH /api/glossary-terms/:id` - Update term
- `DELETE /api/glossary-terms/:id` - Delete term

### Public Endpoints

#### Export Translations
```bash
GET /api/export/:projectSlug?locale=ja-JP
```

Returns:
```json
{
  "app.welcome": "ようこそ",
  "app.login": "ログイン"
}
```

#### Get Glossary
```bash
GET /api/glossary/:projectSlug?sourceLocale=en-US&targetLocale=ja-JP
```

Returns:
```json
[
  {
    "sourceTerm": "dashboard",
    "sourceLocale": "en-US",
    "targetTerm": "ダッシュボード",
    "targetLocale": "ja-JP",
    "notes": "Use katakana consistently",
    "tags": ["ui", "navigation"]
  }
]
```

## SDK Usage

### Installation

Copy the SDK to your project:
```bash
cp sdk/client.ts your-project/lib/translation-client.ts
```

### Basic Usage

```typescript
import { createTranslationClient } from '@/lib/translation-client'

const translator = createTranslationClient({
  baseUrl: process.env.TRANSLATION_API_URL!,
  projectSlug: 'my-web-app',
  locale: 'ja-JP',
})

await translator.load()

// Simple translation
translator.t('app.welcome')  // "ようこそ"

// With fallback
translator.t('missing.key', 'Default')  // "Default"

// With interpolation
translator.t_interpolate('hello_user', { name: 'Alice' })
// If translation is "こんにちは、{name}さん" → "こんにちは、Aliceさん"
```

### Next.js Integration

See the [SDK Usage section in the original README](./README.md#sdk-usage) for React Context and Server Component examples.

## Demo Data

After running `npm run db:seed`, you'll have:

**Projects**:
1. **My Web App** (`my-web-app`) - 45+ strings in EN/JA/ES
2. **Mobile App** (`mobile-app`) - Mobile-specific strings
3. **Marketing Website** (`marketing-site`) - Empty starter

**Demo Credentials**: None required (open access for now)

**Demo URLs**:
- Web App Strings: http://localhost:3000/projects/{id}/strings
- Export EN: http://localhost:3000/api/export/my-web-app?locale=en-US
- Export JA: http://localhost:3000/api/export/my-web-app?locale=ja-JP
- Glossary: http://localhost:3000/api/glossary/my-web-app

## Testing

Tests are written with Vitest and cover:
- API response utilities
- Error handling classes
- SDK client functionality

Run tests:
```bash
npm test
```

View coverage:
```bash
npm run test:coverage
```

## Project Structure

```
translation-glossary-manager/
├── app/
│   ├── api/              # API routes
│   │   ├── export/       # Public export endpoint
│   │   ├── glossary/     # Public glossary endpoint
│   │   ├── projects/     # CRUD for projects
│   │   ├── strings/      # CRUD for strings
│   │   └── glossary-terms/ # CRUD for terms
│   ├── projects/         # UI pages
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── api-response.ts   # Centralized API responses
│   ├── api-handler.ts    # Error handling wrapper
│   └── errors.ts         # Custom error classes
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── sdk/
│   └── client.ts         # Translation SDK
├── tests/                # Vitest tests
├── docker-compose.yml    # Docker orchestration
├── Dockerfile            # Production container
└── README.md
```

## Deployment

### Environment Variables

Required:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
NODE_ENV="production"
```

### Docker Production

```bash
docker compose up -d
```

### Platform Deployment (Vercel, Railway, etc.)

1. Set `DATABASE_URL` in platform environment
2. Connect repository
3. Add build command: `npm run build`
4. Add start command: `npm start`
5. Run migrations: `npm run db:migrate:deploy`

## Future Extensions

- [ ] **Authentication & Authorization**: Protect admin endpoints, add API keys
- [ ] **Role-Based Access**: Admin, Translator, Viewer roles
- [ ] **Translation Workflow**: Draft → Review → Approved states
- [ ] **Import/Export**: CSV, JSON, XLIFF format support
- [ ] **Search & Filtering**: Full-text search across strings
- [ ] **Translation Memory**: Suggest similar translations
- [ ] **Machine Translation**: Integrate DeepL, Google Translate
- [ ] **Webhooks**: Notify on translation updates
- [ ] **Version History**: Track changes over time
- [ ] **Collaboration**: Comments, suggestions, discussion threads
- [ ] **Analytics**: Track translation coverage, usage stats
- [ ] **CDN Integration**: Edge caching for exports

## Shared Across Repositories

One of the core benefits: **Multiple applications can share this translation backend**.

Example:
```
translation-glossary-manager (this repo)
├── Hosts centralized service
└── Public API at https://translations.yourcompany.com

your-web-app (separate repo)
├── Project: "web-app"
└── Uses SDK to fetch translations

your-mobile-app (separate repo)
├── Project: "mobile-app"
└── Uses SDK to fetch translations

your-marketing-site (separate repo)
├── Project: "marketing-site"
└── Uses SDK to fetch translations
```

All apps pull from one source, ensuring consistency and easy updates.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT

---

**Phase 2 Complete** ✅
- ✅ End-to-end vertical slice (Project → Strings → API → SDK)
- ✅ Standardized DX scripts (dev, build, test, seed, docker)
- ✅ Centralized error handling and validation
- ✅ Docker support with docker-compose
- ✅ Comprehensive tests with Vitest
- ✅ Realistic seed data
- ✅ Production-ready documentation
