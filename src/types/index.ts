import { Timestamp } from "firebase/firestore";

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  displayName: string; // Customer-facing name, e.g. "Washer Toss"
  slug: string; // URL slug, e.g. "washer-toss"
  internalIds: string[]; // Connecteam inventory IDs, e.g. ["Rental-Washer1","Rental-Washer2"]
  quantity: number; // How many physical units exist
  price: number; // Base 48-hr rental price
  tagline: string;
  description: string;
  rules: string;
  includedEquipment: string[];
  recommendedEvents: string[];
  players: string; // e.g. "2-8 players"
  dimensions: string;
  setupTime: string; // e.g. "10 minutes"
  images: string[]; // Public paths under /images/games/
  faqs: { question: string; answer: string }[];
  active: boolean;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export type ReservationStatus =
  | "inquiry"
  | "pending_contract"
  | "contract_sent"
  | "contract_signed"
  | "invoiced"
  | "paid"
  | "completed"
  | "cancelled";

export interface ReservationItem {
  inventoryId: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
}

export interface Reservation {
  id: string;
  // Customer
  customerName: string;
  email: string;
  phone: string;
  // Event
  eventAddress: string;
  eventLat?: number;
  eventLng?: number;
  eventNotes?: string;
  // Rental window
  pickupDate: Timestamp;
  pickupTime: string;
  returnDate: Timestamp;
  returnTime: string;
  rentalHours: number;
  // Delivery
  deliveryType: "pickup" | "delivery";
  deliveryMiles?: number;
  deliveryFee: number;
  // Items & pricing
  items: ReservationItem[];
  subtotal: number;
  discountTotal: number;
  deliveryTotal: number;
  grandTotal: number;
  // Status
  status: ReservationStatus;
  // Integrations
  connecteamShiftIds?: Record<string, string>;
  contractId?: string;
  contractSignedAt?: Timestamp;
  qboInvoiceId?: string;
  qboInvoiceUrl?: string;
  qboDocNumber?: string;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Contracts ────────────────────────────────────────────────────────────────

export interface Contract {
  id: string;
  reservationId: string;
  terms: string;
  customNotes?: string;
  signedAt?: Timestamp;
  signerName?: string;
  createdAt: Timestamp;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface DeliveryTier {
  minMiles: number;
  maxMiles: number;
  fee: number; // per direction
}

export interface PricingSettings {
  baseRentalHours: number;
  deliveryTiers: DeliveryTier[];
  discountRules: { itemCount: number; pct: number }[];
  additionalHourlyRate: number; // if rental exceeds base hours
}

export interface IntegrationSettings {
  connecteamSchedulerId: string;
  qboConnected: boolean;
  qboSandbox: boolean;
  qboRealmId: string;
  resendApiKey?: string; // stored server-side only
}

// ─── Availability ─────────────────────────────────────────────────────────────

export interface AvailabilityResult {
  inventoryId: string;
  displayName: string;
  available: boolean;
  quantityAvailable: number;
}

// ─── Booking wizard form ──────────────────────────────────────────────────────

export interface BookingFormData {
  customerName: string;
  email: string;
  phone: string;
  eventAddress: string;
  deliveryType: "pickup" | "delivery";
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  selectedItems: { inventoryId: string; quantity: number }[];
  eventNotes: string;
}
