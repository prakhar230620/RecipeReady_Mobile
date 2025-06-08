-- Create the favorite_recipes table
CREATE TABLE IF NOT EXISTS favorite_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_user_id ON favorite_recipes(user_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_created_at ON favorite_recipes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own favorite recipes
CREATE POLICY "Users can view their own favorite recipes" ON favorite_recipes
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own favorite recipes
CREATE POLICY "Users can insert their own favorite recipes" ON favorite_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own favorite recipes
CREATE POLICY "Users can delete their own favorite recipes" ON favorite_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow users to update their own favorite recipes
CREATE POLICY "Users can update their own favorite recipes" ON favorite_recipes
  FOR UPDATE USING (auth.uid() = user_id);
