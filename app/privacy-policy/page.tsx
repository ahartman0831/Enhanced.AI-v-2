export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Enhanced AI v2 - Educational Health Analysis Platform
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Enhanced AI v2 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational health analysis platform.
            </p>
            <p className="font-medium text-amber-700 dark:text-amber-300 mt-4">
              <strong>Important:</strong> We never share identifiable personal data. All community insights are completely anonymized and aggregated for educational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Account information (email address) for authentication</li>
              <li>Profile information you voluntarily provide (age, goals, experience level)</li>
              <li>Health data you choose to analyze (bloodwork, protocols, progress photos)</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">2.2 Anonymized Community Data</h3>
            <p>Only collected with your explicit consent:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Experience level categories (beginner/intermediate/advanced)</li>
              <li>General health marker ranges (converted to statistical buckets)</li>
              <li>Protocol categories (not specific compounds or dosages)</li>
              <li>Timeline data in quarters (not exact dates)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>

            <h3 className="text-xl font-medium mb-2">3.1 Personal Data</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>To provide personalized health analysis</li>
              <li>To improve our AI models and analysis accuracy</li>
              <li>To communicate with you about your account</li>
              <li>To ensure platform security and prevent abuse</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">3.2 Anonymized Community Insights</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>To generate educational community trends</li>
              <li>To improve analysis algorithms</li>
              <li>To provide context for individual users</li>
              <li>To advance educational health optimization knowledge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Anonymization Process</h2>

            <h3 className="text-xl font-medium mb-2">4.1 Irreversible Anonymization</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>SHA-256 Hashing:</strong> User IDs are converted to irreversible hashes using a salted algorithm</li>
              <li><strong>Data Stripping:</strong> All direct identifiers (names, emails, exact dates) are removed</li>
              <li><strong>Range Conversion:</strong> Numeric values are converted to statistical ranges</li>
              <li><strong>Category Aggregation:</strong> Specific compounds become general categories</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">4.2 Minimum Thresholds</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Minimum 10 participants required for any trend calculation</li>
              <li>Aggregated data cannot be traced back to individuals</li>
              <li>No individual data points are ever exposed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>All data transmission is encrypted using HTTPS/TLS</li>
              <li>Database access is restricted to authorized service roles only</li>
              <li>Regular security audits and updates</li>
              <li>Anonymized contributions are stored separately from personal data</li>
              <li>Service role access only for anonymized data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>

            <h3 className="text-xl font-medium mb-2">6.1 Consent Management</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>You can opt-in to anonymized community insights at any time</li>
              <li>You can revoke consent and delete your anonymized contributions</li>
              <li>Consent is specific to anonymized insights only</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">6.2 Data Control</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Access your personal data through your profile settings</li>
              <li>Request data export or deletion at any time</li>
              <li>Account deletion removes all associated data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Personal data: Retained while your account is active</li>
              <li>Anonymized contributions: Retained indefinitely for trend analysis</li>
              <li>Account deletion: All personal data removed within 30 days</li>
              <li>Consent revocation: Anonymized data deleted within 24 hours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p>
              We use Supabase for database and authentication services. Supabase's privacy practices are governed by their own privacy policy. We do not share your personal data with any third parties for marketing or advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your data is stored on secure cloud infrastructure. While we strive to keep data within secure jurisdictions, cloud services may involve international data transfers. All transfers comply with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              Our service is intended for adults 18 years and older. We do not knowingly collect personal information from children under 18. If you are under 18, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us through the support channels available in your account dashboard.
            </p>
          </section>

          <section className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
            <h2 className="text-xl font-semibold mb-3 text-amber-900 dark:text-amber-100">Educational Purpose Disclaimer</h2>
            <p className="text-amber-800 dark:text-amber-200">
              Enhanced AI v2 is an educational platform only. All analyses, insights, and recommendations are for educational purposes and should not be considered medical advice. Always consult qualified healthcare professionals for medical decisions. Community insights are population-level educational data and do not constitute personalized medical guidance.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}