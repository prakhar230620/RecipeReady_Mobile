import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authorized
    if (!session?.user?.email || 
        (session.user.email !== 'toolminesai@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid email ID' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Delete email record
    const result = await db.collection('emailHistory').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Email record not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Email record deleted successfully' })
  } catch (error) {
    console.error('Delete email record error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}