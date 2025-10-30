import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id

    // Get file info from database
    const file = await db.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file from disk
    const fileBuffer = await readFile(file.path)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.size.toString()
      }
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}