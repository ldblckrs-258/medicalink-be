-- Script to create default super admin
-- Run this script to manually create the super admin if migration fails
-- Email: superadmin@medicalink.com
-- Password: SuperAdmin123!

-- Check if super admin already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "StaffAccount" 
        WHERE "email" = 'superadmin@medicalink.com' 
        OR "role" = 'SUPER_ADMIN'
    ) THEN
        INSERT INTO "StaffAccount" (
            "fullName",
            "email", 
            "passwordHash",
            "role",
            "gender",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'Super Administrator',
            'superadmin@medicalink.com',
            '$2b$10$yBbMHQKmTw6yBUG4/WvGRey7zapM4bK8HxYtLP7OYRD6HmD8blszW',
            'SUPER_ADMIN',
            'UNKNOWN',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Super admin created successfully with email: superadmin@medicalink.com';
    ELSE
        RAISE NOTICE 'Super admin already exists. No action taken.';
    END IF;
END $$;