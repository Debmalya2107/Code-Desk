import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skill = searchParams.get('skill')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by skill if specified
    let filteredProjects = projects
    if (skill && skill !== 'all') {
      filteredProjects = projects.filter(project =>
        project.skills.some(ps => ps.skill.name.toLowerCase() === skill.toLowerCase())
      )
    }

    return NextResponse.json({ projects: filteredProjects })
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      description, 
      teamSize, 
      requiredSkills, 
      userId,
      milestones 
    } = await request.json()

    console.log('Project creation request:', { title, description, teamSize, userId })

    if (!title || !description || !teamSize || !userId) {
      return NextResponse.json(
        { error: 'Title, description, team size, and user ID are required' },
        { status: 400 }
      )
    }

    // Verify user exists first
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.log('User not found:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('User found:', user.name, user.id)

    // Create project
    const project = await db.project.create({
      data: {
        title,
        description,
        teamSize,
        status: 'open',
        members: {
          create: {
            userId,
            role: 'owner'
          }
        }
      }
    })

    // Add required skills
    if (requiredSkills && requiredSkills.length > 0) {
      for (const skillData of requiredSkills) {
        const skill = await db.skill.upsert({
          where: { name: skillData.name },
          update: {},
          create: {
            name: skillData.name,
            category: skillData.category || 'General'
          }
        })

        await db.projectSkill.create({
          data: {
            projectId: project.id,
            skillId: skill.id,
            required: true,
            level: skillData.level || 3
          }
        })
      }
    }

    // Add milestones if provided
    if (milestones && milestones.length > 0) {
      for (const milestone of milestones) {
        await db.milestone.create({
          data: {
            title: milestone.title,
            description: milestone.description,
            projectId: project.id,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null
          }
        })
      }
    }

    // Fetch the complete project with relations
    const completeProject = await db.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: {
            user: true
          }
        },
        skills: {
          include: {
            skill: true
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

    return NextResponse.json({
      message: 'Project created successfully',
      project: completeProject
    })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}