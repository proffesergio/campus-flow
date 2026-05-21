import { School, User, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant: {
        schoolId: string;
        slug: string;
        school: School;
      };
      user: {
        userId: string;
        schoolId: string;
        role: Role;
        email: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export {};
