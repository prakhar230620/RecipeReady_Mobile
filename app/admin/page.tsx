'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Send, Trash2, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EmailRecord {
  id: string
  subject: string
  content: string
  sentAt: string
  sentBy: string
  recipientCount: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: ''
  })
  const [emailHistory, setEmailHistory] = useState<EmailRecord[]>([])
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authorized to access admin page
    if (status === 'authenticated') {
      const isAuthorized = 
        session?.user?.email === 'toolminesai@gmail.com'

      if (!isAuthorized) {
        router.push('/')
        toast.error('Unauthorized access')
      } else {
        fetchEmailHistory()
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
    }
  }, [session, status, router])

  const fetchEmailHistory = async () => {
    try {
      const response = await fetch('/api/admin/emails')
      if (response.ok) {
        const data = await response.json()
        setEmailHistory(data.emails)
      }
    } catch (error) {
      console.error('Error fetching email history:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEmailForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailForm.subject || !emailForm.content) {
      toast.error('Subject and content are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailForm)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Email sent successfully!')
        setEmailForm({
          subject: '',
          content: ''
        })
        fetchEmailHistory()
      } else {
        toast.error(data.error || 'Failed to send email')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmail = async () => {
    if (!selectedEmailId) return
    
    setDeleteLoading(true)

    try {
      const response = await fetch(`/api/admin/emails/${selectedEmailId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Email record deleted')
        fetchEmailHistory()
        setSelectedEmailId(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete email record')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && !session?.user?.email)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Admin Email Dashboard
          </CardTitle>
          <CardDescription>
            Send emails to all users and manage email history
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="compose">
        <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
          <TabsTrigger value="compose" className="flex items-center gap-1">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Compose</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-3 sm:mt-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Send Email to All Users</CardTitle>
              <CardDescription>
                Compose an email to send to all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendEmail} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={emailForm.subject}
                    onChange={handleChange}
                    placeholder="Enter email subject"
                    required
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={emailForm.content}
                    onChange={handleChange}
                    placeholder="Enter email content"
                    rows={10}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span className="hidden xs:inline">Send Email to All Users</span>
                      <span className="xs:hidden">Send Email</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-3 sm:mt-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Email History</CardTitle>
              <CardDescription>
                View and manage previously sent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailHistory.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                  <p>No emails have been sent yet</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {emailHistory.map((email) => (
                    <Card key={email.id} className="overflow-hidden">
                      <CardHeader className="p-3 sm:p-4 sm:pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-base truncate">{email.subject}</CardTitle>
                            <CardDescription className="text-xs">
                              Sent on {new Date(email.sentAt).toLocaleDateString()} {new Date(email.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} by {email.sentBy}
                            </CardDescription>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                                onClick={() => setSelectedEmailId(email.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Delete Email Record
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this email record? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteEmail}
                                  disabled={deleteLoading}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteLoading ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 pb-3 pt-0">
                        <div className="text-xs sm:text-sm border-l-2 border-muted pl-2 sm:pl-3 py-1 my-1 sm:my-2 line-clamp-3">
                          {email.content}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Sent to {email.recipientCount} recipients</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}