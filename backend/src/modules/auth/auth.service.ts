import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import type {
  RegisterSchoolInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from './auth.validator';

const SALT_ROUNDS = 12;

function signAccessToken(payload: {
  userId: string;
  schoolId: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function signRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

export async function registerSchool(data: RegisterSchoolInput) {
  const existing = await prisma.school.findUnique({ where: { slug: data.schoolSlug } });
  if (existing) {
    throw new AppError(409, 'A school with this slug already exists');
  }

  const passwordHash = await bcrypt.hash(data.adminPassword, SALT_ROUNDS);

  const school = await prisma.school.create({
    data: {
      slug: data.schoolSlug,
      name: data.schoolName,
      timezone: data.timezone ?? 'Asia/Dhaka',
      locale: data.locale ?? 'en',
      users: {
        create: {
          role: 'school_admin',
          email: data.adminEmail.toLowerCase(),
          passwordHash,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          phone: data.adminPhone,
        },
      },
    },
    include: { users: true },
  });

  // Seed default grade thresholds
  await prisma.gradeThreshold.createMany({
    data: [
      { schoolId: school.id, minPercent: 90, maxPercent: 100, label: 'A+', color: '#16a34a' },
      { schoolId: school.id, minPercent: 80, maxPercent: 89.99, label: 'A', color: '#22c55e' },
      { schoolId: school.id, minPercent: 70, maxPercent: 79.99, label: 'B+', color: '#84cc16' },
      { schoolId: school.id, minPercent: 60, maxPercent: 69.99, label: 'B', color: '#eab308' },
      { schoolId: school.id, minPercent: 50, maxPercent: 59.99, label: 'C', color: '#f97316' },
      { schoolId: school.id, minPercent: 40, maxPercent: 49.99, label: 'D', color: '#ef4444' },
      { schoolId: school.id, minPercent: 0, maxPercent: 39.99, label: 'F', color: '#991b1b' },
    ],
  });

  // Seed a starter set of classes + subjects so a brand-new school is usable right
  // away (the Add Student / Exam / Practice dropdowns need these). The admin can
  // rename, delete, or add to these from the Classes & Subjects pages.
  const academicYear = String(new Date().getFullYear());
  const defaultSubjects = [
    'Bangla',
    'English',
    'Mathematics',
    'Science',
    'Social Science',
    'Religion & Moral Education',
    'ICT',
  ];
  for (let grade = 1; grade <= 10; grade++) {
    const cls = await prisma.class.create({
      data: { schoolId: school.id, name: `Class ${grade}`, academicYear },
    });
    await prisma.subject.createMany({
      data: defaultSubjects.map((name) => ({ schoolId: school.id, classId: cls.id, name })),
    });
  }

  return { school, admin: school.users[0] };
}

// Global login — no slug required. Finds the user by email across all active schools.
// If the same email exists in multiple schools (rare), the first active match wins.
export async function loginGlobal(data: LoginInput, ip?: string, userAgent?: string) {
  const user = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), isActive: true, school: { isActive: true } },
    include: { school: { select: { id: true, slug: true, name: true } } },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const accessToken = signAccessToken({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const refreshTokenValue = signRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: { userId: user.id, schoolId: user.schoolId, token: refreshTokenValue, expiresAt: refreshExpiresAt },
    }),
    prisma.session.create({
      data: { userId: user.id, schoolId: user.schoolId, ip, userAgent },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    schoolSlug: user.school.slug,
    schoolName: user.school.name,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      photoUrl: user.photoUrl,
    },
  };
}

export async function login(data: LoginInput, schoolId: string, ip?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { schoolId_email: { schoolId, email: data.email.toLowerCase() } },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const accessToken = signAccessToken({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const refreshTokenValue = signRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        schoolId: user.schoolId,
        token: refreshTokenValue,
        expiresAt: refreshExpiresAt,
      },
    }),
    prisma.session.create({
      data: { userId: user.id, schoolId: user.schoolId, ip, userAgent },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      photoUrl: user.photoUrl,
    },
  };
}

export async function refreshTokens(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AppError(401, 'Refresh token expired or invalid');
  }

  const { user } = stored;
  const accessToken = signAccessToken({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  // Rotate refresh token
  const newRefreshToken = signRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        schoolId: user.schoolId,
        token: newRefreshToken,
        expiresAt: refreshExpiresAt,
      },
    }),
  ]);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function getMe(userId: string, schoolId: string) {
  const [user, school] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        photoUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        plan: true,
        timezone: true,
        locale: true,
      },
    }),
  ]);

  if (!user || !school) throw new AppError(404, 'User or school not found');

  return { user, school };
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      photoUrl: true,
    },
  });
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Invalidate other sessions by revoking refresh tokens for this user.
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
