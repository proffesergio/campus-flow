import { Title, H2, P, UL, Note } from '../_components';

export const metadata = { title: 'Terms of Service' };

export default function Terms() {
  return (
    <>
      <Title updated="2 June 2026">Terms of Service</Title>

      <Note>Template only — review with counsel before relying on these terms.</Note>

      <P>
        These Terms govern use of the CampusFlow platform by schools and their authorised users
        (administrators, teachers, finance staff, students, and guardians). By using the platform
        you agree to these Terms.
      </P>

      <H2>1. Accounts and access</H2>
      <UL>
        <li>Accounts are issued by the school. You are responsible for keeping credentials secure.</li>
        <li>Access is role-based; you may only use data you are authorised to access.</li>
        <li>Guardians may view only their own children&rsquo;s records.</li>
      </UL>

      <H2>2. Acceptable use</H2>
      <UL>
        <li>Do not attempt to access other schools&rsquo; or other families&rsquo; data.</li>
        <li>Do not misuse, scrape, or disrupt the platform.</li>
        <li>Use communications features only for legitimate school purposes.</li>
      </UL>

      <H2>3. Payments</H2>
      <P>
        Fee payments are processed by third-party gateways (e.g. SSLCommerz, covering bKash,
        Nagad, and cards). CampusFlow records transactions but is not the merchant of record;
        refunds and disputes are handled by the school per its fee policy.
      </P>

      <H2>4. Availability</H2>
      <P>
        We aim for high availability but do not guarantee uninterrupted service. Maintenance and
        outages may occur. The platform is provided on an &ldquo;as is&rdquo; basis during pilot testing.
      </P>

      <H2>5. Data ownership</H2>
      <P>
        The school owns its institutional and student data. CampusFlow processes it solely to
        provide the service, per the Privacy Policy and Data Processing Agreement.
      </P>

      <H2>6. Limitation of liability</H2>
      <P>
        To the extent permitted by law, CampusFlow is not liable for indirect or consequential
        losses arising from use of the platform. Nothing limits liability that cannot be limited
        under applicable law.
      </P>

      <H2>7. Changes</H2>
      <P>We may update these Terms; material changes will be communicated to the school.</P>
    </>
  );
}
