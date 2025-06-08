import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type Database = {
  public: {
    Tables: {
      favorite_recipes: {
        Row: {
          id: string
          user_id: string
          recipe_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_data?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
