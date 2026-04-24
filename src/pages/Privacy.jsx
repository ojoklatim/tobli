import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

export default function Privacy() {
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
        <h1 className="text-4xl font-syne font-bold mb-2 tracking-tight">Privacy Policy</h1>
        <p className={`text-sm mb-4 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>Last updated: 22 April 2026</p>
        <p className={`text-sm mb-10 transition-colors ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>This Privacy Policy is issued in compliance with the <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Data Protection and Privacy Act, 2019</strong> of Uganda (&quot;DPPA&quot;) and the regulations made thereunder.</p>

        <div className="space-y-8 text-neutral-300 text-sm leading-relaxed">

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>1. Data Controller</h2>
            <div className={`p-4 rounded-2xl space-y-1 border transition-colors ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-gray-100 border-black/5'}`}>
              <p className={`font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>TOBLI (The OBL Initiative)</p>
              <p>Data Protection Officer: <a href="mailto:ojoklatim1@gmail.com" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a></p>
              <p>Kampala, Uganda</p>
            </div>
            <p className="mt-2">As the data controller, we determine the purposes and means of processing your personal data in accordance with Section 2 of the DPPA.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2. Personal Data We Collect</h2>
            <p className="mb-3">We collect the following categories of personal data:</p>

            <h3 className={`text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2.1 Data You Provide (Registration &amp; Profile)</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Business Name, Owner&apos;s Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business Type / Sector (Goods, Services, or Both)</li>
              <li>Password (stored in hashed form — we never store plaintext passwords)</li>
              <li>Contact handles: WhatsApp number, Instagram, X (Twitter), Website URL</li>
              <li>Business logo and product/service images</li>
              <li>Business description / bio</li>
            </ul>

            <h3 className={`text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2.2 Geolocation Data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>User location</strong> — real-time GPS coordinates collected via browser Geolocation API (with your explicit consent) to display your position on the map and calculate distances.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Business location</strong> — latitude and longitude pinned by Business Owners to mark their physical location on the map.</li>
            </ul>

            <h3 className={`text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2.3 Transaction Data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Subscription payment amounts, dates, payment methods, and Pesapal reference IDs.</li>
              <li>We do <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>not</strong> store credit/debit card numbers or Mobile Money PINs — these are processed entirely by Pesapal.</li>
            </ul>

            <h3 className={`text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2.4 Usage &amp; Technical Data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Presence/heartbeat data (online status for live user count).</li>
              <li>Search queries (processed in real-time, not permanently stored against your identity).</li>
              <li>Device type, browser, IP address, and access timestamps (via standard server logs).</li>
            </ul>

            <h3 className={`text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>2.5 Data from Third Parties</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment confirmations and transaction references from Pesapal.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>3. Legal Basis for Processing (DPPA Section 3)</h2>
            <p className="mb-3">We process your personal data on the following lawful bases:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-widest transition-colors ${theme === 'dark' ? 'border-white/10 text-neutral-500' : 'border-black/10 text-neutral-400'}`}>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${theme === 'dark' ? 'divide-white/5' : 'divide-black/5'}`}>
                  <tr><td className="p-3">Account creation &amp; authentication</td><td className="p-3">Consent (Section 7, DPPA)</td></tr>
                  <tr><td className="p-3">Displaying business on map</td><td className="p-3">Performance of contract</td></tr>
                  <tr><td className="p-3">Processing payments via Pesapal</td><td className="p-3">Performance of contract</td></tr>
                  <tr><td className="p-3">GPS location for map positioning</td><td className="p-3">Explicit consent (browser prompt)</td></tr>
                  <tr><td className="p-3">Presence tracking (live user count)</td><td className="p-3">Legitimate interest</td></tr>
                  <tr><td className="p-3">Platform security &amp; fraud prevention</td><td className="p-3">Legitimate interest</td></tr>
                  <tr><td className="p-3">Legal compliance</td><td className="p-3">Legal obligation</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>4. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your business account.</li>
              <li>Display your business and Listings on the public map to Users.</li>
              <li>Process subscription payments through Pesapal.</li>
              <li>Enable Users to contact you via the links you provide.</li>
              <li>Calculate and display distances between Users and businesses.</li>
              <li>Show live user counts on the admin dashboard.</li>
              <li>Send transactional emails (account verification, password resets).</li>
              <li>Monitor and improve Platform performance and security.</li>
              <li>Comply with legal and regulatory obligations under Ugandan law.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>5. Data Sharing &amp; Disclosure</h2>
            <p className="mb-3">We do <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>not sell</strong> your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Pesapal Limited</strong> — payment processing (amount, business ID, email). Pesapal is a data processor under the DPPA.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>InsForge</strong> — our backend infrastructure provider (database, authentication, storage). Data is processed under a data processing agreement.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>CartoDB / OpenStreetMap</strong> — map tile rendering (no personal data shared, only tile coordinates).</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>OSRM Project</strong> — routing (GPS coordinates for route calculation, no personal identifiers).</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Law enforcement or regulatory authorities</strong> — when required by Ugandan law, court order, or to protect rights and safety.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>6. Cross-Border Data Transfers</h2>
            <p>Our backend infrastructure (InsForge) may process data on servers located outside Uganda. In accordance with Section 19 of the DPPA, we ensure that any cross-border transfer is subject to adequate data protection safeguards, including contractual clauses that provide a level of protection equivalent to the DPPA.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>7. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Account data</strong> — retained for the duration of your account plus 12 months after closure.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Transaction records</strong> — retained for 7 years as required by Uganda Revenue Authority tax regulations.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Geolocation data (Users)</strong> — processed in real-time only; not stored persistently.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Business GPS coordinates</strong> — retained while the account is active.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Server logs</strong> — retained for up to 90 days.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Uploaded media</strong> — deleted within 30 days of account closure.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>8. Your Rights Under the DPPA</h2>
            <p className="mb-3">As a data subject under the Data Protection and Privacy Act, 2019, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Rectification</strong> — correct inaccurate or incomplete data (via your Dashboard or by contacting us).</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Erasure</strong> — request deletion of your personal data, subject to legal retention obligations.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Restriction</strong> — request that we limit processing of your data in certain circumstances.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Object</strong> — object to processing based on legitimate interest.</li>
              <li><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Withdraw consent</strong> — withdraw consent at any time (e.g., revoking GPS permission via browser settings).</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact our Data Protection Officer at <a href="mailto:ojoklatim1@gmail.com" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a>. We will respond within <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>30 days</strong>.</p>
            <p className="mt-2">You also have the right to lodge a complaint with the <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>Personal Data Protection Office (PDPO)</strong> of Uganda.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>9. Data Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All data in transit is encrypted using <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>TLS 1.2+</strong>.</li>
              <li>Passwords are hashed using industry-standard algorithms — never stored in plaintext.</li>
              <li>Access to production databases is restricted to authorised personnel.</li>
              <li>Images are compressed and stored in a secure cloud storage bucket with access controls.</li>
              <li>We conduct periodic security reviews and promptly address identified vulnerabilities.</li>
            </ul>
            <p className="mt-2">While we implement commercially reasonable safeguards, no system is 100% secure. We encourage you to use a strong, unique password.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>10. Cookies &amp; Local Storage</h2>
            <p>Tobli uses browser local storage and session tokens for authentication. We do not use third-party tracking cookies. Map tile requests to CartoDB may be subject to CartoDB&apos;s own cookie policy.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>11. Children&apos;s Privacy</h2>
            <p>The Service is not directed at persons under 18. We do not knowingly collect data from minors. If we learn that a minor has provided personal data, we will delete it promptly. If you believe a child has registered, please contact us at <a href="mailto:ojoklatim1@gmail.com" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notification at least <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>14 days</strong> before taking effect. The &quot;Last updated&quot; date at the top reflects the most recent revision.</p>
          </section>

          <section>
            <h2 className={`text-lg font-bold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>13. Contact Us</h2>
            <div className={`p-4 rounded-2xl space-y-1 border transition-colors ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-gray-100 border-black/5'}`}>
              <p className={`font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>TOBLI (The OBL Initiative) — Data Protection Officer</p>
              <p>Email: <a href="mailto:ojoklatim1@gmail.com" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a></p>
              <p>Phone: <a href="tel:0773946713" className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>0773946713</a></p>
              <p>Kampala, Uganda</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
