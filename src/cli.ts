#!/usr/bin/env node
/**
 * Translation Manager CLI
 * Command-line tools for managing translations
 */

import { PrismaClient } from '@prisma/client'
import { exportConfigService } from '../lib/services/export-config.service'
import { translationHistoryService } from '../lib/services/translation-history.service'
import * as fs from 'fs/promises'
import * as path from 'path'

const prisma = new PrismaClient()

const commands = {
  async export(projectSlug: string, locale: string, outputPath?: string) {
    console.log(`📤 Exporting ${locale} translations for ${projectSlug}...`)

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
    })

    if (!project) {
      console.error(`❌ Project not found: ${projectSlug}`)
      process.exit(1)
    }

    const strings = await prisma.localeString.findMany({
      where: {
        projectId: project.id,
        locale,
      },
      select: {
        key: true,
        value: true,
      },
    })

    const translations: Record<string, string> = {}
    strings.forEach(({ key, value }) => {
      translations[key] = value
    })

    const output = JSON.stringify(translations, null, 2)

    if (outputPath) {
      await fs.writeFile(outputPath, output, 'utf-8')
      console.log(`✅ Exported to ${outputPath}`)
    } else {
      console.log(output)
    }

    console.log(`\n📊 Exported ${strings.length} translations`)
  },

  async stats(projectSlug?: string) {
    console.log('📊 Translation Statistics\n')

    if (projectSlug) {
      const project = await prisma.project.findUnique({
        where: { slug: projectSlug },
        include: {
          _count: {
            select: {
              localeStrings: true,
              glossaryTerms: true,
              members: true,
            },
          },
        },
      })

      if (!project) {
        console.error(`❌ Project not found: ${projectSlug}`)
        process.exit(1)
      }

      console.log(`Project: ${project.name}`)
      console.log(`  Strings: ${project._count.localeStrings}`)
      console.log(`  Glossary Terms: ${project._count.glossaryTerms}`)
      console.log(`  Team Members: ${project._count.members}`)

      // Get history stats
      const historyStats = await translationHistoryService.getStats(project.id)
      console.log(`\nActivity:`)
      console.log(`  Total Changes: ${historyStats.total}`)
      console.log(`  Recent (7 days): ${historyStats.recentCount}`)
    } else {
      const projects = await prisma.project.count()
      const strings = await prisma.localeString.count()
      const glossary = await prisma.glossaryTerm.count()
      const members = await prisma.projectMember.count()

      console.log(`Total Projects: ${projects}`)
      console.log(`Total Strings: ${strings}`)
      console.log(`Total Glossary Terms: ${glossary}`)
      console.log(`Total Team Members: ${members}`)
    }
  },

  async validate(projectSlug: string) {
    console.log(`🔍 Validating translations for ${projectSlug}...\n`)

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
    })

    if (!project) {
      console.error(`❌ Project not found: ${projectSlug}`)
      process.exit(1)
    }

    const strings = await prisma.localeString.findMany({
      where: { projectId: project.id },
    })

    // Group by key
    const byKey = strings.reduce((acc, str) => {
      if (!acc[str.key]) acc[str.key] = []
      acc[str.key].push(str)
      return acc
    }, {} as Record<string, any[]>)

    let issues = 0

    // Check for missing translations
    Object.entries(byKey).forEach(([key, translations]) => {
      if (translations.length === 1) {
        console.log(`⚠️  Key "${key}" only has 1 locale (${translations[0].locale})`)
        issues++
      }
    })

    // Check for empty values
    const empty = strings.filter((s) => !s.value.trim())
    if (empty.length > 0) {
      console.log(`\n❌ Found ${empty.length} empty translations:`)
      empty.forEach((s) => {
        console.log(`  - ${s.key} (${s.locale})`)
      })
      issues += empty.length
    }

    if (issues === 0) {
      console.log('✅ All validations passed!')
    } else {
      console.log(`\n⚠️  Found ${issues} issues`)
      process.exit(1)
    }
  },

  async list(type: 'projects' | 'configs') {
    if (type === 'projects') {
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          defaultLocale: true,
          _count: {
            select: {
              localeStrings: true,
            },
          },
        },
      })

      console.log('\n📋 Projects:\n')
      projects.forEach((p) => {
        console.log(`  ${p.name}`)
        console.log(`    Slug: ${p.slug}`)
        console.log(`    Strings: ${p._count.localeStrings}`)
        console.log(`    Default Locale: ${p.defaultLocale}`)
        console.log()
      })
    }
  },

  help() {
    console.log(`
Translation Manager CLI

Usage:
  npm run cli <command> [options]

Commands:
  export <slug> <locale> [output]  Export translations to JSON file
  stats [slug]                      Show statistics
  validate <slug>                   Validate translations for completeness
  list projects                     List all projects
  help                              Show this help message

Examples:
  npm run cli export my-app ja-JP ./ja.json
  npm run cli stats my-app
  npm run cli validate my-app
  npm run cli list projects
    `)
  },
}

// Parse command line
const [,, command, ...args] = process.argv

async function run() {
  try {
    switch (command) {
      case 'export':
        await commands.export(args[0], args[1], args[2])
        break
      case 'stats':
        await commands.stats(args[0])
        break
      case 'validate':
        await commands.validate(args[0])
        break
      case 'list':
        await commands.list(args[0] as any)
        break
      case 'help':
      default:
        commands.help()
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

run()
