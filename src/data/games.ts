import { InventoryItem } from "@/types";

// Source of truth for all rental inventory.
// Internal IDs map to Connecteam inventory names — customers never see these.
// Prices are 48-hour base rental. Images stored locally in /public/images/games/.

export const GAMES: InventoryItem[] = [
  {
    id: "putterball",
    displayName: "PutterBall",
    slug: "putterball",
    internalIds: ["Rental-Putterball"],
    quantity: 1,
    price: 75,
    tagline: "Golf meets beer pong — the ultimate backyard mashup",
    description:
      "PutterBall is the original Golf Pong game — equal parts putting challenge and party starter. Set up on any flat surface, take turns putting into the cups, and celebrate every sink. It's easy to learn in two minutes and impossible to stop playing. Perfect for competitive crews who want something unique at their next event.",
    rules:
      "Two teams of 1–2 players set up on opposite ends. Take turns putting into the opponent's cups. Remove a cup each time a ball lands in it. The team that eliminates all of the opponent's cups wins. Redemption round applies if the losing team hasn't had their last shot.",
    includedEquipment: [
      "PutterBall board with cup holes",
      "2 putters",
      "2 golf balls",
      "6 cups",
      "Carry bag",
    ],
    recommendedEvents: [
      "Backyard parties",
      "Graduation parties",
      "Corporate team-building",
      "Tailgates",
      "Wedding receptions",
    ],
    players: "2–4 players",
    dimensions: "8 ft long × 2 ft wide",
    setupTime: "5 minutes",
    images: ["/images/games/putterball-1.jpg"],
    faqs: [
      {
        question: "Do we need a putting green or special surface?",
        answer:
          "Nope — PutterBall plays on grass, concrete, pavement, or any flat surface. It's designed for outdoor use.",
      },
      {
        question: "Is this safe for kids?",
        answer:
          "The putters and balls are lightweight and safe for supervised play with older kids (8+). We recommend adults supervise younger children.",
      },
      {
        question: "Can it get wet?",
        answer:
          "The board can handle light moisture but should not be submerged. If rain is expected, move it to a covered area.",
      },
    ],
    active: true,
  },
  {
    id: "cornhole",
    displayName: "Cornhole",
    slug: "cornhole",
    internalIds: ["Rental-Cornhole1"],
    quantity: 1,
    price: 40,
    tagline: "The backyard classic — no party is complete without it",
    description:
      "Cornhole is Missouri's unofficial official backyard game. Rent a premium set and let your guests battle it out all night long. Whether you're at a graduation party, church picnic, or corporate cookout — cornhole brings everyone together. Our boards are tournament-regulation size with 8 quality bags included.",
    rules:
      "Two teams of 1–2 players stand at opposite boards (27 feet apart). Take turns tossing bags — bag in the hole scores 3 points, bag on the board scores 1. First team to reach exactly 21 wins. Cancellation scoring applies (net score each round).",
    includedEquipment: [
      "2 regulation cornhole boards",
      "8 cornhole bags (4 per team)",
      "Transport bag",
    ],
    recommendedEvents: [
      "Backyard BBQs",
      "Graduation parties",
      "Church events",
      "Corporate cookouts",
      "Family reunions",
      "Festivals",
    ],
    players: "2–4 players",
    dimensions: "2 ft × 4 ft boards, set 27 ft apart",
    setupTime: "5 minutes",
    images: ["/images/games/cornhole-1.jpg"],
    faqs: [
      {
        question: "Do you offer customized boards?",
        answer:
          "Our rental boards are standard — but they look great. Custom board builds are not part of our rental service.",
      },
      {
        question: "What surface works best?",
        answer:
          "Flat grass or pavement is ideal. Boards stay stable on most outdoor surfaces.",
      },
      {
        question: "Can we play inside?",
        answer:
          "Absolutely — cornhole works great indoors on carpet or gym floors with enough space.",
      },
    ],
    active: true,
  },
  {
    id: "washer-toss",
    displayName: "Washer Toss",
    slug: "washer-toss",
    internalIds: ["Rental-Washer1", "Rental-Washer2"],
    quantity: 2,
    price: 28,
    tagline: "Old-school fun with competitive edge",
    description:
      "Washer Toss (also called Washers) is the underdog of yard games — simple to learn, incredibly addictive, and perfect for any size group. Toss metal washers into cups set into wooden boxes for points. Compact enough to fit in a small space, but big enough to gather a crowd. We carry 2 sets, so multiple groups can play at the same event.",
    rules:
      "Set boxes 10–25 feet apart. Players stand beside their box and toss washers toward the opponent's box. Washer in the cup = 3 points; on the board = 1 point. Cancellation scoring: only the leading team scores each round. First to 21 wins.",
    includedEquipment: [
      "2 wooden washer boxes",
      "6 metal washers (3 per team)",
      "Carry bag",
    ],
    recommendedEvents: [
      "Backyard BBQs",
      "Tailgates",
      "Graduation parties",
      "Family reunions",
      "Corporate events",
    ],
    players: "2–4 players",
    dimensions: "12\" × 12\" boxes, set 10–25 ft apart",
    setupTime: "5 minutes",
    images: ["/images/games/washer-toss-1.jpg"],
    faqs: [
      {
        question: "How many sets do you have?",
        answer:
          "We have 2 Washer Toss sets. You can rent one or both — great for running two simultaneous games at a large event.",
      },
      {
        question: "Is it safe for kids?",
        answer:
          "The metal washers are small — keep them away from very young children. Great for adults and older kids.",
      },
    ],
    active: true,
  },
  {
    id: "ladder-ball",
    displayName: "Ladder Ball",
    slug: "ladder-ball",
    internalIds: ["Rental-LadderBall"],
    quantity: 1,
    price: 30,
    tagline: "Toss, wrap, and dominate the ladder",
    description:
      "Ladder Ball (also known as Ladder Golf or Bolo Toss) is all about precision and a little bit of luck. Toss bolas — two balls connected by a rope — at a three-rung ladder to score points. Easy to set up anywhere, fun for all ages, and compact enough to move around the yard. A staple at graduation parties and cookouts.",
    rules:
      "Set ladders 5 paces apart. Players take turns tossing bolas at the opponent's ladder. Top rung = 3 pts, middle = 2, bottom = 1. Cancellation scoring: if both players hit the same rung, those points cancel. First to exactly 21 wins.",
    includedEquipment: [
      "2 ladder stands (freestanding)",
      "6 bolas (3 per team)",
      "Carry bag",
    ],
    recommendedEvents: [
      "Graduation parties",
      "Backyard BBQs",
      "Church picnics",
      "Family reunions",
      "Tailgates",
    ],
    players: "2–4 players",
    dimensions: "Ladder ~3 ft tall, set 15 ft apart",
    setupTime: "5 minutes",
    images: ["/images/games/ladder-ball-1.jpg"],
    faqs: [
      {
        question: "Does it work on uneven ground?",
        answer:
          "The ladders have wide feet and stay stable on grass. Very uneven terrain may need some leveling.",
      },
      {
        question: "Can it be played indoors?",
        answer:
          "Yes — in a gym, large hall, or garage with enough clearance.",
      },
    ],
    active: true,
  },
  {
    id: "giant-jenga",
    displayName: "Giant Jenga",
    slug: "giant-jenga",
    internalIds: ["Rental-Jenga"],
    quantity: 1,
    price: 40,
    tagline: "Stack it high, hold your breath, don't be the one who drops it",
    description:
      "Giant Jenga towers over your average backyard game — literally. Our set starts at around 2.5 feet tall and can grow over 5 feet as play progresses. Pull blocks from the lower levels and stack them on top without toppling the tower. The tension builds with every move, and the crash when it falls is always the highlight of the party.",
    rules:
      "Players take turns removing one block from below the highest completed row and placing it on top. Only one hand can touch the tower at a time. The player who causes the tower to fall loses that round.",
    includedEquipment: ["54 hardwood blocks", "Stacking sleeve"],
    recommendedEvents: [
      "Corporate team-building",
      "Graduation parties",
      "Backyard parties",
      "Church events",
      "School events",
      "Festivals",
    ],
    players: "2+ players",
    dimensions: "Starts ~2.5 ft tall, grows to 5+ ft",
    setupTime: "10 minutes",
    images: ["/images/games/giant-jenga-1.jpg"],
    faqs: [
      {
        question: "Is the tower safe for kids?",
        answer:
          "Yes — the blocks are solid hardwood and safe. Younger kids may need help stacking the upper rows. Always supervise small children near the full-height tower.",
      },
      {
        question: "What surface does it need?",
        answer:
          "A flat, firm surface is best — concrete, pavement, or flat grass. Very soft or uneven ground may make the tower unstable.",
      },
      {
        question: "Will the blocks get dirty outdoors?",
        answer:
          "Expect normal outdoor use. Please do not use on wet or muddy surfaces.",
      },
    ],
    active: true,
  },
  {
    id: "giant-connect-four",
    displayName: "Giant Connect Four",
    slug: "giant-connect-four",
    internalIds: ["Rental-Connect4"],
    quantity: 1,
    price: 45,
    tagline: "The classic strategy game, supersized",
    description:
      "Giant Connect Four brings the beloved childhood game to a scale that gets everyone's attention. Drop oversized discs into the towering grid and race to connect four in a row — horizontally, vertically, or diagonally. Easy to understand for kids, genuinely strategic for adults, and a visual centerpiece for any event.",
    rules:
      "Two players alternate dropping colored discs into the 7-column grid. Discs fall to the lowest available row. First player to connect 4 of their color in any direction wins. If the grid fills without a winner, it's a draw.",
    includedEquipment: [
      "Freestanding giant grid frame",
      "42 oversized discs (21 per color)",
      "Carrying bag",
    ],
    recommendedEvents: [
      "Corporate events",
      "School events",
      "Graduation parties",
      "Church events",
      "Festivals",
      "Family reunions",
    ],
    players: "2 players",
    dimensions: "4 ft wide × 4 ft tall",
    setupTime: "10 minutes",
    images: ["/images/games/giant-connect-four-1.jpg"],
    faqs: [
      {
        question: "How long does a game take?",
        answer:
          "Most games last 3–10 minutes, so there's plenty of rotation at busy events. Run a quick tournament to keep the competition going.",
      },
      {
        question: "Is assembly required?",
        answer:
          "The frame is freestanding with simple assembly — no tools needed. Takes about 10 minutes to set up.",
      },
      {
        question: "Can it be used indoors?",
        answer:
          "Yes — it works great indoors with sufficient ceiling height (5+ ft clear).",
      },
    ],
    active: true,
  },
];

export function getGameBySlug(slug: string): InventoryItem | undefined {
  return GAMES.find((g) => g.slug === slug && g.active);
}

export function getActiveGames(): InventoryItem[] {
  return GAMES.filter((g) => g.active);
}

// Pricing from competitor analysis — we're always cheaper
export const COMPETITOR_SAVINGS = {
  "cornhole": "23%",
  "giant-jenga": "18%",
  "giant-connect-four": "16%",
  "ladder-ball": "25%",
  "washer-toss": "20%",
};
