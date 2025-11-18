import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTermSchema = z.object({
  projectId: z.string(),
  sourceTerm: z.string().min(1),
  sourceLocale: z.string().min(1),
  targetLocale: z.string().min(1),
  targetTerm: z.string().min(1),
  notes: z.string().optional(),
  tagsJson: z.string().optional(),
})

const querySchema = z.object({
  projectId: z.string().optional(),
  sourceLocale: z.string().optional(),
  targetLocale: z.string().optional(),
})

// GET /api/glossary-terms - List glossary terms (optionally filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      projectId: searchParams.get('projectId'),
      sourceLocale: searchParams.get('sourceLocale'),
      targetLocale: searchParams.get('targetLocale'),
    })

    const where: any = {}
    if (query.projectId) where.projectId = query.projectId
    if (query.sourceLocale) where.sourceLocale = query.sourceLocale
    if (query.targetLocale) where.targetLocale = query.targetLocale

    const terms = await prisma.glossaryTerm.findMany({
      where,
      orderBy: { sourceTerm: 'asc' },
      include: {
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(terms)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error fetching glossary terms:', error)
    return NextResponse.json({ error: 'Failed to fetch glossary terms' }, { status: 500 })
  }
}

// POST /api/glossary-terms - Create a new glossary term
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTermSchema.parse(body)

    const term = await prisma.glossaryTerm.create({
      data,
    })

    return NextResponse.json(term, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating glossary term:', error)
    return NextResponse.json({ error: 'Failed to create glossary term' }, { status: 500 })
  }
}
