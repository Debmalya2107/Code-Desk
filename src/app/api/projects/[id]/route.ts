import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    console.log('API: Fetching project with ID:', projectId)

    if (!projectId) {
      console.log('API: No project ID provided')
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            creator: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        milestones: true,
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })

    console.log('API: Database query result:', project ? 'Found' : 'Not found')

    if (!project) {
      console.log('API: Project not found in database')
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    console.log('API: Returning project:', project.title)
    return NextResponse.json({ project })
  } catch (error) {
    console.error('API: Project fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}