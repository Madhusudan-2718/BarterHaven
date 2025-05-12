-- Drop the profile_details table if it exists
DROP TABLE IF EXISTS profile_details;

-- Add bio column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_bio ON users(bio);

-- Grant necessary permissions
GRANT UPDATE (name, bio, profile_image_url) ON users TO authenticated; 