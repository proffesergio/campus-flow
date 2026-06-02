/**
 * Demo seed for one realistic Bangladeshi high school.
 *
 *   npm run prisma:seed
 *
 * Idempotent: wipes and recreates the school with slug `dhaka-model`.
 * Creates one account per role (password: Password123) plus a parent linked
 * to two children, classes 6–10 (sections A/B), ~150 students, a midterm exam
 * with grades per class, recent attendance, and a mix of invoices.
 *
 * Login with X-School-Slug: dhaka-model
 *   admin@dhaka-model.test    (school_admin)
 *   teacher@dhaka-model.test  (teacher)
 *   finance@dhaka-model.test  (finance)
 *   parent@dhaka-model.test   (parent — 2 children)
 *   student@dhaka-model.test  (student — parent's first child)
 */
import { PrismaClient, Role, AttendanceStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SLUG = 'dhaka-model';
const PASSWORD = 'Password123';

const FIRST = ['Arif', 'Tahmid', 'Nusrat', 'Sadia', 'Rakib', 'Mim', 'Hasan', 'Farzana', 'Imran', 'Tania', 'Sabbir', 'Jannat', 'Naim', 'Sumaiya', 'Fahim', 'Rumana', 'Tanvir', 'Lamia', 'Shakib', 'Ayesha'];
const LAST = ['Hossain', 'Islam', 'Akter', 'Rahman', 'Chowdhury', 'Khan', 'Begum', 'Ahmed', 'Uddin', 'Sultana'];
const SUBJECTS = ['Bangla', 'English', 'Mathematics', 'Science', 'Social Science'];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]!;
const rand = (n: number) => Math.floor(Math.random() * n);

function gradeLetter(pct: number): string {
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'A-';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
}

