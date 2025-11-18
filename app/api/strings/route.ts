import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createStringSchema = z.object({
  projectId: z.string(),
  key: z.string().min(1),
  locale: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
})

const querySchema = z.object({
  projectId: z.string().optional(),
  locale: z.string().optional(),
})

// GET /api/strings - List strings (optionally filtered by project and locale)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      projectId: searchParams.get('projectId'),
      locale: searchParams.get('locale'),
    })

    const where: any = {}
    if (query.projectId) where.projectId = query.projectId
    if (query.locale) where.locale = query.locale

    const strings = await prisma.localeString.findMany({
      where,
      orderBy: [{ key: 'asc' }, { locale: 'asc' }],
      include: {
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(strings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error fetching strings:', error)
    return NextResponse.json({ error: 'Failed to fetch strings' }, { status: 500 })
  }
}

// POST /api/strings - Create a new string
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createStringSchema.parse(body)

    const localeString = await prisma.localeString.create({
      data,
    })

    return NextResponse.json(localeString, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating string:', error)
    return NextResponse.json({ error: 'Failed to create string' }, { status: 500 })
  }
}
