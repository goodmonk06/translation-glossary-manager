# Domain Model

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Project                              │
│  • id: string                                                │
│  • name: string                                              │
│  • slug: string (unique)                                     │
│  • defaultLocale: string                                     │
│  • description?: string                                      │
│  • isPublic: boolean                                         │
│  • settings: JSON                                            │
└─────────────────────────────────────────────────────────────┘
         │
         ├─── has many ───┐
         │                 │
         ↓                 ↓
┌──────────────────┐  ┌──────────────────┐
│  LocaleString    │  │  GlossaryTerm    │
│  • id            │  │  • id            │
│  • projectId     │  │  • projectId     │
│  • key           │  │  • sourceTerm    │
│  • locale        │  │  • targetTerm    │
│  • value         │  │  • sourceLocale  │
│  • status        │  │  • targetLocale  │
│  • description   │  │  • notes         │
│  • lastReviewed  │  │  • context       │
│  • metadata      │  │  • examples      │
└──────────────────┘  │  • isVerified    │
         │            └──────────────────┘
         │
         ├─── has many
         ↓
┌──────────────────┐
│TranslationHistory│
│  • id            │
│  • localeStringId│
│  • projectId     │
│  • key           │
│  • oldValue      │
│  • newValue      │
│  • changeType    │
│  • changedBy     │
│  • timestamp     │
└──────────────────┘

         Project
            │
            ├─── has many
            ↓
┌──────────────────┐
│  ProjectMember   │
│  • id            │
│  • projectId     │
│  • userId        │
│  • email         │
│  • role          │
│  • invitedBy     │
│  • joinedAt      │
│  • lastActive    │
└──────────────────┘

         Project
            │
            ├─── has many
            ↓
┌──────────────────┐
│  ExportConfig    │
│  • id            │
│  • projectId     │
│  • name          │
│  • format        │
│  • filters       │
│  • transforms    │
│  • outputOptions │
│  • useCount      │
│  • lastUsedAt    │
└──────────────────┘
```

## Core Entities

### Project

Represents a distinct application or product that needs translations.

**Key Attributes**:
- `slug`: URL-friendly unique identifier
- `defaultLocale`: Base language (e.g., "en-US")
- `isPublic`: Whether translations are publicly accessible
- `settings`: JSON configuration (auto-translate, review workflow, etc.)

**Use Cases**:
- SaaS web application
- Mobile app
- Marketing website
- Admin dashboard

### LocaleString

Individual translatable string with locale-specific value.

**Key Attributes**:
- `key`: Identifier (e.g., "auth.login", "dashboard.title")
- `locale`: Language-region code (e.g., "ja-JP", "es-ES")
- `value`: Translated text
- `status`: Workflow state (DRAFT, IN_REVIEW, APPROVED, ARCHIVED)
- `characterCount`, `wordCount`: For estimation and billing

**Unique Constraint**: (projectId, key, locale)

**Workflow States**:
1. **DRAFT**: Initial creation, work in progress
2. **IN_REVIEW**: Submitted for reviewer approval
3. **APPROVED**: Reviewed and ready for production
4. **ARCHIVED**: Deprecated, kept for history

### GlossaryTerm

Translation reference for consistent terminology.

**Key Attributes**:
- `sourceTerm`: Original term (e.g., "dashboard")
- `targetTerm`: Translated term (e.g., "ダッシュボード")
- `sourceLocale`, `targetLocale`: Language pair
- `context`: Usage explanation
- `examples`: JSON array of sample sentences
- `isVerified`: Quality flag

**Purpose**:
- Ensure consistency across translators
- Provide context and examples
- Speed up translation work

### TranslationHistory

Immutable audit trail of all changes.

**Key Attributes**:
- `changeType`: CREATED, UPDATED, DELETED, STATUS_CHANGED
- `oldValue`, `newValue`: What changed
- `changedBy`: User identifier
- `timestamp`: When it happened

**Use Cases**:
- Audit compliance
- Rollback capability
- Analytics and insights
- Blame tracking

### ProjectMember

Team collaboration and access control.

**Roles**:
1. **OWNER**: Full control, can delete project
2. **ADMIN**: Manage members and settings
3. **TRANSLATOR**: Create and edit translations
4. **REVIEWER**: Approve translations
5. **VIEWER**: Read-only access

**Attributes**:
- `lastActive`: Track engagement
- `invitedBy`: Invitation chain
- `metadata`: Custom user data

### ExportConfig

Reusable export templates.

**Key Attributes**:
- `format`: JSON, CSV, YAML, XLIFF
- `filters`: Which strings to include (locale, status, key pattern)
- `transforms`: Data transformations (groupByLocale, flattenKeys)
- `outputOptions`: Format-specific options (pretty print, compression)

**Use Cases**:
- Production release (approved only)
- Review queue (in-review status)
- Specific feature exports
- Automated CI/CD exports

## Domain Rules

### Invariants

1. **Project slug must be unique** across all projects
2. **LocaleString (project, key, locale) must be unique**
3. **Cannot remove last OWNER** from a project
4. **History is append-only**, never deleted
5. **Approved translations** should not be edited without new review

### Workflow Rules

**Translation Lifecycle**:
```
DRAFT ──review──> IN_REVIEW ──approve──> APPROVED
  │                   │
  └────── edit ───────┘
            ↓
         ARCHIVED (deprecated)
```

**Member Permissions**:
- VIEWER: Read translations, glossary
- TRANSLATOR: + Create/edit drafts
- REVIEWER: + Approve translations
- ADMIN: + Manage members, configs
- OWNER: + Delete project

## Extension Points

### Custom Metadata

All entities support JSON metadata fields:
- `Project.settings`: Custom project configuration
- `LocaleString.metadata`: Context, screenshots, notes
- `ProjectMember.metadata`: User preferences, avatar URL

### Tags and Classification

- `GlossaryTerm.tagsJson`: Categorize terms (ui, technical, marketing)
- Future: Add tags to LocaleStrings for filtering

### Integration Hooks

Events are fired for all state changes:
- Subscribe to `translation.updated` for external notifications
- Listen to `project.member_added` for welcome emails
- Track `export.generated` for analytics

## Query Patterns

### Common Queries

**Get all approved translations for export**:
```typescript
await prisma.localeString.findMany({
  where: {
    projectId,
    locale,
    status: 'APPROVED'
  }
})
```

**Find strings needing review**:
```typescript
await prisma.localeString.findMany({
  where: {
    projectId,
    status: 'IN_REVIEW'
  }
})
```

**Get user's projects**:
```typescript
await prisma.projectMember.findMany({
  where: { userId },
  include: { project: true }
})
```

**Audit trail for a string**:
```typescript
await prisma.translationHistory.findMany({
  where: { localeStringId },
  orderBy: { createdAt: 'desc' }
})
```

## Future Enhancements

- **StringGroup**: Organize strings into features/modules
- **Comment**: Threaded discussions on translations
- **Attachment**: Screenshots, design files for context
- **TranslationMemory**: Suggest similar translations
- **AutoTranslation**: Machine translation with review
- **Version**: Branches and tags for releases