/** Last N weekdays (Sun–Thu school week in Bangladesh; we just skip Fri/Sat). */
function recentSchoolDays(n: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < n) {
    const dow = d.getDay(); // 0 Sun … 6 Sat
    if (dow !== 5 && dow !== 6) days.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

async function wipeDemoSchool() {
  const school = await prisma.school.findUnique({ where: { slug: SLUG } });
  if (!school) return;
  const schoolId = school.id;
  // Delete in FK-safe order (no cascades defined on most relations).
  await prisma.grade.deleteMany({ where: { schoolId } });
  await prisma.attendance.deleteMany({ where: { schoolId } });
  await prisma.payment.deleteMany({ where: { schoolId } });
  await prisma.invoice.deleteMany({ where: { schoolId } });
  await prisma.exam.deleteMany({ where: { schoolId } });
  await prisma.feeStructure.deleteMany({ where: { schoolId } });
  await prisma.practiceMaterial.deleteMany({ where: { schoolId } });
  await prisma.subject.deleteMany({ where: { schoolId } });
  await prisma.inAppNotification.deleteMany({ where: { schoolId } });
  await prisma.notificationLog.deleteMany({ where: { schoolId } });
  await prisma.device.deleteMany({ where: { schoolId } });
  await prisma.gradeThreshold.deleteMany({ where: { schoolId } });
  await prisma.student.deleteMany({ where: { schoolId } });
  await prisma.class.deleteMany({ where: { schoolId } });
  await prisma.refreshToken.deleteMany({ where: { schoolId } });
  await prisma.session.deleteMany({ where: { schoolId } });
  await prisma.user.deleteMany({ where: { schoolId } });
  await prisma.school.delete({ where: { id: schoolId } });
}

async function main() {
  console.log('Seeding demo school…');
  await wipeDemoSchool();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const school = await prisma.school.create({
    data: {
      slug: SLUG,
      name: 'Dhaka Model High School',
      plan: 'pro',
      locale: 'en',
      timezone: 'Asia/Dhaka',
      address: 'Mirpur-10, Dhaka 1216',
      phone: '+8801711000000',
      email: 'office@dhaka-model.test',
      primaryColor: '#047857',
      secondaryColor: '#0EA5E9',
    },
  });
  const schoolId = school.id;

  const mkUser = (role: Role, email: string, firstName: string, lastName: string) =>
    prisma.user.create({
      data: { schoolId, role, email, passwordHash, firstName, lastName, phone: '+8801712000000' },
    });

  await mkUser('school_admin', 'admin@dhaka-model.test', 'Rahim', 'Uddin');
  await mkUser('finance', 'finance@dhaka-model.test', 'Shirin', 'Akter');
  const parent = await mkUser('parent', 'parent@dhaka-model.test', 'Karim', 'Hossain');
  const studentUser = await mkUser('student', 'student@dhaka-model.test', 'Tanvir', 'Hossain');
  const teachers = await Promise.all(
    ['teacher@dhaka-model.test', 'teacher2@dhaka-model.test', 'teacher3@dhaka-model.test'].map((e, i) =>
      mkUser('teacher', e, pick(['Nasima', 'Jahangir', 'Roksana'], i), pick(LAST, i)),
    ),
  );

  // Classes 6–10, sections A & B
  const classes: { id: string; name: string; section: string }[] = [];
  for (const grade of [6, 7, 8, 9, 10]) {
    for (const section of ['A', 'B']) {
      const c = await prisma.class.create({
        data: {
          schoolId,
          name: `Class ${grade}`,
          section,
          academicYear: '2025-2026',
          teacherId: teachers[rand(teachers.length)]!.id,
          capacity: 40,
        },
      });
      classes.push({ id: c.id, name: c.name, section: section });
      // Subjects per class
      for (let s = 0; s < SUBJECTS.length; s++) {
        await prisma.subject.create({
          data: {
            schoolId,
            classId: c.id,
            name: SUBJECTS[s]!,
            code: `${SUBJECTS[s]!.slice(0, 3).toUpperCase()}-${grade}`,
            teacherId: teachers[rand(teachers.length)]!.id,
            creditHours: 4,
          },
        });
      }
    }
  }

  // Students (~15 per class = 150), with a few linked to the demo parent
  const students: { id: string; classId: string }[] = [];
  let nameIdx = 0;
  for (const c of classes) {
    for (let roll = 1; roll <= 15; roll++) {
      const firstName = pick(FIRST, nameIdx);
      const lastName = pick(LAST, nameIdx);
      nameIdx++;
      const st = await prisma.student.create({
        data: {
          schoolId,
          classId: c.id,
          rollNumber: String(roll),
          firstName,
          lastName,
          guardianName: `${pick(FIRST, nameIdx + 3)} ${lastName}`,
          guardianPhone: `+88017${String(10000000 + nameIdx).slice(0, 8)}`,
          guardianEmail: `guardian${nameIdx}@example.test`,
          status: 'active',
          gender: roll % 2 === 0 ? 'female' : 'male',
        },
      });
      students.push({ id: st.id, classId: c.id });
    }
  }

  // Link the demo parent to two children (one is also the demo student account)
  const class8A = classes.find((c) => c.name === 'Class 8' && c.section === 'A')!;
  const class6A = classes.find((c) => c.name === 'Class 6' && c.section === 'A')!;
  const child1 = students.find((s) => s.classId === class8A.id)!;
  const child2 = students.find((s) => s.classId === class6A.id)!;
  await prisma.student.update({
    where: { id: child1.id },
    data: { parentId: parent.id, userId: studentUser.id, firstName: 'Tanvir', lastName: 'Hossain', guardianName: 'Karim Hossain', guardianEmail: 'parent@dhaka-model.test' },
  });
  await prisma.student.update({
    where: { id: child2.id },
    data: { parentId: parent.id, firstName: 'Lamia', lastName: 'Hossain', guardianName: 'Karim Hossain', guardianEmail: 'parent@dhaka-model.test' },
  });

  // Attendance — last 10 school days
  const days = recentSchoolDays(10);
  const attendance = students.flatMap((s) =>
    days.map((date) => {
      const r = Math.random();
      const status: AttendanceStatus = r < 0.85 ? 'present' : r < 0.92 ? 'absent' : r < 0.97 ? 'late' : 'excused';
      return { schoolId, studentId: s.id, classId: s.classId, date, status, markedById: teachers[0]!.id };
    }),
  );
  await prisma.attendance.createMany({ data: attendance });

  // One published Mathematics midterm per class, graded for all its students
  for (const c of classes) {
    const mathSubject = await prisma.subject.findFirst({
      where: { schoolId, classId: c.id, name: 'Mathematics' },
    });
    if (!mathSubject) continue;
    const exam = await prisma.exam.create({
      data: {
        schoolId,
        classId: c.id,
        subjectId: mathSubject.id,
        name: 'Midterm Mathematics',
        examType: 'midterm',
        examDate: days[5] ?? new Date(),
        totalMarks: 100,
        passingMarks: 40,
        term: 'Term 1',
        isPublished: true,
        createdById: teachers[0]!.id,
      },
    });
    const classStudents = students.filter((s) => s.classId === c.id);
    await prisma.grade.createMany({
      data: classStudents.map((s) => {
        const marks = 35 + rand(61); // 35–95
        return {
          schoolId,
          examId: exam.id,
          studentId: s.id,
          marksObtained: marks,
          isAbsent: false,
          grade: gradeLetter(marks),
          gradedById: teachers[0]!.id,
        };
      }),
    });
  }

  // Invoices — every student gets a pending tuition; some paid/overdue
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 86400000);
  const past = new Date(now.getTime() - 14 * 86400000);
  await prisma.invoice.createMany({
    data: students.flatMap((s, i) => {
      const rows: {
        schoolId: string; studentId: string; title: string; amount: number;
        currency: string; dueDate: Date; status: InvoiceStatus; paidAmount: number;
      }[] = [
        {
          schoolId,
          studentId: s.id,
          title: 'Tuition Fee — June 2026',
          amount: 2500,
          currency: 'BDT',
          dueDate: soon,
          status: 'pending',
          paidAmount: 0,
        },
      ];
      if (i % 3 === 0) {
        rows.push({
          schoolId,
          studentId: s.id,
          title: 'Tuition Fee — May 2026',
          amount: 2500,
          currency: 'BDT',
          dueDate: past,
          status: 'paid',
          paidAmount: 2500,
        });
      } else if (i % 5 === 0) {
        rows.push({
          schoolId,
          studentId: s.id,
          title: 'Exam Fee — Term 1',
          amount: 800,
          currency: 'BDT',
          dueDate: past,
          status: 'overdue',
          paidAmount: 0,
        });
      }
      return rows;
    }),
  });

  // A welcome notice for the parent inbox
  await prisma.inAppNotification.create({
    data: {
      schoolId,
      userId: parent.id,
      title: 'Welcome to CampusFlow',
      body: 'You can now view your children’s attendance, results and fees here. School reopens Sunday.',
      type: 'broadcast',
    },
  });

  const counts = {
    classes: classes.length,
    students: students.length,
    attendance: attendance.length,
  };
  console.log('Seed complete:', counts);
  console.log(`\nLogin slug (X-School-Slug header): ${SLUG}`);
  console.log('Accounts (password: Password123):');
  console.log('  admin@dhaka-model.test, teacher@dhaka-model.test, finance@dhaka-model.test');
  console.log('  parent@dhaka-model.test (2 children), student@dhaka-model.test');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
