import { PricingSettings, ReservationItem } from "@/types";

export const DEFAULT_PRICING: PricingSettings = {
  baseRentalHours: 48,
  deliveryTiers: [
    { minMiles: 0, maxMiles: 5, fee: 15 },
    { minMiles: 5.1, maxMiles: 15, fee: 35 },
    { minMiles: 15.1, maxMiles: 30, fee: 45 },
    { minMiles: 30.1, maxMiles: 60, fee: 75 },
  ],
  discountRules: [
    { itemCount: 2, pct: 10 },
    { itemCount: 3, pct: 20 },
  ],
  additionalHourlyRate: 5,
};

export function getDeliveryFee(
  miles: number,
  pricing: PricingSettings = DEFAULT_PRICING
): number {
  if (miles === 0) return 0; // pickup
  const tier = pricing.deliveryTiers.find(
    (t) => miles >= t.minMiles && miles <= t.maxMiles
  );
  return tier ? tier.fee : 0; // outside service area
}

// Returns the discount percentage for a given number of items
export function getDiscountPct(
  itemCount: number,
  pricing: PricingSettings = DEFAULT_PRICING
): number {
  // Find the highest matching discount tier
  const applicable = pricing.discountRules
    .filter((r) => itemCount >= r.itemCount)
    .sort((a, b) => b.itemCount - a.itemCount);
  return applicable[0]?.pct ?? 0;
}

export interface PricingBreakdown {
  items: ReservationItem[];
  subtotal: number;
  discountPct: number;
  discountTotal: number;
  deliveryFee: number; // each way
  deliveryTotal: number; // × 2 if both directions
  grandTotal: number;
  additionalHoursCharge: number;
}

export function calculatePricing(
  selectedItems: { inventoryId: string; displayName: string; price: number; quantity: number }[],
  deliveryType: "pickup" | "one_way" | "round_trip",
  miles: number,
  rentalHours: number,
  pricing: PricingSettings = DEFAULT_PRICING
): PricingBreakdown {
  // Expand quantities into individual units and sort most expensive first
  // so discounts always apply to cheaper games
  const units: { inventoryId: string; displayName: string; price: number }[] = [];
  for (const item of selectedItems) {
    for (let q = 0; q < item.quantity; q++) {
      units.push({ inventoryId: item.inventoryId, displayName: item.displayName, price: item.price });
    }
  }
  units.sort((a, b) => b.price - a.price);

  // Assign discount per unit: rank 0 = full price, rank 1 = 10% off, rank 2+ = 20% off
  const unitDiscounts = units.map((_, rank) => {
    if (rank === 0) return 0;
    if (rank === 1) return 10;
    return 20;
  });

  // Re-aggregate back into items with weighted average discount per line
  const items: ReservationItem[] = selectedItems.map((item) => {
    const unitPrice = item.price;
    // Find all units belonging to this item and their assigned discounts
    let remaining = item.quantity;
    let totalDiscount = 0;
    for (let u = 0; u < units.length && remaining > 0; u++) {
      if (units[u].inventoryId === item.inventoryId) {
        totalDiscount += unitDiscounts[u];
        remaining--;
      }
    }
    const avgDiscountPct = item.quantity > 0 ? totalDiscount / item.quantity : 0;
    const lineSubtotal = unitPrice * item.quantity;
    const lineDiscount = Math.round(lineSubtotal * (avgDiscountPct / 100) * 100) / 100;
    return {
      inventoryId: item.inventoryId,
      displayName: item.displayName,
      quantity: item.quantity,
      unitPrice,
      discountPct: avgDiscountPct,
      lineTotal: Math.round((lineSubtotal - lineDiscount) * 100) / 100,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountTotal = Math.round(
    units.reduce((sum, unit, rank) => sum + unit.price * (unitDiscounts[rank] / 100), 0) * 100
  ) / 100;
  const discountPct = subtotal > 0 ? Math.round((discountTotal / subtotal) * 100 * 10) / 10 : 0;

  // Extra hours charge (beyond base rental period)
  const additionalHours = Math.max(0, rentalHours - pricing.baseRentalHours);
  const additionalHoursCharge = additionalHours * pricing.additionalHourlyRate * units.length;

  const oneWayFee = deliveryType !== "pickup" ? getDeliveryFee(miles, pricing) : 0;
  const directions = deliveryType === "round_trip" ? 2 : deliveryType === "one_way" ? 1 : 0;
  const deliveryTotal = oneWayFee * directions;

  const grandTotal =
    Math.round((subtotal - discountTotal + deliveryTotal + additionalHoursCharge) * 100) / 100;

  return {
    items,
    subtotal,
    discountPct,
    discountTotal,
    deliveryFee: oneWayFee,
    deliveryTotal,
    grandTotal,
    additionalHoursCharge,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
