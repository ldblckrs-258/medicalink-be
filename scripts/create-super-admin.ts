import { Gender, PrismaClient, StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Get super admin credentials from environment variables
    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || 'superadmin@medicalink.com';
    const superAdminPassword =
      process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

    console.log(`Creating super admin with email: ${superAdminEmail}`);

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.staffAccount.findFirst({
      where: {
        OR: [{ email: superAdminEmail }, { role: StaffRole.SUPER_ADMIN }],
      },
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists. No action taken.');
      console.log(
        `Existing super admin: ${existingSuperAdmin.email} (ID: ${existingSuperAdmin.id})`,
      );
      return;
    }

    // Create super admin with environment password
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.staffAccount.create({
      data: {
        fullName: 'Super Administrator',
        email: superAdminEmail,
        passwordHash: passwordHash,
        role: StaffRole.SUPER_ADMIN,
        gender: Gender.UNKNOWN,
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log(`ID: ${superAdmin.id}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log('⚠️ Please change the default password after first login!');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSuperAdmin().catch((error) => {
  console.error('Failed to create super admin:', error);
  process.exit(1);
});
