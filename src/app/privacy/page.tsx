export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-[13px] text-[#c4736e] hover:underline mb-8 inline-block">&larr; Back to Rose Glass</a>
        <h1 className="font-serif text-3xl font-normal text-[#2c2420] mb-2">Privacy Policy</h1>
        <p className="text-[#9b8e82] text-sm mb-10">Last updated: April 2, 2026</p>

        <div className="space-y-8 text-[#6b5e54] leading-relaxed text-[15px]">
          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">What Rose Glass is</h2>
            <p>Rose Glass is a communication translation tool that analyzes dating messages and profiles using the Rose Glass dimensional framework. It is provided by MacGregor Holding Company, dba ROSE Corp., headquartered in Jackson Hole, Wyoming.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">What we collect</h2>
            <p>When you use Rose Glass — either through roseglass.online or the Rose Glass Chrome extension — the text and images you submit are sent to our API for analysis. This content is processed in real time and is not stored permanently. We do not create user profiles, track browsing behavior, or maintain a history of your conversations.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Screenshots and images</h2>
            <p>The Chrome extension offers a one-click screenshot feature that captures the visible area of your browser tab for analysis. These screenshots are transmitted to our API, analyzed, and discarded. They are not saved to any database, not used for training, and not shared with any third party.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">How analysis works</h2>
            <p>Text and images you submit are sent to Anthropic&apos;s Claude API for processing using the Rose Glass system prompt. Anthropic&apos;s API does not use customer inputs for model training. Your data passes through Anthropic&apos;s infrastructure subject to their data processing terms, which prohibit training on API inputs.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">What we do not do</h2>
            <p>We do not sell your data. We do not share your data with advertisers. We do not build behavioral profiles. We do not store conversation history beyond the active session. We do not track which dating apps you use. We do not access any data from your dating accounts beyond what you explicitly share with Rose Glass.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Chrome extension permissions</h2>
            <p>The Rose Glass Chrome extension requests the following permissions:</p>
            <p className="mt-2"><strong className="text-[#2c2420]">Tabs:</strong> Required to capture visible tab screenshots for the one-click analysis feature. The extension only activates on recognized dating app domains.</p>
            <p className="mt-2"><strong className="text-[#2c2420]">Storage:</strong> Used to save local preferences such as panel state. No personal data is stored.</p>
            <p className="mt-2"><strong className="text-[#2c2420]">Host permissions:</strong> Required to inject the Rose Glass translation panel into dating app pages and to capture screenshots for analysis. The extension only runs on specified dating app domains.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Data retention</h2>
            <p>Conversation data exists only for the duration of your active session. When you close the Rose Glass panel or navigate away, the conversation is gone. We maintain standard server logs for error monitoring, which may include timestamps and error messages but not conversation content. These logs are retained for 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Third parties</h2>
            <p>Rose Glass uses Anthropic&apos;s Claude API for natural language processing and Vercel for hosting. Both services process data subject to their respective privacy policies. No other third parties receive your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Children</h2>
            <p>Rose Glass is not intended for use by anyone under the age of 18. We do not knowingly collect data from minors.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Changes</h2>
            <p>We may update this policy as the product evolves. Material changes will be noted with an updated date at the top of this page.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[#2c2420] mb-3">Contact</h2>
            <p>MacGregor Holding Company &middot; ROSE Corp.<br />
            Jackson Hole, Wyoming<br />
            <a href="mailto:office@roseglass.dev" className="text-[#c4736e] hover:underline">office@roseglass.dev</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-[rgba(44,36,32,0.06)] text-center">
          <p className="font-serif text-[15px] text-[#2c2420] mb-1">Rose Glass</p>
          <p className="text-[12px] text-[#9b8e82]">Coherence is constructed, not discovered.</p>
        </div>
      </div>
    </div>
  );
}
