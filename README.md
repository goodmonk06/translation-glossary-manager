# Translation & Glossary Manager

A centralized translation and glossary management system built with Next.js, TypeScript, Prisma, and PostgreSQL. This system allows you to manage translatable strings and glossary terms across multiple projects, and provides APIs and SDKs for easy integration into your applications.

## Features

- **Multi-Project Support**: Manage translations and glossaries for multiple projects
- **Locale String Management**: Store and manage translatable strings with keys, values, and descriptions
- **Glossary Management**: Define glossary terms with source/target locales and notes
- **Public APIs**: RESTful endpoints for exporting translations and glossary terms
- **JavaScript SDK**: Simple client library for integrating translations into your apps
- **Admin UI**: Web interface for managing projects, strings, and glossary terms
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/translation-glossary-manager.git
cd translation-glossary-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up your database:
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your PostgreSQL connection string
# DATABASE_URL="postgresql://user:password@localhost:5432/translation_glossary?schema=public"
```

4. Initialize the database:
```bash
npm run db:push
# or for migrations:
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Project
- `id`: Unique identifier
- `name`: Project name
- `slug`: URL-friendly identifier
- `defaultLocale`: Default locale for the project (e.g., "en-US")

### LocaleString
- `id`: Unique identifier
- `projectId`: Reference to project
- `key`: Translation key (e.g., "app.welcome")
- `locale`: Locale code (e.g., "en-US", "ja-JP")
- `value`: Translated text
- `description`: Optional description/context
- `updatedAt`: Last update timestamp

### GlossaryTerm
- `id`: Unique identifier
- `projectId`: Reference to project
- `sourceTerm`: Term in source language
- `sourceLocale`: Source locale
- `targetTerm`: Term in target language
- `targetLocale`: Target locale
- `notes`: Optional notes
- `tagsJson`: Optional tags in JSON format

## API Reference

### Admin Endpoints (CRUD)

#### Projects
```bash
GET    /api/projects           # List all projects
POST   /api/projects           # Create a project
GET    /api/projects/:id       # Get a project
PATCH  /api/projects/:id       # Update a project
DELETE /api/projects/:id       # Delete a project
```

#### Locale Strings
```bash
GET    /api/strings?projectId=xxx&locale=en-US  # List strings
POST   /api/strings            # Create a string
GET    /api/strings/:id        # Get a string
PATCH  /api/strings/:id        # Update a string
DELETE /api/strings/:id        # Delete a string
```

#### Glossary Terms
```bash
GET    /api/glossary-terms?projectId=xxx  # List terms
POST   /api/glossary-terms     # Create a term
GET    /api/glossary-terms/:id # Get a term
PATCH  /api/glossary-terms/:id # Update a term
DELETE /api/glossary-terms/:id # Delete a term
```

### Public Endpoints

#### Export Translations
```bash
GET /api/export/:projectSlug?locale=ja-JP
```

Returns a JSON object with key-value pairs:
```json
{
  "app.welcome": "ようこそ",
  "app.login": "ログイン",
  "app.logout": "ログアウト"
}
```

#### Get Glossary
```bash
GET /api/glossary/:projectSlug?sourceLocale=en-US&targetLocale=ja-JP
```

Returns an array of glossary terms:
```json
[
  {
    "id": "...",
    "sourceTerm": "dashboard",
    "sourceLocale": "en-US",
    "targetTerm": "ダッシュボード",
    "targetLocale": "ja-JP",
    "notes": "Use this term consistently",
    "tags": ["ui", "navigation"]
  }
]
```

## SDK Usage

### Installation in Your Project

Copy the SDK client to your project:
```bash
# From this repo
cp sdk/client.ts your-project/lib/translation-client.ts
```

### Basic Usage

```typescript
import { createTranslationClient } from './lib/translation-client'

// Initialize the client
const translator = createTranslationClient({
  baseUrl: 'https://your-translation-service.com',
  projectSlug: 'my-app',
  locale: 'ja-JP',
  cache: true, // Cache translations in memory
})

// Load translations
await translator.load()

// Use translations
const welcomeText = translator.t('app.welcome')
// Returns: "ようこそ"

// With fallback
const text = translator.t('missing.key', 'Default text')
// Returns: "Default text"

// With interpolation
const greeting = translator.t_interpolate('hello_name', { name: 'John' })
// If translation is "Hello, {name}!" returns: "Hello, John!"

// Check if a key exists
if (translator.has('app.welcome')) {
  // Key exists
}

// Get all translations
const allTranslations = translator.getAll()
```

