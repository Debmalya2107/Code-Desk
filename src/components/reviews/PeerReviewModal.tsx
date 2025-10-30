'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, MessageSquare, User, CheckCircle, AlertCircle } from 'lucide-react'

interface PeerReviewModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
  taskId?: string
  userId: string
  teamMembers: Array<{
    id: string
    name: string
    avatar?: string
  }>
  onReviewSubmitted: () => void
}

export default function PeerReviewModal({ 
  isOpen, 
  onClose, 
  projectId, 
  taskId, 
  userId, 
  teamMembers, 
  onReviewSubmitted 
}: PeerReviewModalProps) {
  const [selectedReviewee, setSelectedReviewee] = useState('')
  const [rating, setRating] = useState(5)
  const [comments, setComments] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!selectedReviewee) {
      setError('Please select a team member to review')
      setIsLoading(false)
      return
    }

    if (!comments.trim()) {
      setError('Please provide comments for your review')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId,
          projectId,
          reviewerId: userId,
          revieweeId: selectedReviewee,
          rating,
          comments: comments.trim(),
          anonymous
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Review submitted successfully!')
        setTimeout(() => {
          handleClose()
          onReviewSubmitted()
        }, 1500)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReviewee('')
      setRating(5)
      setComments('')
      setAnonymous(false)
      setError('')
      setSuccess('')
      onClose()
    }
  }

  const eligibleReviewees = teamMembers.filter(member => member.id !== userId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Peer Review
          </CardTitle>
          <CardDescription>
            Provide constructive feedback to your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Select Reviewee */}
            <div className="space-y-2">
              <Label>Team Member to Review</Label>
              <Select value={selectedReviewee} onValueChange={setSelectedReviewee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleReviewees.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">({rating}/5)</span>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments *</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide specific, constructive feedback..."
                rows={4}
                required
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="anonymous" className="text-sm">
                Submit review anonymously
              </Label>
            </div>

            {/* Review Guidelines */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Be specific, constructive, and respectful. Focus on the work, not the person.
              </AlertDescription>
            </Alert>

            {/* Alerts */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}