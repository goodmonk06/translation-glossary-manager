import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTermSchema = z.object({
  sourceTerm: z.string().min(1).optional(),
  sourceLocale: z.string().min(1).optional(),
  targetLocale: z.string().min(1).optional(),
  targetTerm: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  tagsJson: z.string().optional().nullable(),
})

// GET /api/glossary-terms/[id] - Get a single glossary term
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const term = await prisma.glossaryTerm.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!term) {
      return NextResponse.json({ error: 'Glossary term not found' }, { status: 404 })
    }

    return NextResponse.json(term)
  } catch (error) {
    console.error('Error fetching glossary term:', error)
    return NextResponse.json({ error: 'Failed to fetch glossary term' }, { status: 500 })
  }
}

// PATCH /api/glossary-terms/[id] - Update a glossary term
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateTermSchema.parse(body)

    const term = await prisma.glossaryTerm.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(term)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating glossary term:', error)
    return NextResponse.json({ error: 'Failed to update glossary term' }, { status: 500 })
  }
}

// DELETE /api/glossary-terms/[id] - Delete a glossary term
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.glossaryTerm.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting glossary term:', error)
    return NextResponse.json({ error: 'Failed to delete glossary term' }, { status: 500 })
  }
}
