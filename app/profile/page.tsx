'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, LogOut, Settings, Moon, Sun, Info, Bell, Edit, Save, X, Trash2, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Switch } from '@/components/ui/switch'
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

export default function ProfilePage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
    mobile: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Check if the current user is admin
  const isAdmin = session?.user?.email === 'toolminesai@gmail.com'

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile({
          fullName: data.user.fullName || '',
          email: data.user.email || '',
          mobile: data.user.mobile || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleSave = async () => {
    if (userProfile.newPassword && userProfile.newPassword !== userProfile.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (userProfile.newPassword && userProfile.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: userProfile.fullName,
          mobile: userProfile.mobile,
          currentPassword: userProfile.currentPassword,
          newPassword: userProfile.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setEditing(false)
        setUserProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    fetchUserProfile() // Reset to original values
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Account scheduled for deletion. You will be signed out.')
        // Sign out after successful deletion request
        setTimeout(() => {
          signOut({ callbackUrl: '/auth/signin' })
        }, 2000)
      } else {
        toast.error(data.error || 'Failed to delete account')
        setDeleteLoading(false)
      }
    } catch (error) {
      toast.error('Something went wrong')
      setDeleteLoading(false)
    }
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="mobile-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={userProfile.fullName}
                onChange={(e) => setUserProfile(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={!editing}
                className={!editing ? 'bg-muted' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userProfile.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={userProfile.mobile}
                onChange={(e) => setUserProfile(prev => ({ ...prev, mobile: e.target.value }))}
                disabled={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Enter mobile number"
              />
            </div>

            {editing && session.user.email && !session.user.image && !isAdmin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={userProfile.currentPassword}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password to change"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={userProfile.newPassword}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={userProfile.confirmPassword}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {editing ? (
            <>
              <Button onClick={handleSave} disabled={loading} className="flex-1 rounded-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1 rounded-full">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleSignOut} variant="outline" className="w-full rounded-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="mobile-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-4 w-4 text-accent" /> : <Sun className="h-4 w-4 text-accent" />}
              <Label htmlFor="theme-mode">Dark Mode</Label>
            </div>
            <Switch
              id="theme-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mobile-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>RecipeReady v1.0.0</p>
          <p className="text-muted-foreground">
            An AI-powered recipe generator that helps you create delicious meals with the ingredients you have.
          </p>
          <div className="pt-2 space-y-1">
            <Link href="/privacy-policy" className="text-primary block">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-primary block">
              Terms of Service
            </Link>
          </div>
        </CardContent>
      </Card>

      {!isAdmin && (
        <Card className="mobile-card border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <p className="text-muted-foreground">
              Note: Your data will be retained for 30 days before permanent deletion. If you sign up again with the same email within this period, your account can be restored.
            </p>
            <div className="pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your account? Your data will be retained for 30 days before permanent deletion. After that, all your data will be permanently removed and cannot be recovered.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}