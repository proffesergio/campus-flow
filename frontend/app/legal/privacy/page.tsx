import { Title, H2, P, UL, Note } from '../_components';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPolicy() {
  return (
    <>
      <Title updated="2 June 2026">Privacy Policy</Title>

      <Note>
        Template only. CampusFlow processes data about minors; before using this with a real
        school, have it reviewed by counsel and align it with Bangladesh law and any school
        board requirements (and FERPA/GDPR where applicable).
      </Note>

      <P>
        This Privacy Policy explains how CampusFlow (&ldquo;we&rdquo;, &ldquo;the platform&rdquo;) collects, uses,
        and protects personal information on behalf of the school (&ldquo;the institution&rdquo;) that
        operates it. The institution is the data controller; CampusFlow acts as a data
        processor under the institution&rsquo;s instructions.
      </P>

      <H2>1. Information we collect</H2>
      <UL>
        <li>Student records: name, roll number, class, date of birth, photo, guardian contacts.</li>
        <li>Academic data: attendance, exam marks, grades, report cards.</li>
        <li>Financial data: invoices, fee payments, and payment-gateway transaction references.</li>
        <li>Account data: email, role, and hashed passwords for staff, students, and guardians.</li>
        <li>Technical data: IP address and basic logs for security and audit purposes.</li>
      </UL>

      <H2>2. How we use information</H2>
      <UL>
        <li>To deliver core school operations: attendance, results, fees, and communications.</li>
        <li>To send attendance and fee notifications to guardians via SMS, email, or in-app.</li>
        <li>To generate report cards, receipts, and administrative reports.</li>
        <li>To secure the platform, detect misuse, and maintain an audit trail of changes.</li>
      </UL>

      <H2>3. Children&rsquo;s data</H2>
      <P>
        Most data subjects are minors. We collect only what the institution needs to operate.
        Guardians may request access to, or correction of, their child&rsquo;s records through the
        school office.
      </P>

      <H2>4. Sharing and third parties</H2>
      <P>
        We share data only with sub-processors necessary to provide the service — for example
        SSLCommerz (payments), Resend (email), Twilio (SMS), and AI providers used for report
        narratives. We never sell personal data.
      </P>

      <H2>5. Data security</H2>
      <UL>
        <li>Encryption in transit (TLS) and at rest at the database layer.</li>
        <li>Role-based access control and tenant isolation between schools.</li>
        <li>Passwords stored using strong one-way hashing (bcrypt).</li>
        <li>An immutable audit log of create/update/delete actions.</li>
      </UL>

      <H2>6. Retention</H2>
      <P>
        Data is retained for as long as the institution maintains its account, or as required by
        applicable education regulations, after which it is deleted or anonymised on request.
      </P>

      <H2>7. Your rights</H2>
      <P>
        Depending on applicable law, data subjects (or their guardians) may request access,
        correction, deletion, or export of personal data by contacting the school administration.
      </P>

      <H2>8. Contact</H2>
      <P>For privacy questions, contact your school administration or privacy@your-school.example.</P>
    </>
  );
}
