/**
 * Search-intent synonym expansion.
 * Used by BOTH the product search API and the BANT AI assistant so that
 * discovery, SEO landing pages and AI recommendations share one data layer.
 */
const GROUPS: string[][] = [
  ["landline", "business landline", "fixed line", "epabx", "pri", "pri line", "pri connection", "telephone connection"],
  ["bulk email", "bulk mail", "mass email", "email marketing", "smtp", "bulk mailing"],
  ["bulk sms", "sms gateway", "sms api", "sms solution", "otp", "promotional sms", "transactional sms"],
  ["ai calling", "ai calling solution", "ai voice agent", "ai agent", "ai bot", "voice bot", "robotic calling"],
  ["sip trunk", "sip trunking", "voip trunk", "sip line", "voip line"],
  ["internet leased line", "leased line", "ill", "dedicated internet", "business internet", "business broadband", "leased internet"],
  ["cloud telephony", "virtual number", "toll free", "toll-free", "ivr", "cloud pbx", "hosted telephony", "call management"],
  ["auto dialer", "predictive dialer", "dialer", "outbound calling", "telecalling"],
  ["whatsapp business", "whatsapp api", "whatsapp business api", "whatsapp solution", "whatsapp marketing"],
  ["crm", "customer relationship management", "sales crm", "lead management"],
  ["erp", "enterprise resource planning", "erp software"],
  ["billing software", "gst billing", "invoicing software", "billing system", "gst software"],
  ["aws", "amazon web services", "aws cloud"],
  ["azure", "microsoft azure", "azure cloud"],
  ["google workspace", "business email", "email solution", "zimbra", "microsoft 365", "office 365"],
  ["gsm gateway", "sim gateway", "voip gateway", "gsm modem"],
  ["sim based calling", "sim calling", "sim based"],
  ["mpls", "mpls vpn", "sd-wan", "wan", "leased circuit"],
  ["p2p", "point to point", "point-to-point"],
  ["truecaller", "truecaller business", "caller id", "verified caller id"],
  ["attendance", "attendance management", "biometric attendance", "hrms", "time tracking", "payroll"],
  ["inventory", "inventory management", "stock management", "warehouse software"],
  ["vrp", "vehicle route planning", "fleet management", "route optimisation", "delivery tracking"],
  ["ibr", "interactive bot response"],
  ["firewall", "utm", "ngfw", "network security"],
  ["endpoint security", "edr", "antivirus", "ransomware protection"],
  ["ddos", "ddos protection", "ddos mitigation"],
  ["cloud hosting", "cloud server", "vps", "managed cloud", "cloud solution", "cloud solutions", "kubernetes"],
  ["call center", "call centre", "contact center", "contact centre"],
  ["it solutions", "it services", "technology solutions", "business software"],
];

const BRAND_FORMS: Record<string, string[]> = {
  tata: ["tata", "tata tele", "tata telex", "ttbs", "tata tele business services", "tata business"],
  airtel: ["airtel", "airtel business", "bharti airtel", "airtel landline"],
  jio: ["jio", "jio business", "reliance jio", "jiobusiness"],
};

/** Returns synonym phrases that should also match when the literal query does not. */
export function synonymAlternatives(q: string): string[] {
  const lq = q.toLowerCase();
  const alts = new Set<string>();
  for (const g of GROUPS) {
    if (g.some((m) => lq.includes(m))) g.forEach((m) => alts.add(m));
  }
  for (const [brand, forms] of Object.entries(BRAND_FORMS)) {
    if (forms.some((f) => lq.includes(f))) {
      alts.add(brand);
      forms.forEach((f) => alts.add(f));
    }
  }
  // never re-match the literal query itself
  return [...alts].filter((a) => a !== lq.trim());
}

/** Popular internal-search phrases surfaced as clickable suggestions (also used for SEO hubs). */
export const POPULAR_SEARCHES = [
  "SIP Trunk for AI Agent",
  "Tata Internet Leased Line",
  "MPLS",
  "Business Landline",
  "Cloud Telephony",
  "Bulk SMS provider",
  "WhatsApp Business API",
  "AI Calling Solution",
];
