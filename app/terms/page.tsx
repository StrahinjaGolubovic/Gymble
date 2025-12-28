'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/streakd_logo.png"
                alt="STREAKD."
                width={180}
                height={52}
                priority
                unoptimized
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
            <Link
              href="/register"
              className="text-gray-200 hover:text-gray-100 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Back to Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sm:p-8 md:p-10 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">STREAKD – Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <p className="text-base leading-relaxed">
              By creating an account, accessing, or using STREAKD (&quot;the App&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the App.
            </p>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">1. Description of Service</h2>
              <p className="text-base leading-relaxed">
                STREAKD is a digital platform designed to help users track discipline-related habits such as workouts, rest days, streaks, and participation in group-based features including Crews, rankings, and challenges. STREAKD is provided for motivational and entertainment purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">2. Eligibility</h2>
              <p className="text-base leading-relaxed">
                You must be at least 13 years of age to use STREAKD. By using the App, you represent and warrant that you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">3. Account Registration and Responsibility</h2>
              <p className="text-base leading-relaxed">
                You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information and to keep it updated.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">4. Health and Fitness Disclaimer</h2>
              <p className="text-base leading-relaxed">
                You acknowledge that physical activity involves inherent risks. STREAKD does not provide medical advice and is not a substitute for professional guidance. You use the App at your own risk and assume full responsibility for any injuries or health-related issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">5. Virtual Currencies and Items</h2>
              <p className="text-base leading-relaxed">
                STREAKD includes virtual currencies and items, including but not limited to Dumbbells, Trophies, Ranks, badges, and cosmetic features. These items have no real-world monetary value, are non-transferable, and may only be used within the App.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">6. Dumbbells (Virtual Currency)</h2>
              <p className="text-base leading-relaxed">
                Dumbbells are earned through in-app activities such as maintaining streaks or completing challenges. Dumbbells may be spent on in-app features including rest days, customization, or access to special activities. Dumbbells cannot be redeemed for real money or transferred between accounts.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">7. Trophies, Rankings, and Progress Systems</h2>
              <p className="text-base leading-relaxed">
                Trophies and ranks represent in-app achievements and progression. STREAKD reserves the right to adjust, rebalance, refresh, or recalculate ranking systems between seasons to maintain fairness.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">8. Purchases and Refund Policy</h2>
              <p className="text-base leading-relaxed">
                All purchases of virtual items, whether earned or purchased, are final and non-refundable. No refunds will be provided for unused virtual currency or lost progress.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">9. Crews, Competitions, and Social Features</h2>
              <p className="text-base leading-relaxed">
                Crews and competitive features are provided for community engagement and motivation. Users must participate fairly and respectfully. Cheating, harassment, or system manipulation may result in suspension or removal.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">10. Prohibited Conduct</h2>
              <p className="text-base leading-relaxed">
                You agree not to exploit bugs, falsify activity, use automation tools, harass others, or engage in illegal activities while using STREAKD.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">11. User Content</h2>
              <p className="text-base leading-relaxed">
                You retain ownership of content you submit. By submitting content, you grant STREAKD a non-exclusive, worldwide, royalty-free license to use such content for operating and improving the App.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">12. Service Availability and Modifications</h2>
              <p className="text-base leading-relaxed">
                STREAKD is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We may modify, suspend, or discontinue features at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">13. Account Suspension and Termination</h2>
              <p className="text-base leading-relaxed">
                STREAKD reserves the right to suspend or terminate accounts that violate these Terms or harm the platform or other users.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">14. Limitation of Liability</h2>
              <p className="text-base leading-relaxed">
                To the maximum extent permitted by law, STREAKD shall not be liable for indirect, incidental, or consequential damages. Total liability shall not exceed the amount paid to STREAKD, if any.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">15. Changes to These Terms</h2>
              <p className="text-base leading-relaxed">
                We may update these Terms from time to time. Continued use of the App constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">16. Governing Law</h2>
              <p className="text-base leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mt-8 mb-4">17. Contact Information</h2>
              <p className="text-base leading-relaxed">
                For questions or support, contact: <a href="mailto:support@streakd.com" className="text-primary-400 hover:text-primary-300 underline">support@streakd.com</a>
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-700">
            <Link
              href="/register"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Back to Registration
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

