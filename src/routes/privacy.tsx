import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — United Disabled Matrimony" },
      { name: "description", content: "How United Disabled Matrimony collects, uses and protects your personal data — GDPR, UK GDPR, CCPA/CPRA, LGPD, PIPEDA, India DPDP Act 2023 and UNCRPD compliant." },
      { property: "og:title", content: "Privacy Policy — United Disabled Matrimony" },
      { property: "og:description", content: "Your privacy rights on United Disabled Matrimony, worldwide." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Legal</p>
      <h1 className="mt-2 font-display text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: 23 June 2026</p>

      <section className="prose prose-sm mt-8 max-w-none text-foreground dark:prose-invert">
        <p>
          This Privacy Policy explains how <strong>United Disabled Matrimony</strong> collects,
          uses, shares and protects your personal data when you use our
          matrimony platform. It is written to comply with the{" "}
          <strong>EU/UK GDPR</strong>, the <strong>California Consumer Privacy
          Act (CCPA/CPRA)</strong>, Brazil's <strong>LGPD</strong>, Canada's{" "}
          <strong>PIPEDA</strong>, India's <strong>Digital Personal Data
          Protection Act 2023 (DPDP Act)</strong>, and the privacy principles
          of the <strong>UN Convention on the Rights of Persons with
          Disabilities (UNCRPD)</strong>.
        </p>

        <h2>1. Who is the data controller?</h2>
        <p>
          United Disabled Matrimony acts as the <strong>data controller</strong> (GDPR)
          / <strong>data fiduciary</strong> (DPDP Act) / <strong>business</strong>{" "}
          (CCPA) for personal data described here. Contact us through our{" "}
          <Link to="/contact" className="underline">Contact page</Link>.
        </p>

        <h2>2. Data we collect</h2>
        <ul>
          <li><strong>Account:</strong> name, email, phone, password (hashed), date of birth, gender.</li>
          <li><strong>Profile:</strong> photos, bio, country / state / district, religion, education, occupation, partner preferences.</li>
          <li><strong>Sensitive / special-category data</strong> (GDPR Art. 9, DPDP "sensitive personal data", CCPA "sensitive personal information"): disability category and religion. We process these <em>only</em> with your <strong>explicit consent</strong> and for the specific purpose of operating a disability-inclusive matrimony service.</li>
          <li><strong>Interactions:</strong> interests sent / received, matches, messages, reports and blocks.</li>
          <li><strong>Device &amp; usage:</strong> IP address, device type, browser, approximate location, login history, crash logs.</li>
          <li><strong>Payments:</strong> handled by our PCI-DSS-certified payment processor; we store only invoices and last-4 digits, never full card numbers.</li>
        </ul>

        <h2>3. Why we process your data (legal bases)</h2>
        <table>
          <thead><tr><th>Purpose</th><th>Legal basis (GDPR)</th></tr></thead>
          <tbody>
            <tr><td>Create and run your account</td><td>Performance of contract</td></tr>
            <tr><td>Show your profile to other members</td><td>Consent (revocable in Settings)</td></tr>
            <tr><td>Process disability category &amp; religion</td><td>Explicit consent (Art. 9)</td></tr>
            <tr><td>Safety, anti-fraud, moderation</td><td>Legitimate interests + legal obligation</td></tr>
            <tr><td>Security alerts, login history</td><td>Legitimate interests</td></tr>
            <tr><td>Marketing emails</td><td>Consent — unsubscribe anytime</td></tr>
            <tr><td>Tax, accounting, legal claims</td><td>Legal obligation</td></tr>
          </tbody>
        </table>

        <h2>4. Who we share data with</h2>
        <ul>
          <li><strong>Other members</strong> — only the profile fields you choose to show; photos can be blurred via Photo Privacy.</li>
          <li><strong>Processors</strong> — cloud hosting, email delivery, payments, analytics and moderation tools, bound by data-processing agreements (GDPR Art. 28 / DPDP Sec. 8).</li>
          <li><strong>Authorities</strong> — only when legally compelled (court order, lawful request).</li>
          <li>We <strong>do not sell</strong> personal information and do not "share" it for cross-context behavioural advertising as defined by the CCPA/CPRA.</li>
        </ul>

        <h2>5. International transfers</h2>
        <p>
          United Disabled Matrimony is global. Data may be processed in India, the EU and the US.
          For transfers out of the EEA/UK we rely on <strong>Standard
          Contractual Clauses</strong> (2021) and supplementary safeguards. For
          transfers out of India we follow DPDP Sec. 16 and only use countries
          not restricted by the Central Government.
        </p>

        <h2>6. Retention</h2>
        <ul>
          <li>Active account data — for as long as your account exists.</li>
          <li>Deleted accounts — purged within <strong>30 days</strong>, except where law requires longer (tax: 7 years; safety reports: up to 3 years).</li>
          <li>Backups — rotated out within 90 days.</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>Depending on where you live, you have the right to:</p>
        <ul>
          <li><strong>Access</strong> a copy of your data (GDPR Art. 15, DPDP Sec. 11, CCPA "right to know").</li>
          <li><strong>Correct</strong> inaccurate data (Art. 16 / Sec. 12 / CCPA).</li>
          <li><strong>Delete</strong> your data — "right to be forgotten" (Art. 17 / Sec. 12 / CCPA "right to delete").</li>
          <li><strong>Restrict</strong> or <strong>object</strong> to processing (Art. 18 / 21).</li>
          <li><strong>Port</strong> your data in a machine-readable format (Art. 20 / DPDP Sec. 11).</li>
          <li><strong>Withdraw consent</strong> at any time — does not affect lawfulness of past processing.</li>
          <li><strong>Non-discrimination</strong> for exercising your CCPA rights.</li>
          <li><strong>Nominate</strong> someone to exercise rights on your behalf if you are incapacitated or after death (DPDP Sec. 14).</li>
          <li>Lodge a complaint with a supervisory authority — your local DPA in the EU, the ICO in the UK, the Data Protection Board of India under the DPDP Act, the California Privacy Protection Agency, or the ANPD in Brazil.</li>
        </ul>
        <p>
          Exercise these rights in Settings, or reach us through the{" "}
          <Link to="/contact" className="underline">Contact page</Link>.
          We respond within <strong>30 days</strong> (GDPR / DPDP) or{" "}
          <strong>45 days</strong> (CCPA), free of charge.
        </p>

        <h2>8. Accessibility-aware consent (UNCRPD)</h2>
        <p>
          We provide privacy information in plain language, screen-reader-friendly
          markup, and high-contrast modes. You may bring a trusted person to
          assist with consent decisions; supported-decision-making requests are
          welcomed (UNCRPD Art. 12). Where you cannot complete a consent flow,
          contact us for an accessible alternative.
        </p>

        <h2>9. Children</h2>
        <p>
          United Disabled Matrimony is strictly for adults (18+). We do not
          knowingly collect data from children. If you believe a minor has
          registered, contact us through the <Link to="/contact" className="underline">Contact page</Link> and we will remove the account
          immediately (DPDP Sec. 9; COPPA where applicable).
        </p>

        <h2>10. Cookies &amp; similar technologies</h2>
        <p>
          We use strictly necessary cookies for sign-in and security. Optional
          analytics cookies only run after your consent (where required by
          ePrivacy / GDPR). Manage preferences via your browser or the cookie
          banner.
        </p>

        <h2>11. Security</h2>
        <p>
          Encryption in transit (TLS 1.2+) and at rest, hashed passwords,
          role-based access, row-level database policies, audit logs, device
          trust and login alerts. No system is perfectly secure; we will notify
          affected users and regulators of any qualifying breach within{" "}
          <strong>72 hours</strong> (GDPR Art. 33 / DPDP Sec. 8(6)).
        </p>

        <h2>12. Changes to this Policy</h2>
        <p>
          <strong>United Disabled Matrimony reserves the right to update, modify, or replace
          this Privacy Policy at any time, at its sole discretion</strong> —
          for example, to reflect changes in law (GDPR, CCPA, DPDP Act,
          UNCRPD-aligned practices), in our processing activities, in
          subprocessors, or in product features. Material changes will be
          notified in-app and by email at least <strong>14 days</strong>
          before they take effect (shorter notice may apply where the law
          requires immediate action). The "Last updated" date above always
          reflects the current version. Continued use of United Disabled Matrimony after the
          effective date constitutes acceptance of the updated Policy.
        </p>

        <h2>13. Account suspension &amp; data handling</h2>
        <p>
          Where United Disabled Matrimony suspends or terminates an account for violation of
          our <Link to="/terms" className="underline">Terms</Link> (e.g.
          illegal activity, fraud, fake profile, harassment), we may retain
          a minimal record of the account, the violation and related
          evidence for as long as necessary to protect other members,
          enforce our Terms, defend legal claims, or comply with law (up to
          3 years, or longer where statute requires). All other personal
          data is deleted in line with the Retention section above.
        </p>

        <p className="mt-6">
          See also: <Link to="/terms" className="underline">Terms &amp; Conditions</Link>{" "}
          · <Link to="/data-protection" className="underline">Data Protection Notice</Link>.
        </p>
      </section>
    </main>
  );
}
