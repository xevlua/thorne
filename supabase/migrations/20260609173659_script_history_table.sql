CREATE TABLE script_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('obfuscated', 'deobfuscated')),
  original_length INTEGER NOT NULL,
  result_length INTEGER NOT NULL,
  level TEXT CHECK (level IN ('low', 'medium', 'high', 'extreme')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE script_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "select_own_history" ON script_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_history" ON script_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_history" ON script_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_script_history_user_id ON script_history(user_id);
CREATE INDEX idx_script_history_created_at ON script_history(created_at DESC);