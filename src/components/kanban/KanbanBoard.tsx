'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Clock, User, Calendar, AlertCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
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
  dueDate?: string
  createdAt: string
}

interface KanbanBoardProps {
  projectId: string
  userId: string
}

interface Column {
  id: string
  title: string
  status: string
  color: string
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do', status: 'todo', color: 'border-gray-300' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'border-blue-300' },
  { id: 'review', title: 'Review', status: 'review', color: 'border-yellow-300' },
  { id: 'done', title: 'Done', status: 'done', color: 'border-green-300' }
]

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800'
}

export default function KanbanBoard({ projectId, userId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({
    todo: [],
    in_progress: [],
    review: [],
    done: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`)
      const data = await response.json()

      if (response.ok) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    
    if (!draggedTask) return

    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: draggedTask.id,
          status: newStatus,
          userId
        })
      })

      if (response.ok) {
        // Update local state
        setTasks(prev => {
          const newTasks = { ...prev }
          // Remove from old column
          Object.keys(newTasks).forEach(status => {
            newTasks[status] = newTasks[status].filter(task => task.id !== draggedTask.id)
          })
          // Add to new column
          newTasks[newStatus] = [...newTasks[newStatus], { ...draggedTask, status: newStatus }]
          return newTasks
        })
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }

    setDraggedTask(null)
  }

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return ''
    
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600'
    if (diffDays <= 1) return 'text-orange-600'
    if (diffDays <= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={() => handleDragStart(task)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            <Badge className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {task.assignee ? (
                <div className="flex items-center space-x-1">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-xs">
                      {task.assignee.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">{task.assignee.name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>
            
            {task.dueDate && (
              <div className={`flex items-center space-x-1 text-xs ${getDueDateColor(task.dueDate)}`}>
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Tasks</h3>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <Card className={`${column.color} border-t-4`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="text-xs">
                    {tasks[column.status]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div 
                    className="p-3 min-h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.status)}
                  >
                    {tasks[column.status]?.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    
                    {tasks[column.status]?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks yet</p>
                        <p className="text-xs">Drag tasks here or create new ones</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Create Task Modal would go here */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Add a new task to the project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Task Title</label>
                  <input 
                    type="text" 
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="w-full mt-1 p-2 border rounded"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Create Task</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}