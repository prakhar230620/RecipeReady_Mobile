import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const user = await db.collection('users').findOne(
      { email: session.user.email },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, mobile, currentPassword, newPassword } = await request.json()

    const db = await getDatabase()
    const user = await db.collection('users').findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: any = {
      fullName,
      mobile,
      updatedAt: new Date()
    }

    // If user wants to change password
    if (newPassword && currentPassword) {
      if (user.provider === 'google') {
        return NextResponse.json(
          { error: 'Cannot change password for Google account' },
          { status: 400 }
        )
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: updateData }
    )

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}