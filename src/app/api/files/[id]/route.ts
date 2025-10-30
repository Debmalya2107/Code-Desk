import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id

    // Get file info from database
    const file = await db.uploadedFile.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete file from disk
    try {
      await unlink(file.path)
    } catch (error) {
      console.error('Failed to delete file from disk:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete file record from database
    await db.uploadedFile.delete({
      where: { id: fileId }
    })

    return NextResponse.json({
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}