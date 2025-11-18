import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/export/[projectSlug]?locale=ja-JP
// Returns a JSON object with key-value pairs for the specified locale
export async function GET(
  request: NextRequest,
  { params }: { params: { projectSlug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale')

    // Find the project by slug
    const project = await prisma.project.findUnique({
      where: { slug: params.projectSlug },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use the project's default locale if none specified
    const targetLocale = locale || project.defaultLocale

    // Fetch all strings for the specified locale
    const strings = await prisma.localeString.findMany({
      where: {
        projectId: project.id,
        locale: targetLocale,
      },
      select: {
        key: true,
        value: true,
      },
    })

    // Convert to a simple key-value object
    const translations: Record<string, string> = {}
    strings.forEach(({ key, value }) => {
      translations[key] = value
    })

    return NextResponse.json(translations)
  } catch (error) {
    console.error('Error exporting translations:', error)
    return NextResponse.json({ error: 'Failed to export translations' }, { status: 500 })
  }
}
