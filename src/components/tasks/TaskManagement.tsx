'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, CheckCircle, Clock, AlertCircle, User, Calendar, Flag } from 'lucide-react'

interface TaskManagementProps {
  projectId: string
  userId: string
  isOwner: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  creator: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  dueDate?: string
}

interface ProjectMember {
  id: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  role: string
}

export default function TaskManagement({ projectId, userId, isOwner }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigneeId: '',
    dueDate: ''
  })

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`)
      const data = await response.json()
      
      if (response.ok) {
        // Ensure we have an array
        const tasksArray = Array.isArray(data.tasks) ? data.tasks : []
        setTasks(tasksArray)
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      const data = await response.json()
      
      if (response.ok) {
        // Ensure we have an array
        const membersArray = Array.isArray(data.members) ? data.members : []
        setMembers(membersArray)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
      setMembers([])
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          assigneeId: newTask.assigneeId === 'unassigned' ? null : newTask.assigneeId,
          creatorId: userId,
          projectId,
          dueDate: newTask.dueDate || null
        })
      })

      if (response.ok) {
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          assigneeId: '',
          dueDate: ''
        })
        setIsCreateDialogOpen(false)
        await fetchTasks()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId,
          status: newStatus
        })
      })

      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="w-4 h-4" />
      case 'in_progress': return <AlertCircle className="w-4 h-4" />
      case 'review': return <Flag className="w-4 h-4" />
      case 'done': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'medium': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      case 'high': return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    review: tasks.filter(task => task.status === 'review'),
    done: tasks.filter(task => task.status === 'done')
  }

  useEffect(() => {
    fetchTasks()
    fetchMembers()
  }, [projectId])

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Task Management
            </CardTitle>
            <CardDescription>
              Track and manage project tasks with your team
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to track project progress
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({ ...newTask, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignee">Assignee</Label>
                      <Select value={newTask.assigneeId} onValueChange={(value) => setNewTask({ ...newTask, assigneeId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {members.map((member) => (
                            <SelectItem key={member.user.id} value={member.user.id}>
                              {member.user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTask} disabled={!newTask.title.trim()}>
                      Create Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Todo Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold">To Do</h3>
              <Badge variant="secondary">{tasksByStatus.todo.length}</Badge>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {tasksByStatus.todo.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOwner={isOwner}
                    onStatusChange={updateTaskStatus}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityIcon={getPriorityIcon}
                  />
                ))}
                {tasksByStatus.todo.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks to do
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* In Progress Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold">In Progress</h3>
              <Badge variant="secondary">{tasksByStatus.in_progress.length}</Badge>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {tasksByStatus.in_progress.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOwner={isOwner}
                    onStatusChange={updateTaskStatus}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityIcon={getPriorityIcon}
                  />
                ))}
                {tasksByStatus.in_progress.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks in progress
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Review Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-yellow-600" />
              <h3 className="font-semibold">Review</h3>
              <Badge variant="secondary">{tasksByStatus.review.length}</Badge>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {tasksByStatus.review.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOwner={isOwner}
                    onStatusChange={updateTaskStatus}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityIcon={getPriorityIcon}
                  />
                ))}
                {tasksByStatus.review.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks to review
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Done Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold">Done</h3>
              <Badge variant="secondary">{tasksByStatus.done.length}</Badge>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {tasksByStatus.done.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOwner={isOwner}
                    onStatusChange={updateTaskStatus}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityIcon={getPriorityIcon}
                  />
                ))}
                {tasksByStatus.done.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No completed tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TaskCardProps {
  task: Task
  isOwner: boolean
  onStatusChange: (taskId: string, newStatus: string) => void
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
  getStatusIcon: (status: string) => React.ReactNode
  getPriorityIcon: (priority: string) => React.ReactNode
}

function TaskCard({
  task,
  isOwner,
  onStatusChange,
  getStatusColor,
  getPriorityColor,
  getStatusIcon,
  getPriorityIcon
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(task.status)}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(task.status)}
                <span className="text-xs">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              <span className="text-xs">{task.priority}</span>
            </Badge>
          </div>

          {task.assignee && (
            <div className="flex items-center space-x-2">
              <Avatar className="w-4 h-4">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">{task.assignee.name}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {task.description && (
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
              {isExpanded && (
                <p className="text-xs text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
          )}

          {/* Task completion checkbox for owners */}
          {isOwner && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.status === 'done'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onStatusChange(task.id, 'done')
                  } else {
                    onStatusChange(task.id, 'todo')
                  }
                }}
              />
              <Label htmlFor={`task-${task.id}`} className="text-xs">
                Mark as {task.status === 'done' ? 'incomplete' : 'complete'}
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}