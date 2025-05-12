-- Create the function to add bio column
CREATE OR REPLACE FUNCTION add_bio_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE users
        ADD COLUMN bio TEXT;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_bio_column() TO authenticated; 