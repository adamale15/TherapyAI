-- Vesh Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'practitioner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  remember_me BOOLEAN DEFAULT FALSE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  occupation TEXT NOT NULL,
  condition TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  description TEXT NOT NULL,
  personality JSONB NOT NULL,
  background JSONB NOT NULL,
  voice_settings JSONB NOT NULL,
  system_prompt TEXT NOT NULL,
  few_shot_examples JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for personas
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_is_default ON personas(is_default);
CREATE INDEX IF NOT EXISTS idx_personas_difficulty ON personas(difficulty);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id TEXT REFERENCES personas(id) ON DELETE SET NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_persona_id ON chat_sessions(persona_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at);

-- Session history table (for tracking completed sessions)
CREATE TABLE IF NOT EXISTS session_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id TEXT REFERENCES personas(id) ON DELETE SET NULL,
  persona_name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  total_messages INTEGER NOT NULL,
  scores JSONB NOT NULL, -- {empathy, technique, management, crisis}
  messages JSONB NOT NULL, -- full conversation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for session history
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_session_history_persona_id ON session_history(persona_id);
CREATE INDEX IF NOT EXISTS idx_session_history_created_at ON session_history(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

