// Node.js script to set up the database

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

async function setupDatabase() {
  // Check for environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")
    process.exit(1)
  }

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log("Reading SQL script...")
    const sqlPath = path.join(__dirname, "setup-database.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    console.log("Setting up database...")

    // Execute the SQL
    const { error } = await supabase.rpc("pgclient", { query: sql })

    if (error) {
      throw error
    }

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up database:", error)
    process.exit(1)
  }
}

setupDatabase()
