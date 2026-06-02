import { Resend } from "resend";
import { Reservation, Contract } from "@/types";
import { formatCurrency } from "@/lib/pricing";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  return new Resend(apiKey);
}

const FROM_EMAIL = "STL Yard Games <noreply@stlyardgames.com>";
const OWNER_EMAIL = "joeytomsfbr@gmail.com";

export async function sendReservationConfirmation(reservation: Reservation & { id: string }) {
  const resend = getResend();
  const itemsList = reservation.items
    .map((i) => `${i.quantity}× ${i.displayName} — ${formatCurrency(i.lineTotal)}`)
    .join("\n");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: reservation.email,
    bcc: OWNER_EMAIL,
    subject: "Your STL Yard Games Reservation Request",
    html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <img src="https://stlyardgames.com/stlyardgames.png" alt="STL Yard Games" width="120" style="margin-bottom:16px"/>
  <h2 style="color:#166534">Reservation Request Received!</h2>
  <p>Hi ${reservation.customerName},</p>
  <p>Thanks for reaching out to STL Yard Games! We've received your reservation request and will be in touch within 24 hours to confirm availability and next steps.</p>

  <h3 style="color:#166534">Your Request Summary</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#666">Pickup Date</td><td>${new Date((reservation.pickupDate as any).toDate?.() || reservation.pickupDate).toLocaleDateString()}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Return Date</td><td>${new Date((reservation.returnDate as any).toDate?.() || reservation.returnDate).toLocaleDateString()}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Delivery</td><td>${reservation.deliveryType === "delivery" ? reservation.eventAddress : "Customer Pickup (St. Peters)"}</td></tr>
  </table>

  <h3 style="color:#166534">Items Requested</h3>
  <pre style="background:#f9f9f9;padding:12px;border-radius:4px;font-size:13px">${itemsList}</pre>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
    ${reservation.discountTotal > 0 ? `<tr><td style="padding:4px 0;color:#666">Multi-item discount</td><td style="color:#16a34a">-${formatCurrency(reservation.discountTotal)}</td></tr>` : ""}
    ${reservation.deliveryTotal > 0 ? `<tr><td style="padding:4px 0;color:#666">Delivery (each way)</td><td>${formatCurrency(reservation.deliveryFee)}</td></tr>` : ""}
    <tr style="font-weight:bold"><td style="padding:8px 0">Estimated Total</td><td>${formatCurrency(reservation.grandTotal)}</td></tr>
  </table>

  <p style="margin-top:24px;color:#666;font-size:13px">Questions? Reply to this email or text us anytime.</p>
  <p style="color:#166534;font-weight:bold">STL Yard Games — St. Peters, MO</p>
</div>`,
  });
}

export async function sendOwnerNotification(reservation: Reservation & { id: string }) {
  const resend = getResend();
  const itemsList = reservation.items.map((i) => `${i.quantity}× ${i.displayName}`).join(", ");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `New Reservation Request — ${reservation.customerName}`,
    html: `
<div style="font-family:sans-serif">
  <h2>New Reservation Request</h2>
  <p><strong>Name:</strong> ${reservation.customerName}</p>
  <p><strong>Email:</strong> ${reservation.email}</p>
  <p><strong>Phone:</strong> ${reservation.phone}</p>
  <p><strong>Items:</strong> ${itemsList}</p>
  <p><strong>Pickup:</strong> ${new Date((reservation.pickupDate as any).toDate?.() || reservation.pickupDate).toLocaleDateString()}</p>
  <p><strong>Return:</strong> ${new Date((reservation.returnDate as any).toDate?.() || reservation.returnDate).toLocaleDateString()}</p>
  <p><strong>Delivery:</strong> ${reservation.deliveryType === "delivery" ? reservation.eventAddress : "Customer Pickup"}</p>
  <p><strong>Estimated Total:</strong> ${formatCurrency(reservation.grandTotal)}</p>
  ${reservation.eventNotes ? `<p><strong>Notes:</strong> ${reservation.eventNotes}</p>` : ""}
  <hr/>
  <p><a href="https://stlyardgames.com/admin/reservations/${reservation.id}">View in Admin Portal →</a></p>
</div>`,
  });
}

export async function sendContractEmail(
  reservation: Reservation & { id: string },
  contract: Contract & { id: string }
) {
  const resend = getResend();
  const contractUrl = `https://stlyardgames.com/contract/${contract.id}`;
  const itemsList = reservation.items
    .map((i) => `${i.quantity}× ${i.displayName}`)
    .join(", ");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: reservation.email,
    subject: "Your STL Yard Games Rental Agreement",
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <img src="https://stlyardgames.com/stlyardgames.png" alt="STL Yard Games" width="120" style="margin-bottom:16px"/>
  <h2 style="color:#166534">Your Rental Agreement is Ready</h2>
  <p>Hi ${reservation.customerName},</p>
  <p>Great news — your reservation is confirmed! Please review and sign your rental agreement using the button below to lock in your booking.</p>

  <p><strong>Items:</strong> ${itemsList}<br/>
  <strong>Pickup:</strong> ${new Date((reservation.pickupDate as any).toDate?.() || reservation.pickupDate).toLocaleDateString()}<br/>
  <strong>Total:</strong> ${formatCurrency(reservation.grandTotal)}</p>

  <div style="text-align:center;margin:32px 0">
    <a href="${contractUrl}" style="background:#166534;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
      Review & Sign Agreement →
    </a>
  </div>

  <p style="color:#666;font-size:13px">This link is unique to your reservation. If you have questions, reply to this email.</p>
  <p style="color:#166534;font-weight:bold">STL Yard Games — St. Peters, MO</p>
</div>`,
  });
}

export async function sendInvoiceEmail(
  reservation: Reservation & { id: string },
  invoiceUrl: string,
  invoiceNumber: string
) {
  const resend = getResend();

  await resend.emails.send({
    from: FROM_EMAIL,
    to: reservation.email,
    subject: `STL Yard Games Invoice #${invoiceNumber}`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <img src="https://stlyardgames.com/stlyardgames.png" alt="STL Yard Games" width="120" style="margin-bottom:16px"/>
  <h2 style="color:#166534">Your Invoice is Ready</h2>
  <p>Hi ${reservation.customerName},</p>
  <p>Your rental agreement has been signed — thank you! Your invoice is ready for payment.</p>
  <p><strong>Invoice #:</strong> ${invoiceNumber}<br/>
  <strong>Amount Due:</strong> ${formatCurrency(reservation.grandTotal)}</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${invoiceUrl}" style="background:#166534;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
      Pay Invoice →
    </a>
  </div>
  <p style="color:#166534;font-weight:bold">STL Yard Games — St. Peters, MO</p>
</div>`,
  });
}
