import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

export default function Terms() {
  const theme = useStore(state => state.theme);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      <div className={`p-6 flex justify-between items-center border-b transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
        <div className="flex items-center gap-6">
          <Link to="/" className={`text-xl font-syne font-extrabold tracking-tighter transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>TOBLI</Link>
          <ThemeToggle />
        </div>
        <Link to="/signup" className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'}`}>
          <ArrowLeft size={20} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-syne font-bold mb-2 tracking-tight">Terms &amp; Conditions</h1>
        <p className={`text-sm mb-10 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>Last updated: 2 May 2026</p>

        <div className={`space-y-8 text-sm leading-relaxed transition-colors ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>1. Introduction &amp; Acceptance</h2>
            <p>These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the Tobli location-based business discovery platform (&quot;Platform&quot;), including the website, mobile-optimised web application, related APIs, and all services offered through them (collectively, the &quot;Service&quot;). The Service is owned and operated by <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>TOBLI (The OBL Initiative)</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), a company operating under the laws of the Republic of Uganda.</p>
            <p className="mt-2">By creating an account, accessing, or using the Service you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy" className={`underline transition-colors ${theme === 'dark' ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-600'}`}>Privacy Policy</Link>. If you do not agree, you must not use the Service.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2. Definitions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;User&quot;</strong> — any person who accesses the public map view to discover businesses.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;Business Owner&quot;</strong> — a registered account holder who lists goods or services.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;Admin&quot;</strong> — authorised personnel who manage Platform operations.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;Listing&quot;</strong> — a product or service entry published by a Business Owner.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;Subscription&quot;</strong> — a paid, time-bound licence granting map visibility.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;Pesapal&quot;</strong> — Pesapal Limited, the third-party payment processor.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>&quot;Personal Data&quot;</strong> — information relating to an identified or identifiable natural person, per the Data Protection and Privacy Act, 2019 of Uganda (&quot;DPPA&quot;).</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>3. Eligibility</h2>
            <p>You must be at least <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>18 years of age</strong> and have the legal capacity to enter into binding agreements under Ugandan law. By registering, you represent that all information you provide is accurate, current, and complete.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>4. Account Registration &amp; Security</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>To access Business Owner features you must create an account providing: Business Name, Owner Name, Business Type, Phone Number, Email Address, and a password (minimum 8 characters with at least one uppercase letter, one lowercase letter, and one number).</li>
              <li>You are solely responsible for safeguarding your login credentials.</li>
              <li>Notify us immediately at <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>ojoklatim1@gmail.com</strong> or call <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>+256773946713</strong> if you suspect unauthorised access.</li>
              <li>We may suspend or terminate accounts that violate these Terms or exhibit suspicious activity.</li>
            </ol>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>5. Services Provided</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Map Discovery</strong> — GPS-powered map for finding nearby businesses and offerings.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Business Dashboard</strong> — manage Listings, contacts, GPS location, and subscriptions.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Search</strong> — full-text search returning nearest-first results.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Routing</strong> — directions via third-party OSRM.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Contact Links</strong> — WhatsApp, call, Instagram, X, and website links.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>6. Subscriptions &amp; Payments</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>An active Subscription (Standard plan) is required for Listings to appear on the public map.</li>
              <li>All payments are processed through <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Pesapal Limited</strong>. By paying you also agree to Pesapal&apos;s terms and privacy policy.</li>
              <li>We may modify pricing with <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>30 days&apos; prior notice</strong>.</li>
              <li>Payments are in <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Ugandan Shillings (UGX)</strong> via Mobile Money, bank cards, or other Pesapal-supported methods.</li>
              <li>Refund requests may be submitted within <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>7 days</strong> of payment and are evaluated case-by-case.</li>
              <li>Expired subscriptions result in Listings being hidden until renewal. The subscription status will show as <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Inactive</strong> until renewed.</li>
            </ol>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>7. User-Generated Content</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Business Owners retain ownership of uploaded content (info, descriptions, images, logos).</li>
              <li>You grant Tobli a non-exclusive, worldwide, royalty-free licence to display and distribute that content for operating the Service.</li>
              <li>You must not upload content that infringes IP rights, is misleading, defamatory, obscene, unlawful, or contains malware.</li>
              <li>We may remove violating content without prior notice.</li>
            </ol>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>8. Acceptable Use</h2>
            <p>You agree not to: use the Service unlawfully; scrape or reverse-engineer the Platform; gain unauthorised access to accounts or infrastructure; disrupt the Service; impersonate others; or use automated bots without consent.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>9. Geolocation &amp; Third-Party Services</h2>
            <p>The Service uses device GPS (with your permission) for map positioning and distance calculations. Map tiles are served by CartoDB/OpenStreetMap; routing by the OSRM Project. These third parties have their own terms. We are not responsible for their accuracy or availability.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>10. Intellectual Property</h2>
            <p>All rights in the Platform — design, code, &quot;Tobli&quot; brand, logos, and proprietary technology — are owned by TOBLI (The OBL Initiative). No right to use our trademarks is granted without written consent.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>11. Disclaimers &amp; Limitation of Liability</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind.</li>
              <li>Tobli is a discovery platform only — we are not a party to transactions between Users and Business Owners.</li>
              <li>Our total aggregate liability shall not exceed the amount you paid us in the preceding 12 months.</li>
              <li>We shall not be liable for indirect, incidental, consequential, or punitive damages.</li>
            </ol>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>12. Indemnification</h2>
            <p>You agree to indemnify and hold harmless TOBLI (The OBL Initiative), its directors, officers, employees, and agents from any claims, losses, or expenses arising from your use of the Service, violation of these Terms, or infringement of third-party rights.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>13. Suspension &amp; Termination</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>We may suspend or terminate accounts for breach, non-payment, or as required by law.</li>
              <li>You may close your account by contacting ojoklatim1@gmail.com. Closure does not entitle you to unused subscription refunds.</li>
              <li>Upon termination, Listings are removed and data handled per our Privacy Policy.</li>
            </ol>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>14. Governing Law &amp; Dispute Resolution</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>These Terms are governed by the laws of the <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Republic of Uganda</strong>.</li>
              <li>Disputes shall first be resolved through good-faith negotiation. If unresolved within 30 days, they shall be submitted to mediation under CADER, Kampala.</li>
              <li>The courts of Uganda have exclusive jurisdiction over unresolved matters.</li>
            </ol>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>15. Changes to These Terms</h2>
            <p>Material changes will be communicated via email or in-app notification at least <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>14 days</strong> before taking effect. Continued use constitutes acceptance.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>16. Contact Us</h2>
            <div className={`p-4 rounded-2xl space-y-1 border transition-colors ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-gray-100 border-black/5'}`}>
              <p className={`font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>TOBLI (The OBL Initiative)</p>
              <p>Email: <a href="mailto:ojoklatim1@gmail.com" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a></p>
              <p>Phone: <a href="tel:+256773946713" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>+256773946713</a></p>
              <p>Kampala, Uganda</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
