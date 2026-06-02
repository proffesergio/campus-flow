import { Title, H2, P, UL, Note } from '../_components';

export const metadata = { title: 'Data Processing Agreement' };

export default function DPA() {
  return (
    <>
      <Title updated="2 June 2026">Data Processing Agreement (DPA)</Title>

      <Note>
        Template only. A signed DPA between the school (controller) and the platform operator
        (processor) should be executed before processing real student data.
      </Note>

      <P>
        This DPA forms part of the agreement between the School (&ldquo;Controller&rdquo;) and the CampusFlow
        operator (&ldquo;Processor&rdquo;) and governs the processing of personal data, including data about
        minors, carried out by the Processor on the Controller&rsquo;s behalf.
      </P>

      <H2>1. Subject matter & roles</H2>
      <P>
        The Processor processes personal data only on documented instructions from the Controller
        for the purpose of operating the school management service.
      </P>

      <H2>2. Categories of data & data subjects</H2>
      <UL>
        <li>Data subjects: students (minors), guardians, teachers, and administrative staff.</li>
        <li>Data: identity, contact, academic, attendance, and fee/payment records.</li>
      </UL>

      <H2>3. Processor obligations</H2>
      <UL>
        <li>Process data only on the Controller&rsquo;s instructions and for agreed purposes.</li>
        <li>Ensure persons with access are bound by confidentiality.</li>
        <li>Implement appropriate technical and organisational security measures.</li>
        <li>Maintain an audit log of administrative changes to records.</li>
        <li>Assist the Controller with data-subject requests and breach notification.</li>
      </UL>

      <H2>4. Sub-processors</H2>
      <P>
        The Controller authorises the use of sub-processors necessary to deliver the service
        (payment gateway, email/SMS providers, hosting, and AI providers for report narratives).
        The Processor remains responsible for their compliance and will inform the Controller of
        changes.
      </P>

      <H2>5. Security measures</H2>
      <UL>
        <li>Encryption in transit and at rest; role-based access; tenant isolation.</li>
        <li>Hashed credentials; least-privilege access; audit logging.</li>
        <li>Regular backups with restoration testing.</li>
      </UL>

      <H2>6. Data breach</H2>
      <P>
        The Processor will notify the Controller without undue delay after becoming aware of a
        personal-data breach and provide information to support the Controller&rsquo;s obligations.
      </P>

      <H2>7. Return & deletion</H2>
      <P>
        On termination, the Processor will, at the Controller&rsquo;s choice, return or delete personal
        data, save where retention is required by law.
      </P>

      <H2>8. Signatures</H2>
      <P>
        For Controller (School): ______________________ &nbsp;&nbsp; Date: __________<br />
        For Processor (CampusFlow): __________________ &nbsp;&nbsp; Date: __________
      </P>
    </>
  );
}
