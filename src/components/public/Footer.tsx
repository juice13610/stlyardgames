import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-green-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Image
                src="/stlyardgames.png"
                alt="STL Yard Games"
                width={88}
                height={88}
                className="rounded-full ring-2 ring-green-600 shadow-lg"
              />
              <div>
                <div className="font-bold text-white text-xl leading-tight">STL Yard Games</div>
                <div className="text-green-300 text-sm">St. Peters, MO</div>
                <div className="text-green-400 text-xs mt-0.5">stlyardgames.com</div>
              </div>
            </div>
            <p className="text-green-200 text-sm leading-relaxed">
              Premium yard game rentals for every occasion. Serving the greater St. Louis area with the best prices around — we'll prove it.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Games</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/games/cornhole", label: "Cornhole" },
                { href: "/games/giant-jenga", label: "Giant Jenga" },
                { href: "/games/giant-connect-four", label: "Giant Connect Four" },
                { href: "/games/putterball", label: "PutterBall" },
                { href: "/games/ladder-ball", label: "Ladder Ball" },
                { href: "/games/washer-toss", label: "Washer Toss" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-green-300 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-3">Get In Touch</h3>
            <ul className="space-y-2 text-sm text-green-200">
              <li>📍 St. Peters, MO 63376</li>
              <li>
                <a href="mailto:joeytomsfbr@gmail.com" className="hover:text-white transition-colors">
                  📧 joeytomsfbr@gmail.com
                </a>
              </li>
              <li className="pt-2">
                <Link
                  href="/book"
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition-colors"
                >
                  Reserve Now →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-green-400">
          <span>© {new Date().getFullYear()} STL Yard Games. All rights reserved.</span>
          <span>Serving St. Peters, St. Louis, St. Charles County &amp; surrounding areas.</span>
        </div>
      </div>
    </footer>
  );
}
