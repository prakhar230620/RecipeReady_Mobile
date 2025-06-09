import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { sendEmail, emailTemplates } from '@/lib/mail'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authorized
    if (!session?.user?.email || 
        (session.user.email !== 'toolminesai@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, content } = await request.json()

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Get all active users (not deleted)
    const users = await db.collection('users')
      .find({ isDeleted: { $ne: true } })
      .project({ email: 1, fullName: 1 })
      .toArray()

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No active users found' },
        { status: 404 }
      )
    }

    // Send email to all users
    const emailPromises = users.map(user => {
      return sendEmail(
        user.email,
        emailTemplates.bulkEmail(subject, content)
      )
    })

    await Promise.allSettled(emailPromises)

    // Save email record to database
    await db.collection('emailHistory').insertOne({
      subject,
      content,
      sentAt: new Date(),
      sentBy: session.user.email,
      recipientCount: users.length
    })

    return NextResponse.json({
      message: `Email sent to ${users.length} users`,
      recipientCount: users.length
    })
  } catch (error) {
    console.error('Send bulk email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}