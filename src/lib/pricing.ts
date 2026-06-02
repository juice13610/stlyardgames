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
  deliveryType: "pickup" | "delivery",
  miles: number,
  rentalHours: number,
  pricing: PricingSettings = DEFAULT_PRICING
): PricingBreakdown {
  const itemCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const discountPct = itemCount >= 2 ? getDiscountPct(itemCount, pricing) : 0;

  const items: ReservationItem[] = selectedItems.map((item) => {
    const unitPrice = item.price;
    const lineSubtotal = unitPrice * item.quantity;
    const lineDiscount = Math.round(lineSubtotal * (discountPct / 100) * 100) / 100;
    return {
      inventoryId: item.inventoryId,
      displayName: item.displayName,
      quantity: item.quantity,
      unitPrice,
      discountPct,
      lineTotal: Math.round((lineSubtotal - lineDiscount) * 100) / 100,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountTotal = Math.round(subtotal * (discountPct / 100) * 100) / 100;

  // Extra hours charge (beyond base rental period)
  const additionalHours = Math.max(0, rentalHours - pricing.baseRentalHours);
  const additionalHoursCharge = additionalHours * pricing.additionalHourlyRate * itemCount;

  // Delivery is charged each way (to event + return pickup)
  const oneWayFee = deliveryType === "delivery" ? getDeliveryFee(miles, pricing) : 0;
  const deliveryTotal = oneWayFee * 2;

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
