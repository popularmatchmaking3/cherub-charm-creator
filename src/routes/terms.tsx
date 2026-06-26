import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — United Disabled Matrimony" },
      { name: "description", content: "Terms of Service governing use of the United Disabled Matrimony matrimony platform, aligned with GDPR, CCPA, UNCRPD and India's DPDP Act 2023." },
      { property: "og:title", content: "Terms & Conditions — United Disabled Matrimony" },
      { property: "og:description", content: "Terms of Service for United Disabled Matrimony members worldwide." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Legal</p>
      <h1 className="mt-2 font-display text-4xl">Terms &amp; Conditions</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: 23 June 2026</p>

      <section className="prose prose-sm mt-8 max-w-none text-foreground dark:prose-invert">
        <p>
          Welcome to <strong>United Disabled Matrimony</strong> ("we", "us", "our") — a global
          matrimony platform built for persons with disabilities and their
          partners. By creating an account or using the platform you agree to
          these Terms &amp; Conditions ("Terms"). If you do not agree, do not
          use United Disabled Matrimony. These Terms work alongside our{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link> and{" "}
          <Link to="/data-protection" className="underline">Data Protection Notice</Link>.
        </p>

        <h2>1. Eligibility</h2>
        <ul>
          <li>You must be at least <strong>18 years</strong> old (or the legal age of marriage in your country, whichever is higher).</li>
          <li>You must have the legal capacity to enter a binding contract. Where you act with the support of a guardian, supporter or trusted person consistent with the UN Convention on the Rights of Persons with Disabilities (<strong>UNCRPD, Article 12</strong>), your decisions remain yours and we respect supported decision-making arrangements.</li>
          <li>You must not be legally prohibited from using a matrimonial service in your jurisdiction.</li>
        </ul>

        <h2>2. Your account</h2>
        <ul>
          <li>You agree to provide accurate, current information and to keep it updated.</li>
          <li>You are responsible for keeping your password and devices secure.</li>
          <li>One account per person. Duplicate, fake or impersonating accounts may be removed without notice.</li>
        </ul>

        <h2>3. Acceptable use</h2>
        <p>You agree <em>not</em> to:</p>
        <ul>
          <li>Harass, abuse, threaten, defame, stalk or discriminate against any member, including on the basis of disability, gender, religion, caste, race, nationality or sexual orientation.</li>
          <li>Post content that is unlawful, sexually explicit, hateful, fraudulent, or that infringes intellectual property or privacy rights.</li>
          <li>Use United Disabled Matrimony for any commercial solicitation, dowry demand, trafficking, money-lending, MLM, or matrimonial fraud.</li>
          <li>Attempt to access, scrape, reverse-engineer or disrupt the platform, or bypass security, rate limits or moderation.</li>
          <li>Upload another person's photos, ID or personal information without their consent.</li>
        </ul>

        <h2>4. Photos, privacy controls &amp; consent</h2>
        <ul>
          <li>You retain ownership of your photos and profile content. You grant United Disabled Matrimony a limited, worldwide, royalty-free licence to host, display and process this content solely to operate the service.</li>
          <li>Photo Privacy (blur) and Online-status visibility are in Settings and can be changed at any time.</li>
          <li>Sending an interest, accepting a match, or starting a private chat is a clear, affirmative action and constitutes consent for that specific interaction only.</li>
        </ul>

        <h2>5. Subscriptions &amp; payments</h2>
        <p>
          Some features may require a paid membership. Prices, taxes and renewal
          terms are shown before checkout. Statutory cooling-off / refund rights
          under your local law (e.g. EU Consumer Rights Directive,
          California's Automatic Renewal Law, India's Consumer Protection Act
          2019) are honoured. Cancel anytime from Settings &gt; Membership.
        </p>

        <h2>6. Content moderation &amp; reporting</h2>
        <p>
          We may review, restrict, blur or remove content, suspend accounts, or
          cooperate with law enforcement where we reasonably believe a Term has
          been broken or a law violated. Use the in-app <em>Report</em> and{" "}
          <em>Block</em> tools — every report is reviewed.
        </p>

        <h2>7. Account suspension &amp; termination — at our discretion</h2>
        <p>
          <strong>United Disabled Matrimony reserves the absolute right, at its sole discretion
          and at any time, to suspend, restrict, deactivate or permanently
          terminate any account</strong> — with or without prior notice — if
          we find or reasonably suspect any of the following:
        </p>
        <ul>
          <li>Any illegal, fraudulent, criminal or unlawful activity, including matrimonial fraud, financial scams, money laundering, dowry demands, trafficking, or impersonation.</li>
          <li>Fake profiles, false identity, forged documents, or misuse of someone else's photos or government ID.</li>
          <li>Harassment, abuse, threats, hate speech, sexually explicit content, or discrimination on the basis of disability, gender, religion, caste, race, nationality or sexual orientation.</li>
          <li>Soliciting money, MLM, advertising, spam, or any commercial activity outside United Disabled Matrimony's intended purpose.</li>
          <li>Attempts to bypass security, scrape data, automate actions, or interfere with other members.</li>
          <li>Multiple or duplicate accounts, ban evasion, or use of stolen credentials.</li>
          <li>Violation of these Terms, the Privacy Policy, the Data Protection Notice, the Community Guidelines, or any applicable local, national or international law.</li>
        </ul>
        <p>
          Suspension can be temporary (pending investigation) or permanent.
          Where lawful, suspended members will be informed of the reason and
          may submit an appeal via our{" "}
          <Link to="/appeal" className="underline">Account Appeal form</Link>.
          We are <strong>not liable</strong> for any loss arising from
          suspension or termination of an account that violated these Terms.
          Any paid subscription on a terminated account is non-refundable
          where the termination is for cause, except where local consumer law
          requires otherwise.
        </p>

        <h2>8. Accessibility commitment</h2>
        <p>
          We aim to conform to <strong>WCAG 2.2 AA</strong> and the principles
          of the <strong>UNCRPD</strong>, the <strong>EU Accessibility Act
          (2025)</strong>, the <strong>US ADA</strong>, and India's{" "}
          <strong>Rights of Persons with Disabilities Act 2016</strong>. If a
          feature is not accessible to you, contact us — we will provide an
          alternative and fix the issue.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          United Disabled Matrimony is an introductions platform. We do not
          run background checks, and we do not guarantee marriages,
          compatibility, truthfulness of profiles, or outcomes. Meet safely,
          verify independently, and prefer public places for first meetings.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, United Disabled Matrimony is not liable for
          indirect, incidental or consequential damages. Nothing in these Terms
          limits liability that cannot be limited by law (e.g. gross negligence,
          fraud, death or personal injury caused by us).
        </p>

        <h2>11. Termination</h2>
        <p>
          You can delete your account at any time from Settings &gt; Danger zone.
          We may suspend or terminate accounts that violate these Terms. On
          deletion, data is removed in accordance with the{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>

        <h2>12. Changes</h2>
        <p>
          <strong>United Disabled Matrimony reserves the right to amend, modify, replace or
          update these Terms — and the Privacy Policy, Data Protection
          Notice, Community Guidelines, pricing, features and any related
          policies — at any time, in whole or in part, at its sole
          discretion.</strong> Updates may be made for legal, regulatory,
          security, technical, business or product reasons. Material changes
          will be announced in-app and by email at least{" "}
          <strong>14 days</strong> before they take effect (shorter notice
          may apply where the law requires immediate action, e.g. for
          security or compliance). Non-material changes (typos, clarifications,
          contact details) may take effect immediately on posting. The
          "Last updated" date at the top of this page always reflects the
          current version. Continued use of United Disabled Matrimony after the effective date
          means you accept the updated Terms; if you do not agree, you must
          stop using the service and delete your account.
        </p>

        <h2>13. Governing law &amp; disputes</h2>
        <p>
          These Terms are governed by the laws of India, without prejudice to
          mandatory consumer-protection rights in your country of residence (EU
          / UK / California / other). You may bring claims before the competent
          courts of your habitual residence or, alternatively, the courts of
          Bengaluru, India.
        </p>

        <h2>14. Contact</h2>
        <p>
          Questions about these Terms: <Link to="/contact" className="underline">contact us</Link>.
        </p>
      </section>
    </main>
  );
}