### Next.js Integration Example

Create a translation provider:

```typescript
// app/providers/translation-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createTranslationClient, TranslationClient } from '@/lib/translation-client'

const TranslationContext = createContext<TranslationClient | null>(null)

export function TranslationProvider({
  children,
  locale = 'en-US'
}: {
  children: React.ReactNode
  locale?: string
}) {
  const [client] = useState(() =>
    createTranslationClient({
      baseUrl: process.env.NEXT_PUBLIC_TRANSLATION_URL || '',
      projectSlug: process.env.NEXT_PUBLIC_PROJECT_SLUG || '',
      locale,
    })
  )

  useEffect(() => {
    client.load()
  }, [client])

  return (
    <TranslationContext.Provider value={client}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const client = useContext(TranslationContext)
  if (!client) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return client
}
```

Use in your components:

```typescript
// app/page.tsx
'use client'

import { useTranslation } from './providers/translation-provider'

export default function HomePage() {
  const t = useTranslation()

  return (
    <div>
      <h1>{t.t('app.welcome')}</h1>
      <p>{t.t('app.description')}</p>
    </div>
  )
}
```

### Server-Side Usage

```typescript
// app/page.tsx (Server Component)
import { createTranslationClient } from '@/lib/translation-client'

export default async function HomePage() {
  const translator = createTranslationClient({
    baseUrl: process.env.TRANSLATION_URL!,
    projectSlug: 'my-app',
    locale: 'ja-JP',
  })

  await translator.load()

  return (
    <div>
      <h1>{translator.t('app.welcome')}</h1>
    </div>
  )
}
```

## Shared Translation Backend

One of the key benefits of this system is that **multiple applications can share the same translation backend**. This means:

1. **Single Source of Truth**: All your applications pull translations from one centralized location
2. **Consistent Terminology**: Use the glossary feature to ensure consistent translations across all apps
3. **Easy Updates**: Update a translation once, and all apps get the update
4. **Multi-Tenant**: Each app can have its own project with its own strings and glossary

### Example: Using Across Multiple Repos

```
translation-glossary-manager (this repo)
├── Hosts the translation service
└── Public API at https://translations.yourcompany.com

your-web-app (separate repo)
├── Uses SDK to fetch translations
└── Project slug: "web-app"

your-mobile-app (separate repo)
├── Uses SDK to fetch translations
└── Project slug: "mobile-app"

your-admin-dashboard (separate repo)
├── Uses SDK to fetch translations
└── Project slug: "admin-dashboard"
```

All three apps can:
- Share common translations (e.g., "login", "logout")
- Have app-specific translations
- Reference the same glossary for consistency

## UI Pages

- `/` - Home page
- `/projects` - List all projects, create new projects
- `/projects/[id]/strings` - Manage locale strings with inline editing
- `/projects/[id]/glossary` - Manage glossary terms

## Development

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Project Structure

```
translation-glossary-manager/
├── app/
│   ├── api/                 # API route handlers
│   │   ├── export/          # Public export endpoint
│   │   ├── glossary/        # Public glossary endpoint
│   │   ├── glossary-terms/  # Admin CRUD for glossary
│   │   ├── projects/        # Admin CRUD for projects
│   │   └── strings/         # Admin CRUD for strings
│   ├── projects/            # UI pages
│   │   └── [id]/
│   │       ├── strings/     # String management page
│   │       └── glossary/    # Glossary management page
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── prisma.ts            # Prisma client singleton
├── prisma/
│   └── schema.prisma        # Database schema
├── sdk/
│   └── client.ts            # Translation SDK
└── README.md
```

## Future Enhancements

- [ ] Authentication and authorization
- [ ] Role-based access control (Admin, Translator, Viewer)
- [ ] Translation workflow (draft, review, approved)
- [ ] Import/export (CSV, JSON, XLIFF)
- [ ] Search and filtering
- [ ] Translation memory
- [ ] Machine translation integration
- [ ] Webhook notifications
- [ ] Version history
- [ ] Comments and collaboration

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
