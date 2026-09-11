'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: September 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Introduction</h2>
            <p>
              This Privacy Policy explains how we collect, use, and protect your information when you use our blog platform.
              We are committed to transparency and protecting your privacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">What Data We Collect</h2>
            <h3 className="text-xl font-semibold mt-4 mb-2">Account Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Email address</strong> — Required for account registration and password reset</li>
              <li><strong>Username</strong> — Auto-generated from your email or chosen by you</li>
              <li><strong>Password</strong> — Hashed and encrypted, never stored in plain text</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Profile Information (Optional)</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Display name, bio, avatar</strong> — If you choose to add them to your profile</li>
              <li><strong>Social media links</strong> — If you choose to add them</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">OAuth Data</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>If you log in via Google or Facebook, we receive your verified email address only</li>
              <li>We do not receive or store passwords from OAuth providers</li>
              <li>Your OAuth account is linked to your blog account by email address</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Content You Create</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Blog posts, comments, recipes</strong> — Stored to serve the content you publish</li>
              <li><strong>Upload history</strong> — Images you upload are stored on our media server</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Usage Data</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>View counts</strong> — We track how many times your posts are viewed</li>
              <li><strong>Post likes</strong> — We track user engagement with posts</li>
              <li><strong>Server logs</strong> — Request logs are kept for security and debugging purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">What We Don't Do</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>❌ We do not sell, rent, or share your personal data with third parties</li>
              <li>❌ We do not use cookies for tracking or advertising</li>
              <li>❌ We do not build user profiles for marketing purposes</li>
              <li>❌ We do not use your data to train AI models</li>
              <li>❌ We do not share your email with anyone except for account recovery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Authentication</strong> — To create and manage your account</li>
              <li><strong>Communication</strong> — To send password reset and email verification emails</li>
              <li><strong>Content delivery</strong> — To store and serve your published posts and comments</li>
              <li><strong>Security</strong> — To protect against abuse, fraud, and unauthorized access</li>
              <li><strong>Bug fixes</strong> — To diagnose and fix technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Google OAuth</strong> — For optional sign-in via Google (privacy policy: google.com/policies/privacy)</li>
              <li><strong>Facebook Login</strong> — For optional sign-in via Facebook (privacy policy: facebook.com/privacy)</li>
              <li><strong>Resend</strong> — For email delivery (privacy policy: resend.com/privacy)</li>
              <li><strong>Railway</strong> — For hosting (privacy policy: railway.app/privacy)</li>
            </ul>
            <p className="mt-4 text-sm text-gray-400">
              We are not responsible for the privacy practices of third-party services. Please review their privacy policies directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Data Retention</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Active accounts</strong> — Data is retained as long as your account is active</li>
              <li><strong>Deleted accounts</strong> — Your profile and comments are soft-deleted (marked as removed but not erased for data integrity)</li>
              <li><strong>Email verification tokens</strong> — Expire after 24 hours</li>
              <li><strong>Password reset tokens</strong> — Expire after 1 hour</li>
              <li><strong>Server logs</strong> — Kept for 30 days for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Access</strong> — You can view your account information at any time</li>
              <li><strong>Modification</strong> — You can update your profile settings</li>
              <li><strong>Deletion</strong> — You can request account deletion by contacting us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Security</h2>
            <p>
              We take security seriously:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Passwords are hashed using industry-standard algorithms</li>
              <li>Authentication uses JWT tokens stored in HTTP-only cookies</li>
              <li>All data in transit is encrypted using HTTPS</li>
              <li>We monitor for suspicious activity and rate-limit requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
            <p>
              If you have questions about this privacy policy or how we handle your data, please contact us through the support form on this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes by posting a new version here with an updated date.
            </p>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              Home
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/blog/posts" className="text-blue-600 hover:underline text-sm">
              Blog
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/privacy" className="text-blue-600 hover:underline text-sm">
              Privacy Policy
            </Link>
          </div>

          <div className="flex justify-center">
            <Link href="/">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
