import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { sendEmail, emailTemplates } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const user = await db.collection('users').findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Schedule account for deletion (30 days from now)
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: {
          isDeleted: true,
          deletionScheduledAt: deletionDate,
          updatedAt: new Date()
        }
      }
    )

    // Send account deletion email
    try {
      await sendEmail(
        user.email,
        emailTemplates.accountDeletion(user.fullName)
      )
    } catch (emailError) {
      console.error('Error sending account deletion email:', emailError)
      // Continue with deletion process even if email fails
    }

    return NextResponse.json({ 
      message: 'Account scheduled for deletion. Your data will be permanently deleted after 30 days.'
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}