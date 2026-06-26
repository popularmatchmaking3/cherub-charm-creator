import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/data-protection")({
  head: () => ({
    meta: [
      { title: "Data Protection Notice — United Disabled Matrimony" },
      { name: "description", content: "United Disabled Matrimony's safeguards for sensitive personal data, security measures, breach response and your rights under GDPR, CCPA, DPDP Act 2023 and UNCRPD." },
      { property: "og:title", content: "Data Protection Notice — United Disabled Matrimony" },
      { property: "og:description", content: "Our data-protection commitments and your rights." },
    ],
  }),
  component: DataProtectionPage,
});

function DataProtectionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Legal</p>
      <h1 className="mt-2 font-display text-4xl">Data Protection Notice</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: 23 June 2026</p>

      <section className="prose prose-sm mt-8 max-w-none text-foreground dark:prose-invert">
        <p>
          This notice supplements our{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link> and
          describes the technical and organisational measures United Disabled Matrimony uses to
          protect personal data — particularly the sensitive data members
          entrust to us (disability information, religion, photographs).
        </p>

        <h2>1. Principles we follow</h2>
        <ul>
          <li><strong>Lawfulness, fairness, transparency</strong> — GDPR Art. 5(1)(a), DPDP Sec. 4.</li>
          <li><strong>Purpose limitation</strong> — data is used only for the matrimony purpose disclosed at collection.</li>
          <li><strong>Data minimisation</strong> — only fields required to operate a safe service are collected.</li>
          <li><strong>Accuracy</strong> — members can correct profile data at any time.</li>
          <li><strong>Storage limitation</strong> — see Retention in the Privacy Policy.</li>
          <li><strong>Integrity &amp; confidentiality</strong> — encryption, access controls, monitoring.</li>
          <li><strong>Accountability</strong> — documented processing, DPIAs for high-risk features.</li>
          <li><strong>Accessibility &amp; dignity</strong> — UNCRPD Articles 12, 22 (privacy) and 9 (accessibility).</li>
        </ul>

        <h2>2. Sensitive personal data</h2>
        <p>
          Disability category and religion are <em>special-category</em> data
          under GDPR Art. 9 and <em>sensitive personal data</em> under the
          DPDP Act. They are processed only with your explicit, granular,
          informed consent. You can:
        </p>
        <ul>
          <li>Hide your disability category from your public profile.</li>
          <li>Edit or remove disability and religion information at any time from your profile.</li>
          <li>Withdraw consent at any time by deleting your account.</li>
        </ul>

        <h2>3. Security measures</h2>
        <ul>
          <li><strong>Encryption in transit:</strong> TLS 1.2+ on all endpoints; HSTS enforced.</li>
          <li><strong>Encryption at rest:</strong> AES-256 for the primary database and object storage.</li>
          <li><strong>Authentication:</strong> securely hashed passwords and supported social sign-in providers.</li>
          <li><strong>Authorisation:</strong> row-level database policies; least-privilege service roles.</li>
          <li><strong>Audit:</strong> login history and admin action logs.</li>
          <li><strong>Network:</strong> rate limits, bot protection, DDoS mitigation at the edge.</li>
          <li><strong>People:</strong> background-checked staff, role-based access, mandatory annual security training, signed confidentiality agreements.</li>
          <li><strong>Vendors:</strong> only processors with equivalent safeguards and signed Data Processing Agreements.</li>
        </ul>

        <h2>4. Data Protection Impact Assessments (DPIAs)</h2>
        <p>
          We carry out DPIAs (GDPR Art. 35) before launching any feature that
          processes sensitive data at scale — for example, AI-assisted
          moderation. DPIAs are reviewed annually.
        </p>

        <h2>5. Breach response</h2>
        <p>
          If a personal-data breach occurs that is likely to result in a risk
          to your rights, we will:
        </p>
        <ul>
          <li>Notify the competent supervisory authority within <strong>72 hours</strong> of becoming aware (GDPR Art. 33 / DPDP Sec. 8(6)).</li>
          <li>Notify affected members without undue delay, with clear language about what happened, what data was involved and what to do.</li>
          <li>Publish a public summary once the issue is contained.</li>
        </ul>

        <h2>6. Children &amp; vulnerable adults</h2>
        <p>
          United Disabled Matrimony is for adults only. We apply heightened protections for
          accounts that indicate cognitive or psychosocial disability, including
          friction against impulsive deletion, simpler consent screens, and the
          option to designate a trusted contact (UNCRPD Art. 12; DPDP Sec. 14).
        </p>

        <h2>7. Automated decisions &amp; AI</h2>
        <p>
          Match suggestions are algorithmic but never produce legal or
          similarly significant effects on you. Verification and moderation
          decisions are always reviewed by a human before they affect your
          account. You may request human review of any automated action that
          you believe was wrong (GDPR Art. 22; EU AI Act transparency
          obligations).
        </p>

        <h2>8. Your contacts</h2>
        <ul>
          <li><strong>Privacy &amp; Data Protection Officer:</strong> reach us through the <Link to="/contact" className="underline">Contact page</Link>.</li>
          <li><strong>EU representative</strong> (GDPR Art. 27) and <strong>UK representative</strong> details: available on request via the Contact page.</li>
          <li><strong>Grievance Officer (India)</strong> per DPDP Act 2023 and IT Rules 2021: contact us via the <Link to="/contact" className="underline">Contact page</Link> — response within 30 days.</li>
        </ul>

        <h2>9. Updates to this Notice</h2>
        <p>
          <strong>This Data Protection Notice is a living document and may
          be updated by United Disabled Matrimony at any time, at its sole discretion</strong> —
          to reflect new safeguards, new regulations, new subprocessors, or
          new product capabilities. Material changes will be announced
          in-app and by email before they take effect. The "Last updated"
          date above always reflects the current version.
        </p>

        <h2>10. Enforcement &amp; account action</h2>
        <p>
          To protect the safety of members and the integrity of the
          platform, <strong>United Disabled Matrimony may suspend, restrict or permanently
          terminate any account at its sole discretion</strong> — with or
          without prior notice — where it finds or reasonably suspects
          illegal activity, fraud, fake identity, harassment, or any other
          violation of the <Link to="/terms" className="underline">Terms</Link>.
          Investigation data may be retained for the period strictly
          necessary to enforce our Terms, defend legal claims, or comply
          with law, in line with Section 6 of the{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>

        <p className="mt-6">
          See also: <Link to="/terms" className="underline">Terms &amp; Conditions</Link>{" "}
          · <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
