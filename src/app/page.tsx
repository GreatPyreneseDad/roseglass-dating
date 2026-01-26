import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🌹 Rose Glass Dating
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Translation, Not Judgment
          </p>
          <p className="text-gray-500">
            See dating profiles clearly. Express yourself authentically.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/analyze" className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition border border-rose-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">📸 Profile Analysis</h2>
            <p className="text-gray-600">
              Upload dating profile screenshots for Rose Glass translation.
              Understand what they're actually filtering for.
            </p>
          </Link>

          <Link href="/chat" className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition border border-rose-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">💬 Chat Mode</h2>
            <p className="text-gray-600">
              Have a conversation about your dating situation.
              Drop in screenshots anytime.
            </p>
          </Link>
        </div>

        <div className="bg-rose-50 rounded-xl p-6 border border-rose-200">
          <h3 className="font-semibold text-rose-900 mb-3">The Four Dimensions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-bold text-rose-700">Ψ</span>
              <span className="text-gray-700"> Internal Consistency</span>
            </div>
            <div>
              <span className="font-bold text-rose-700">ρ</span>
              <span className="text-gray-700"> Wisdom Depth</span>
            </div>
            <div>
              <span className="font-bold text-rose-700">q</span>
              <span className="text-gray-700"> Emotional Activation</span>
            </div>
            <div>
              <span className="font-bold text-rose-700">f</span>
              <span className="text-gray-700"> Social Belonging</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>"Coherence is constructed, not discovered."</p>
        </div>
      </div>
    </div>
  );
}
