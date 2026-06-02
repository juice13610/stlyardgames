import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import ContractSigningForm from "./ContractSigningForm";
import Image from "next/image";
import { formatCurrency } from "@/lib/pricing";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;

  const contractDoc = await adminDb.collection("contracts").doc(contractId).get();
  if (!contractDoc.exists) notFound();

  const contract = { id: contractDoc.id, ...contractDoc.data() } as any;

  const resDoc = await adminDb.collection("reservations").doc(contract.reservationId).get();
  if (!resDoc.exists) notFound();

  const reservation = { id: resDoc.id, ...resDoc.data() } as any;

  const alreadySigned = !!contract.signedAt;

  const pickupDate = reservation.pickupDate?.toDate?.()?.toLocaleDateString() ?? "—";
  const returnDate = reservation.returnDate?.toDate?.()?.toLocaleDateString() ?? "—";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/stlyardgames.png"
            alt="STL Yard Games"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-900">Rental Agreement</h1>
          <p className="text-gray-500 text-sm">STL Yard Games — St. Peters, MO</p>
        </div>

        {alreadySigned ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Agreement Already Signed</h2>
            <p className="text-green-700">
              Signed by <strong>{contract.signerName}</strong>.<br />
              You're all set! We'll be in touch with your invoice.
            </p>
          </div>
        ) : (
          <>
            {/* Reservation summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-4">Reservation Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium">{reservation.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup</span>
                  <span>{pickupDate} at {reservation.pickupTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Return</span>
                  <span>{returnDate} at {reservation.returnTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span>
                    {reservation.deliveryType === "delivery"
                      ? reservation.eventAddress
                      : "Customer Pickup — St. Peters"}
                  </span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
                {reservation.items?.map((item: any) => (
                  <div key={item.inventoryId} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.displayName}
                    </span>
                    <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
                {reservation.discountTotal > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Multi-game discount</span>
                    <span>-{formatCurrency(reservation.discountTotal)}</span>
                  </div>
                )}
                {reservation.deliveryTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery (round trip)</span>
                    <span>{formatCurrency(reservation.deliveryTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-green-700">{formatCurrency(reservation.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-4">Rental Terms &amp; Conditions</h2>
              <div className="text-sm text-gray-700 space-y-3 max-h-64 overflow-y-auto pr-2">
                <p>
                  <strong>1. Rental Period.</strong> The rental period is as stated in your reservation. Equipment must be returned by the agreed return date and time. Late returns may incur additional charges.
                </p>
                <p>
                  <strong>2. Equipment Condition.</strong> Customer agrees to return all equipment in the same condition it was received. Normal wear is accepted. Damage beyond normal wear will be charged to the customer at replacement cost.
                </p>
                <p>
                  <strong>3. Loss &amp; Theft.</strong> Customer is responsible for the full replacement cost of any lost or stolen equipment during the rental period.
                </p>
                <p>
                  <strong>4. Cancellation.</strong> Cancellations made more than 72 hours before the rental start time are eligible for a full refund. Cancellations within 72 hours may be subject to a cancellation fee at STL Yard Games' discretion.
                </p>
                <p>
                  <strong>5. Weather.</strong> Outdoor use is at the customer's discretion. Equipment should be kept dry and protected from extreme weather. STL Yard Games is not responsible for weather-related cancellations unless rescheduling is arranged in advance.
                </p>
                <p>
                  <strong>6. Liability.</strong> Customer assumes full responsibility for safe use of equipment during the rental period. STL Yard Games is not liable for injury or damage arising from improper use.
                </p>
                <p>
                  <strong>7. Payment.</strong> Full payment is due prior to or at time of pickup/delivery. Invoices unpaid on the rental date may result in cancellation.
                </p>
                {contract.customNotes && (
                  <p>
                    <strong>Additional Notes:</strong> {contract.customNotes}
                  </p>
                )}
              </div>
            </div>

            <ContractSigningForm contractId={contractId} customerName={reservation.customerName} />
          </>
        )}
      </div>
    </div>
  );
}
