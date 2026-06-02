import { Suspense } from "react";
import BookingWizard from "@/components/public/BookingWizard";

export const metadata = {
  title: "Reserve Yard Games — STL Yard Games",
  description:
    "Reserve your yard games online. Check availability, calculate delivery, and submit your reservation request in minutes.",
};

export default function BookPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reserve Your Games</h1>
          <p className="text-gray-600">
            Fill out the form below. We'll confirm availability and send your rental agreement.
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-12 text-gray-400">Loading…</div>}>
          <BookingWizard />
        </Suspense>
      </div>
    </div>
  );
}
