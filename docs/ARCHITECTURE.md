# Architecture Overview

## System Design

The Translation & Glossary Manager is built as a **layered, event-driven architecture** with clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │   Public     │  │     CLI      │      │
│  │     UI       │  │     API      │  │    Tools     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      API / Route Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Projects   │  │   Strings    │  │   Members    │      │
│  │   Glossary   │  │   Export     │  │   History    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Project     │  │ Translation  │  │  Export      │      │
│  │  Member      │  │   History    │  │  Config      │      │
│  │  Service     │  │   Service    │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Event System                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Event Bus (In-Memory)                    │  │
│  │  • translation.created    • project.member_added     │  │
│  │  • translation.updated    • export.generated         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Adapter Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Notification  │  │   Storage    │  │   Metrics    │      │
│  │  Adapter     │  │   Adapter    │  │   Adapter    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Prisma ORM                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Domain Layer

**Entities**:
- `Project`: Top-level container for translations
- `LocaleString`: Individual translatable string
- `GlossaryTerm`: Terminology reference
- `TranslationHistory`: Audit trail
- `ProjectMember`: Team collaboration
- `ExportConfig`: Export templates

**Status Enums**:
- `TranslationStatus`: DRAFT, IN_REVIEW, APPROVED, ARCHIVED
- `ProjectMemberRole`: OWNER, ADMIN, TRANSLATOR, REVIEWER, VIEWER

### 2. Service Layer

Services encapsulate business logic:

- **TranslationHistoryService**: Tracks all changes
- **ProjectMemberService**: Manages team and permissions
- **ExportConfigService**: Handles export generation

### 3. Event System

**Domain Events** enable loose coupling:
- `translation.created`, `translation.updated`
- `project.member_added`, `project.member_role_changed`
- `export.generated`

**Event Bus** dispatches events to handlers without tight coupling.

### 4. Adapter Pattern

Interfaces for external integrations:
- **INotificationAdapter**: Emails, Slack, webhooks
- **IStorageAdapter**: S3, CDN, local filesystem
- **IMetricsAdapter**: StatsD, Prometheus
- **ITranslationProviderAdapter**: DeepL, Google Translate

Default implementations provided for development.

### 5. API Layer

**Admin APIs**:
- Full CRUD for all entities
- Validation with Zod
- Centralized error handling

**Public APIs**:
- `/api/export/:slug` - Translation export
- `/api/glossary/:slug` - Glossary access

### 6. Infrastructure

**Logging**: Structured logger with context and levels
**Metrics**: Counter, gauge, histogram, timing
**Validation**: Zod schemas for all inputs
**Error Handling**: Custom error classes with HTTP codes

## Data Flow

### Example: Create Translation

```
User Action (UI)
    ↓
API Route Handler
    ↓
Validation (Zod)
    ↓
Service Layer (Business Logic)
    ↓
Prisma (Data Persistence)
    ↓
Event Emission (translation.created)
    ↓
Event Handlers
    ├─→ Notification Adapter
    ├─→ Metrics Recording
    └─→ History Creation
```

## Extensibility Points

1. **Event Handlers**: Subscribe to domain events
2. **Adapters**: Swap implementations (e.g., AWS SES for notifications)
3. **Export Formats**: Add new format handlers
4. **Validation Rules**: Extend Zod schemas
5. **Middleware**: Add auth, rate limiting, etc.

## Scalability Considerations

**Current** (Phase 3):
- Single-server deployment
- In-memory event bus
- PostgreSQL with indexes

**Future** (Phase 4+):
- Horizontal scaling with Redis for events
- CDN for export caching
- Read replicas for analytics
- Queue system for async operations

## Security

**Current**:
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- XSS prevention (React)

**Planned**:
- JWT authentication
- Role-based access control (RBAC)
- API key management
- Rate limiting
- Audit logging

## Technology Choices

| Component | Technology | Reason |
|-----------|------------|--------|
| Framework | Next.js 14 | SSR, API routes, modern DX |
| Language | TypeScript | Type safety, IDE support |
| Database | PostgreSQL | Reliability, JSONB, full-text search |
| ORM | Prisma | Type-safe queries, migrations |
| Validation | Zod | Runtime type checking |
| Testing | Vitest | Fast, modern, ESM support |
| Logging | Custom | Structured, contextual |
| Events | In-memory bus | Simple, upgradeable to Redis |

## Future Architecture Evolution

### Phase 4: Microservices (Optional)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Translation│  │  Glossary   │  │   Export    │
│   Service   │  │   Service   │  │   Service   │
└─────────────┘  └─────────────┘  └─────────────┘
       ↓                ↓                 ↓
┌──────────────────────────────────────────────┐
│           Message Broker (RabbitMQ)          │
└──────────────────────────────────────────────┘
```

### Phase 5: Global Distribution

- CDN edge caching for exports
- Multi-region database replicas
- GraphQL API for flexible queries
- Real-time collaboration via WebSockets
