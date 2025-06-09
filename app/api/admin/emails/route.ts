import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authorized
    if (!session?.user?.email || 
        (session.user.email !== 'toolminesai@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    
    // Get email history sorted by most recent first
    const emails = await db.collection('emailHistory')
      .find({})
      .sort({ sentAt: -1 })
      .toArray()

    // Transform MongoDB _id to id for frontend
    const formattedEmails = emails.map(email => ({
      id: email._id.toString(),
      subject: email.subject,
      content: email.content,
      sentAt: email.sentAt,
      sentBy: email.sentBy,
      recipientCount: email.recipientCount
    }))

    return NextResponse.json({ emails: formattedEmails })
  } catch (error) {
    console.error('Get email history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}