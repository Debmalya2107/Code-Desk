'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Target, 
  Users, 
  Star, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Award,
  Activity
} from 'lucide-react'

interface AnalyticsDashboardProps {
  userId: string
}

interface Analytics {
  user?: {
    totalProjects: number
    completedProjects: number
    totalTasks: number
    completedTasks: number
    totalReviews: number
    averageRating: number
    taskCompletionRate: number
    projectSuccessRate: number
  }
  recentActivity?: Array<{
    type: string
    title: string
    status?: string
    rating?: number
    date: string
    project?: string
  }>
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [userId])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (activity: any) => {
    switch (activity.type) {
      case 'task':
        return activity.status === 'done' ? 
          <CheckCircle className="w-4 h-4 text-green-600" /> : 
          <Target className="w-4 h-4 text-blue-600" />
      case 'review':
        return <Star className="w-4 h-4 text-yellow-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics?.user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-gray-600">Start joining projects and completing tasks to see your analytics.</p>
        </CardContent>
      </Card>
    )
  }

  const { user } = analytics

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{user.totalProjects}</p>
                <p className="text-xs text-gray-500">
                  {user.completedProjects} completed
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                <p className="text-2xl font-bold">{user.completedTasks}</p>
                <p className="text-xs text-gray-500">
                  of {user.totalTasks} total
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{user.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">
                  from {user.totalReviews} reviews
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{user.projectSuccessRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">
                  projects completed
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Your overall performance across projects and tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Task Completion Rate</span>
                    <span className="text-sm text-gray-600">{user.taskCompletionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={user.taskCompletionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Project Success Rate</span>
                    <span className="text-sm text-gray-600">{user.projectSuccessRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={user.projectSuccessRate} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{user.totalTasks}</p>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{user.completedTasks}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Review Summary
                </CardTitle>
                <CardDescription>
                  Your peer review performance and ratings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">
                    {user.averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(user.averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Based on {user.totalReviews} reviews
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{user.totalProjects}</p>
                      <p className="text-sm text-gray-600">Projects Joined</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{user.completedProjects}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Progress Overview
              </CardTitle>
              <CardDescription>
                Track your progress and achievements over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Project Explorer</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    You've joined {user.totalProjects} projects
                  </p>
                  <Badge variant="outline">
                    {user.completedProjects} completed
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Task Master</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {user.completedTasks} tasks completed
                  </p>
                  <Badge variant="outline">
                    {user.taskCompletionRate.toFixed(1)}% rate
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Team Player</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {user.averageRating.toFixed(1)} average rating
                  </p>
                  <Badge variant="outline">
                    {user.totalReviews} reviews
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest activities and accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentActivity?.length ? (
                  analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                      {getActivityIcon(activity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {activity.project && (
                            <span className="text-xs text-gray-500">
                              in {activity.project}
                            </span>
                          )}
                          {activity.status && (
                            <Badge variant="outline" className={`text-xs ${getStatusColor(activity.status)}`}>
                              {activity.status.replace('_', ' ')}
                            </Badge>
                          )}
                          {activity.rating && (
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-gray-500 ml-1">
                                {activity.rating}/5
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Start joining projects and completing tasks to see your activity here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}