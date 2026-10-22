/* Roamance business details — the ONLY place to edit contact info.
 * Leave a value as '' until it is verified. Empty values are hidden on the site
 * (no "[Phone]" placeholders ever show publicly) and left out of structured data.
 */
window.ROAMANCE = {
  name: 'Roamance Trips and Holidays',
  tagline: 'Your Holidays, Closer to Heart.',

  city: '',            // e.g. 'Bengaluru'
  area: '',            // e.g. 'Indiranagar'
  state: '',           // e.g. 'Karnataka'
  pin: '',             // e.g. '560038'
  address: '',         // street address line, e.g. '12, 3rd Cross, 100 Feet Road'
  phone: '',           // display format, e.g. '+91 98765 43210'
  whatsapp: '',        // digits with country code, e.g. '919876543210'
  email: '',           // e.g. 'hello@roamance.in'
  hours: '',           // e.g. 'Mon–Sat, 10:00 am – 7:00 pm'
  website: '',         // e.g. 'https://www.roamance.in'
  mapUrl: '',          // Google Maps share link
  social: [],          // verified profile URLs, e.g. ['https://www.instagram.com/roamance']

  // Enquiry form destination. Paste a Formspree / Getform / Web3Forms endpoint (POST, JSON).
  // Until it is set, the form falls back to WhatsApp, then email, and never fakes a success message.
  formEndpoint: '',
};
