import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, mobile } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      fullName,
      mobile: mobile || null,
      provider: 'credentials',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}