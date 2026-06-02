import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Clock, Users, Ruler } from "lucide-react";
import { getGameBySlug, getActiveGames } from "@/data/games";
import { formatCurrency } from "@/lib/pricing";
import AvailabilityChecker from "@/components/public/AvailabilityChecker";

export async function generateStaticParams() {
  return getActiveGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  const title = `${game.displayName} Rental in St. Louis, MO — STL Yard Games`;
  const description = `Rent ${game.displayName} in the St. Peters & St. Louis, MO area. ${game.tagline}. ${game.description.slice(0, 120)}... 48-hour rentals starting at ${formatCurrency(game.price)}.`;
  const url = `https://stlyardgames.com/games/${game.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "STL Yard Games",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: "/stlyardgames.png",
          width: 1200,
          height: 630,
          alt: `${game.displayName} Rental — STL Yard Games`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/stlyardgames.png"],
    },
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${game.displayName} Rental`,
    description: game.description,
    url: `https://stlyardgames.com/games/${game.slug}`,
    image: game.images[0]
      ? `https://stlyardgames.com${game.images[0]}`
      : "https://stlyardgames.com/stlyardgames.png",
    brand: {
      "@type": "Brand",
      name: "STL Yard Games",
    },
    offers: {
      "@type": "Offer",
      price: game.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://stlyardgames.com/games/${game.slug}`,
      seller: {
        "@type": "LocalBusiness",
        name: "STL Yard Games",
        address: {
          "@type": "PostalAddress",
          addressLocality: "St. Peters",
          addressRegion: "MO",
          postalCode: "63376",
          addressCountry: "US",
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link href="/games" className="hover:text-green-700">Games</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{game.displayName}</span>
      </nav>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center p-8 min-h-72">
          <Image
            src={game.images[0]}
            alt={game.displayName}
            width={400}
            height={300}
            className="object-contain max-h-72 w-auto"
          />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{game.displayName}</h1>
          <p className="text-lg text-green-700 font-medium mb-4">{game.tagline}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={16} className="text-green-600" />
              {game.players}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-green-600" />
              {game.setupTime} setup
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
              <Ruler size={16} className="text-green-600" />
              {game.dimensions}
            </div>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{game.description}</p>

          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-green-800">
              {formatCurrency(game.price)}
              <span className="text-base font-normal text-gray-500"> / 48 hours</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              Free pickup in St. Peters · Multi-game discounts available
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/book?game=${game.id}`}
              className="flex items-center justify-center gap-2 bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition-colors"
            >
              Reserve This Game <ArrowRight size={20} />
            </Link>
            <Link
              href="/book"
              className="flex items-center justify-center gap-2 border-2 border-green-700 text-green-700 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors"
            >
              Build a Bundle
            </Link>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* What's included */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
          <ul className="space-y-2">
            {game.includedEquipment.map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-700">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* How to play */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Play</h2>
          <p className="text-gray-700 leading-relaxed">{game.rules}</p>
        </div>

        {/* Perfect for */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Perfect For</h2>
          <div className="flex flex-wrap gap-2">
            {game.recommendedEvents.map((evt) => (
              <span
                key={evt}
                className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                {evt}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-green-900 mb-4">Pricing Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{game.displayName} (48 hrs)</span>
              <span className="font-bold text-green-800">{formatCurrency(game.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pickup in St. Peters</span>
              <span className="font-bold text-green-800">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">2nd game discount</span>
              <span className="font-bold text-green-800">-10%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">3+ games discount</span>
              <span className="font-bold text-green-800">-20%</span>
            </div>
            <div className="border-t border-green-200 pt-3">
              <span className="text-xs text-gray-500">Delivery pricing calculated at checkout based on address.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Availability checker */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Check Availability</h2>
        <AvailabilityChecker defaultGameId={game.id} />
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {game.faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to Book {game.displayName}?</h2>
        <p className="text-green-100 mb-6">Reserve online in minutes. We'll confirm and send your agreement.</p>
        <Link
          href={`/book?game=${game.id}`}
          className="inline-flex items-center gap-2 bg-yellow-400 text-green-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors"
        >
          Reserve Now — {formatCurrency(game.price)} <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
