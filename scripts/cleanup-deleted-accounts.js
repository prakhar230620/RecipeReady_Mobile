// This script is meant to be run as a cron job to permanently delete accounts
// that were marked for deletion more than 30 days ago

require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')

async function cleanupDeletedAccounts() {
  let client

  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const usersCollection = db.collection('users')

    // Find accounts marked for deletion where the scheduled deletion date has passed
    const now = new Date()
    const result = await usersCollection.deleteMany({
      isDeleted: true,
      deletionScheduledAt: { $lt: now }
    })

    console.log(`Permanently deleted ${result.deletedCount} accounts`)
  } catch (error) {
    console.error('Error cleaning up deleted accounts:', error)
  } finally {
    if (client) {
      await client.close()
      console.log('MongoDB connection closed')
    }
  }
}

// Run the cleanup function
cleanupDeletedAccounts()