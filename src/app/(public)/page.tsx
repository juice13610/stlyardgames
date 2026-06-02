import Link from "next/link";
import Image from "next/image";
import { CheckCircle, MapPin, Clock, DollarSign, Star, ArrowRight } from "lucide-react";
import { getActiveGames } from "@/data/games";
import { formatCurrency } from "@/lib/pricing";

export default function HomePage() {
  const games = getActiveGames();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-300 rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-900/40 rounded-full px-4 py-1.5 text-green-200 text-sm font-medium mb-6">
              <MapPin size={14} /> St. Peters, MO — Serving All of St. Louis
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Yard Games That Make Your Party{" "}
              <span className="text-yellow-300">Unforgettable</span>
            </h1>
            <p className="text-lg sm:text-xl text-green-100 mb-4 max-w-2xl">
              Rent premium outdoor games for your next backyard bash, graduation party, corporate event, or family gathering — at prices up to{" "}
              <span className="text-yellow-300 font-bold">54% less</span> than the competition.
            </p>
            <p className="text-green-200 text-sm mb-8">
              Free pickup in St. Peters · 48-hour rentals · Delivery available throughout the St. Louis metro
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="bg-yellow-400 text-green-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors text-center shadow-lg"
              >
                Reserve Your Games
              </Link>
              <Link
                href="/games"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors text-center"
              >
                Browse Games →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-green-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: "🏆", label: "Up to 54% cheaper than competitors" },
              { icon: "🚚", label: "Free pickup in St. Peters" },
              { icon: "⏱️", label: "48-hour rentals" },
              { icon: "📞", label: "Local, responsive service" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs sm:text-sm font-medium text-green-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Game Lineup
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            All games include everything you need to play — no extras, no surprises. Just show up and have fun.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-300 transition-all"
            >
              <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                <Image
                  src={game.images[0]}
                  alt={game.displayName}
                  width={200}
                  height={150}
                  className="object-contain h-40 w-auto group-hover:scale-105 transition-transform"
                  onError={() => {}} // graceful fallback handled by placeholder below
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{game.displayName}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{game.tagline}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-700">
                    {formatCurrency(game.price)}
                    <span className="text-sm font-normal text-gray-500"> / 48 hrs</span>
                  </span>
                  <span className="text-green-700 font-medium text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Details <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition-colors"
          >
            Reserve Multiple Games &amp; Save Up to 20% <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Easy as 1, 2, 3</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "🎯",
                title: "Choose Your Games",
                desc: "Browse our lineup and pick the games you want. Mix and match — the more games, the bigger the discount.",
              },
              {
                step: "2",
                icon: "📅",
                title: "Reserve Online",
                desc: "Fill out our simple form with your dates and event address. We confirm availability and send your rental agreement.",
              },
              {
                step: "3",
                icon: "🎉",
                title: "Play & Return",
                desc: "Pick up in St. Peters or we deliver to your door. Enjoy your event, then return or we pick up — easy.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-green-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Why Choose STL Yard Games?
            </h2>
            <p className="text-gray-600 mb-6">
              We started STL Yard Games because we believed great outdoor fun shouldn't cost a fortune. We've done the research — and we're significantly cheaper than every major competitor in the St. Louis area.
            </p>
            <ul className="space-y-4">
              {[
                { icon: <DollarSign className="text-green-600" size={20} />, text: "Up to 54% cheaper than St. Louis area competitors — we've done the math and we'll prove it" },
                { icon: <Clock className="text-green-600" size={20} />, text: "Full 48-hour rentals so you don't feel rushed — set up the day before and return after cleanup" },
                { icon: <MapPin className="text-green-600" size={20} />, text: "Local St. Peters business — fast response, real people, no corporate runaround" },
                { icon: <CheckCircle className="text-green-600" size={20} />, text: "Clean, well-maintained equipment — inspected and sanitized before every rental" },
                { icon: <Star className="text-green-600" size={20} />, text: "Multi-game discounts: 10% off your 2nd game, 20% off when you book 3+" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span className="text-gray-700">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-green-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-green-900 mb-6 text-center">
              Compare the Savings
            </h3>
            <div className="space-y-3">
              {[
                { game: "Cornhole Set", us: 40, them: 52.50, savings: "23.8%" },
                { game: "Giant Jenga", us: 40, them: 48.75, savings: "17.9%" },
                { game: "Giant Connect Four", us: 45, them: 53.75, savings: "16.3%" },
                { game: "Ladder Ball", us: 30, them: 40, savings: "25.0%" },
                { game: "Washer Toss", us: 28, them: 35, savings: "20.0%" },
              ].map((row) => (
                <div key={row.game} className="flex items-center justify-between bg-white rounded-lg px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{row.game}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 line-through">{formatCurrency(row.them)}</span>
                    <span className="text-green-700 font-bold">{formatCurrency(row.us)}</span>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      -{row.savings}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              *Compared to average St. Louis area competitor pricing.
            </p>
          </div>
        </div>
      </section>

      {/* Service area */}
      <section id="service-area" className="bg-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Service Area</h2>
          <p className="text-green-200 mb-8 max-w-2xl mx-auto">
            Based in St. Peters, MO (63376) — we serve the entire greater St. Louis area. Free pickup always available.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { range: "0–5 miles", price: "$15/way", note: "St. Peters nearby" },
              { range: "5–15 miles", price: "$35/way", note: "St. Charles, O'Fallon" },
              { range: "15–30 miles", price: "$45/way", note: "St. Louis, Chesterfield" },
              { range: "30–60 miles", price: "$75/way", note: "Extended metro area" },
            ].map((tier) => (
              <div key={tier.range} className="bg-green-700 rounded-xl p-4">
                <div className="font-bold text-yellow-300 text-lg">{tier.price}</div>
                <div className="text-sm font-medium text-white">{tier.range}</div>
                <div className="text-xs text-green-300 mt-1">{tier.note}</div>
              </div>
            ))}
          </div>
          <p className="text-green-300 text-sm mt-4">Delivery pricing is per direction. Free pickup in St. Peters — always.</p>
          <div className="mt-8">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-yellow-400 text-green-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors"
            >
              Check Delivery to My Address <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Event types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Perfect For Any Event</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { emoji: "🎓", label: "Graduation Parties" },
            { emoji: "🏢", label: "Corporate Events" },
            { emoji: "⛪", label: "Church Events" },
            { emoji: "🏫", label: "School Events" },
            { emoji: "🌳", label: "Backyard BBQs" },
            { emoji: "🎪", label: "Festivals" },
          ].map((evt) => (
            <div
              key={evt.label}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-center hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{evt.emoji}</div>
              <div className="text-sm font-medium text-gray-700">{evt.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-green-700 to-emerald-600 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Level Up Your Next Event?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            Reserve online in minutes. We'll confirm availability and take care of the rest.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-yellow-400 text-green-900 px-10 py-5 rounded-xl font-bold text-xl hover:bg-yellow-300 transition-colors shadow-xl"
          >
            Book Your Games Now <ArrowRight size={24} />
          </Link>
        </div>
      </section>
    </>
  );
}
