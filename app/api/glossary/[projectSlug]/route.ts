import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/glossary/[projectSlug]?sourceLocale=en-US&targetLocale=ja-JP
// Returns glossary entries for the project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectSlug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceLocale = searchParams.get('sourceLocale')
    const targetLocale = searchParams.get('targetLocale')

    // Find the project by slug
    const project = await prisma.project.findUnique({
      where: { slug: params.projectSlug },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build the where clause
    const where: any = {
      projectId: project.id,
    }

    if (sourceLocale) where.sourceLocale = sourceLocale
    if (targetLocale) where.targetLocale = targetLocale

    // Fetch glossary terms
    const terms = await prisma.glossaryTerm.findMany({
      where,
      orderBy: { sourceTerm: 'asc' },
      select: {
        id: true,
        sourceTerm: true,
        sourceLocale: true,
        targetLocale: true,
        targetTerm: true,
        notes: true,
        tagsJson: true,
      },
    })

    // Parse tags JSON for each term
    const termsWithParsedTags = terms.map((term) => ({
      ...term,
      tags: term.tagsJson ? JSON.parse(term.tagsJson) : [],
    }))

    return NextResponse.json(termsWithParsedTags)
  } catch (error) {
    console.error('Error fetching glossary:', error)
    return NextResponse.json({ error: 'Failed to fetch glossary' }, { status: 500 })
  }
}
