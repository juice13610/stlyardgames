import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getActiveGames } from "@/data/games";
import { formatCurrency } from "@/lib/pricing";

export const metadata = {
  title: "Yard Games for Rent — STL Yard Games",
  description:
    "Browse all available yard game rentals: Cornhole, Giant Jenga, Giant Connect Four, PutterBall, Ladder Ball, and Washer Toss. Serving the St. Louis metro area.",
};

export default function GamesPage() {
  const games = getActiveGames();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Game Lineup</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Everything you need for the perfect outdoor event. All rentals include equipment,
          instructions, and 48 hours of play time.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-800 rounded-full px-4 py-2 text-sm font-medium">
          💰 Book 2 games: 10% off · Book 3+: 20% off
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-300 transition-all flex flex-col"
          >
            <div className="h-52 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
              <Image
                src={game.images[0]}
                alt={game.displayName}
                width={220}
                height={160}
                className="object-contain h-44 w-auto"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">{game.displayName}</h2>
                <span className="text-sm bg-green-100 text-green-800 rounded-full px-2 py-0.5 whitespace-nowrap ml-2">
                  {game.players}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4 flex-1">{game.tagline}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>⏱ {game.setupTime} setup</span>
                <span>📐 {game.dimensions}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <span className="text-2xl font-bold text-green-700">
                    {formatCurrency(game.price)}
                  </span>
                  <span className="text-gray-400 text-sm"> / 48 hrs</span>
                </div>
                <Link
                  href={`/games/${game.slug}`}
                  className="flex items-center gap-1 bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors text-sm"
                >
                  View Details <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-green-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-green-900 mb-3">
          Can't decide? Book them all and save 20%
        </h2>
        <p className="text-green-700 mb-6">
          Multi-game bundles are the best value for larger events. Mix and match any combination.
        </p>
        <Link
          href="/book"
          className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition-colors"
        >
          Start Your Reservation <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
