import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStringSchema = z.object({
  key: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  value: z.string().optional(),
  description: z.string().optional().nullable(),
})

// GET /api/strings/[id] - Get a single string
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const localeString = await prisma.localeString.findUnique({
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

    if (!localeString) {
      return NextResponse.json({ error: 'String not found' }, { status: 404 })
    }

    return NextResponse.json(localeString)
  } catch (error) {
    console.error('Error fetching string:', error)
    return NextResponse.json({ error: 'Failed to fetch string' }, { status: 500 })
  }
}

// PATCH /api/strings/[id] - Update a string
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateStringSchema.parse(body)

    const localeString = await prisma.localeString.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(localeString)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating string:', error)
    return NextResponse.json({ error: 'Failed to update string' }, { status: 500 })
  }
}

// DELETE /api/strings/[id] - Delete a string
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.localeString.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting string:', error)
    return NextResponse.json({ error: 'Failed to delete string' }, { status: 500 })
  }
}
