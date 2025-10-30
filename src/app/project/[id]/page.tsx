'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TeamDashboard from '@/components/dashboard/TeamDashboard'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">Please sign in to access this project.</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Code-Desk
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Code-Desk
            </Button>
          </Link>
        </div>
        
        <TeamDashboard
          projectId={projectId}
          userId={currentUser.id}
          userName={currentUser.name}
        />
      </div>
    </div>
  )
}