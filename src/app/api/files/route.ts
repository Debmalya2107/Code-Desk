import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const uploaderId = searchParams.get('uploaderId')

    let whereClause: any = {}

    if (projectId) whereClause.projectId = projectId
    if (uploaderId) whereClause.uploaderId = uploaderId

    const files = await db.uploadedFile.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Files fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const uploaderId = formData.get('uploaderId') as string

    if (!file || !uploaderId) {
      return NextResponse.json(
        { error: 'File and uploader ID are required' },
        { status: 400 }
      )
    }

    // Verify uploader is a member of the project if projectId is provided
    if (projectId) {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: uploaderId
          }
        }
      })

      if (!membership) {
        return NextResponse.json(
          { error: 'User is not a member of this project' },
          { status: 403 }
        )
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFilename)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save file info to database
    const uploadedFile = await db.uploadedFile.create({
      data: {
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        projectId: projectId || null,
        uploaderId
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: uploadedFile
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}