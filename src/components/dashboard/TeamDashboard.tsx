'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, FileText, CheckCircle, Clock, AlertCircle, Calendar, MessageSquare, Settings, Share2 } from 'lucide-react'
import FileUpload from '@/components/files/FileUpload'
import TaskManagement from '@/components/tasks/TaskManagement'
import ProjectChat from '@/components/chat/ProjectChat'

interface TeamDashboardProps {
  projectId: string
  userId: string
  userName: string
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  teamSize: number
  createdAt: string
  members: Array<{
    id: string
    user: {
      id: string
      name: string
      avatar?: string
    }
    role: string
  }>
  _count: {
    tasks: number
    files: number
    members: number
  }
}

interface ProjectStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  totalFiles: number
  totalMembers: number
  completionRate: number
}

export default function TeamDashboard({ projectId, userId, userName }: TeamDashboardProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<ProjectStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalFiles: 0,
    totalMembers: 0,
    completionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      const projectData = await projectResponse.json()
      
      if (projectResponse.ok) {
        setProject(projectData.project)
        
        // Check if current user is the owner
        const ownerMember = projectData.project.members?.find((member: any) => 
          member.user.id === userId && member.role === 'owner'
        )
        setIsOwner(!!ownerMember)
      }

      // Fetch project stats
      const [tasksResponse, filesResponse] = await Promise.all([
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch(`/api/files?projectId=${projectId}`)
      ])

      let tasks = []
      let files = []

      try {
        const tasksData = tasksResponse.ok ? await tasksResponse.json() : { tasks: [] }
        const filesData = filesResponse.ok ? await filesResponse.json() : { files: [] }

        // Ensure we have arrays
        tasks = Array.isArray(tasksData.tasks) ? tasksData.tasks : []
        files = Array.isArray(filesData.files) ? filesData.files : []
      } catch (error) {
        console.error('Error fetching project stats:', error)
        tasks = []
        files = []
      }

      const completedTasks = tasks.filter((task: any) => task.status === 'done').length
      const inProgressTasks = tasks.filter((task: any) => task.status === 'in_progress').length
      const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        totalFiles: files.length,
        totalMembers: projectData.project?.members?.length || 0,
        completionRate
      })

    } catch (error) {
      console.error('Failed to fetch project data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyProjectLink = () => {
    const link = `${window.location.origin}/project/${projectId}`
    navigator.clipboard.writeText(link)
    // You could add a toast notification here
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    fetchProjectData()
  }, [projectId, userId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Project Not Found</h3>
            <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                  {project.status === 'open' ? 'Open' : 'In Progress'}
                </Badge>
                {isOwner && (
                  <Badge variant="outline" className="text-purple-600">
                    Owner
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">
                {project.description}
              </CardDescription>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{stats.totalMembers}/{project.teamSize} members</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyProjectLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {isOwner && (
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-sm text-gray-600">Completed Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgressTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
                <p className="text-sm text-gray-600">Files Shared</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Project Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span>{Math.round(stats.completionRate)}%</span>
            </div>
            <Progress value={stats.completionRate} className="w-full" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="font-semibold text-gray-900">{stats.totalTasks}</p>
                <p className="text-gray-600">Total Tasks</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600">{stats.inProgressTasks}</p>
                <p className="text-gray-600">In Progress</p>
              </div>
              <div>
                <p className="font-semibold text-green-600">{stats.completedTasks}</p>
                <p className="text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members?.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.user.avatar} />
                  <AvatarFallback>
                    {member.user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                </div>
                {member.role === 'owner' && (
                  <Badge variant="outline" className="text-purple-600">
                    Owner
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <TaskManagement
            projectId={projectId}
            userId={userId}
            isOwner={isOwner}
          />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <FileUpload
            projectId={projectId}
            userId={userId}
            isOwner={isOwner}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ProjectChat
            projectId={projectId}
            userId={userId}
            userName={userName}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}