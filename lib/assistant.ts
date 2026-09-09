import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { formatINR, slugify } from "./utils";
import { SEO_HUBS } from "./seo-hubs";

export type AiProduct = { name: string; slug: string; shortDescription: string | null; priceLabel: string; unit: string | null; categoryName: string; ratingAvg: string; featured: boolean };
export type AiReply = { text: string; products: AiProduct[]; chips: string[]; links?: { label: string; href: string }[] };

function tokenize(q: string) {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 1 && !["for", "the", "and", "with", "a", "an", "of", "in", "to", "my", "me", "i", "want", "need", "get", "have", "are", "is", "do", "does", "can", "please", "about", "what", "which", "how", "much"].includes(t));
}

type KB = { terms: string[]; title: string; explain: string; category?: string; who?: string };

const KB: KB[] = [
  { terms: ["sip trunk", "sip trunking", "voip trunk", "siptrunk"], title: "SIP Trunk", category: "Telecom", explain: "A SIP Trunk connects your phone system (or AI voice agent) to the public telephone network over the internet, replacing physical copper lines. It gives you as many concurrent calls as you need, HD voice, per-second billing and DoT-compliant Indian numbers. It is the recommended backbone for AI voice agents, contact centres and cloud PBX because channels can be added instantly via API." },
  { terms: ["pri", "pri line", "primary rate interface", "isdn pri", "30 channel"], title: "PRI (Primary Rate Interface)", category: "Telecom", explain: "PRI is a traditional ISDN line carrying 30 simultaneous voice channels with its own number series (DIDs). It is reliable and ideal for EPABX systems, but capacity is fixed at 30 channels, so scaling means adding more PRIs. For AI agents and fast-scaling contact centres, a SIP trunk is usually more flexible." },
  { terms: ["internet leased line", "leased line", "dedicated internet", "ill", "tata internet leased line", "airtel internet leased line", "jio internet leased line"], title: "Internet Leased Line (ILL)", category: "Telecom", explain: "An Internet Leased Line is a dedicated, symmetric fibre connection for a business — bandwidth is yours alone with a 99.5%+ uptime SLA, static IPs and priority support. It powers offices, BPOs, cloud connectivity and heavy upload/download work. Providers like Tata, Airtel and Jio offer ILLs across Indian cities." },
  { terms: ["mpls", "mpls vpn", "sd-wan"], title: "MPLS VPN", category: "Telecom", explain: "MPLS creates a secure private network between all your branch offices and data centres, with quality-of-service so voice and video behave well. It is best for multi-location enterprises; SD-WAN is a modern hybrid overlay that can be combined with MPLS for cloud-friendly routing." },
  { terms: ["p2p", "point to point", "point-to-point", "leased circuit"], title: "Point-to-Point (P2P) Circuit", category: "Telecom", explain: "A P2P leased circuit is a private, dedicated Layer-2 link between exactly two sites — for example your head office and a data centre — with guaranteed bandwidth and very low latency. It is used when traffic must never share the public internet." },
  { terms: ["cloud telephony", "virtual number", "toll free", "toll-free", "ivr", "call management"], title: "Cloud Telephony", category: "Communication", explain: "Cloud telephony gives you a business phone system without hardware: virtual and toll-free numbers, multi-level IVR, smart routing to agents, call recording, missed-call alerts and analytics. You can go live in minutes and agents can work from anywhere." },
  { terms: ["ibr", "interactive bot response", "ai voice bot", "ai bot", "voice bot"], title: "IBR – Interactive Bot Response", category: "AI & Calling", explain: "IBR is an AI voice bot that answers customer calls in natural language (Hindi, English and regional languages), resolves FAQs, books appointments and routes complex calls to human agents with full context. It runs on top of SIP trunks / PRI and is great for 24x7 support without a large team." },
  { terms: ["auto dialer", "predictive dialer", "dialer", "robo calling", "outbound dialer"], title: "Cloud Auto Dialer", category: "AI & Calling", explain: "An auto dialer automates outbound calling for sales, collections and surveys: the system dials, detects live answers and only connects agents to real people — boosting talk time up to 3x. It includes DND scrubbing and TRAI compliance." },
  { terms: ["gsm gateway", "sim gateway", "gsm", "voip gateway"], title: "GSM Gateway", category: "AI & Calling", explain: "A GSM gateway is a hardware device (4 to 32 SIM ports) that connects a PBX or dialer to mobile networks, letting you use cost-effective mobile tariffs for outbound calls and SMS. A hosted 'SIM-based calling' alternative removes the hardware entirely." },
  { terms: ["sim based calling", "sim calling", "sim based"], title: "SIM-Based Calling", category: "AI & Calling", explain: "SIM-based calling turns your existing business SIM cards (any operator) into a monitored calling system: app + cloud with recording, click-to-dial, CRM sync and manager dashboards — no PRI and no gateway hardware. Fully TRAI compliant." },
  { terms: ["whatsapp business", "whatsapp api", "whatsapp solution", "whatsapp"], title: "WhatsApp Business API", category: "Communication", explain: "The official WhatsApp Business API lets you send verified broadcasts and template messages, run chatbots, share a catalog with payment links and manage a shared team inbox — with a green tick for your brand. Useful for marketing, support and order updates." },
  { terms: ["truecaller", "truecaller business", "caller id"], title: "Truecaller Business", category: "AI & Calling", explain: "Truecaller Business verifies your outbound calls so customers see your brand name, logo and a verified badge instead of an unknown number. It raises answer rates, reduces spam marking and builds trust for sales and collections." },
  { terms: ["bulk email", "email marketing", "bulk sms", "sms gateway", "otp"], title: "Bulk Email & SMS", category: "Marketing", explain: "Bulk email and SMS platforms deliver marketing campaigns, OTPs and transactional messages at scale with deliverability tooling (SPF/DKIM/DMARC, DLT registration) and real-time reports." },
  { terms: ["crm", "sales crm", "customer relationship", "lead management"], title: "CRM", category: "IT Software", explain: "A CRM organises leads, deals and follow-ups in one visual pipeline so sales teams never miss a customer. Modern CRMs capture leads from IndiaMART/JustDial/website, log calls, and integrate WhatsApp and GST invoicing." },
  { terms: ["erp", "enterprise resource planning"], title: "ERP", category: "IT Software", explain: "An ERP unifies finance, inventory, manufacturing, HR and GST compliance in one system with role-based access. It suits manufacturing, trading and distribution businesses that have outgrown disconnected tools." },
  { terms: ["inventory", "stock management", "warehouse"], title: "Inventory Management", category: "IT Software", explain: "Inventory software tracks stock in real time with barcode scanning, multi-warehouse support, reorder alerts and integrations with Tally and e-commerce marketplaces." },
  { terms: ["attendance", "hrms", "time tracking", "biometric"], title: "Attendance Management", category: "Business Automation", explain: "Attendance systems capture punches via biometrics, face recognition or GPS mobile apps, then automate shifts, leave, overtime and payroll exports." },
  { terms: ["billing software", "gst billing", "invoicing software", "gst invoice"], title: "GST Billing Software", category: "IT Software", explain: "Billing software creates GST-compliant invoices, e-invoices and e-way bills in seconds, tracks receivables and stock, and exports GSTR reports." },
  { terms: ["vrp", "vehicle route planning", "fleet", "route optimisation", "logistics"], title: "VRP – Vehicle Route Planning", category: "Business Automation", explain: "VRP software uses AI to optimise multi-stop delivery routes, track vehicles live, capture proof of delivery and notify customers — cutting fuel costs by 20%+." },
  { terms: ["aws", "amazon web services"], title: "AWS Cloud", category: "Cloud", explain: "AWS offers the world's broadest cloud platform (compute, storage, AI/ML). Indian businesses typically buy through an AWS partner like ours for INR billing, migration help and 24x7 managed operations." },
  { terms: ["azure", "microsoft azure"], title: "Microsoft Azure", category: "Cloud", explain: "Azure is Microsoft's cloud with deep Windows/.NET and Microsoft 365 integration. Buying via a CSP partner gives INR billing, landing-zone setup, backup/disaster recovery and FinOps." },
  { terms: ["cloud hosting", "cloud solutions", "managed cloud", "vps", "kubernetes", "cloud"], title: "Cloud Hosting & Solutions", category: "Cloud", explain: "Cloud hosting runs your applications on virtual machines, containers (Kubernetes) or serverless with backups, scaling and data residency in Indian data centres. Managed plans include 24x7 support." },
  { terms: ["firewall", "utm", "ngfw", "security", "endpoint", "edr", "antivirus", "ddos"], title: "Cyber Security", category: "Security", explain: "Enterprise security stacks combine next-gen firewalls (Fortinet/Sophos/Palo Alto), endpoint protection with ransomware rollback, and DDoS scrubbing for leased lines — with optional 24x7 managed SOC." },
];

function priceLabel(p: { priceFrom: string | null; priceUnit: string | null }): { label: string; unit: string | null } {
  const f = formatINR(p.priceFrom);
  return { label: f ?? "Custom Pricing", unit: p.priceUnit ?? null };
}

async function retrieve(q: string, limit = 4): Promise<AiProduct[]> {
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  const phrase = `%${q.toLowerCase()}%`;
  const conds = [
    eq(products.status, "approved"),
    inArray(vendors.status, ["verified", "pending"]),
    or(...tokens.map((t) => sql`${products.searchText} ~* ${"[[:<:]]" + t + "[[:>:]]"}`))!,
  ];
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      priceFrom: products.priceFrom,
      priceUnit: products.priceUnit,
      categoryName: categories.name,
      ratingAvg: products.ratingAvg,
      featured: products.isFeatured,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(...conds))
    .orderBy(sql`CASE WHEN ${products.name} ILIKE ${phrase} THEN 0 ELSE 1 END`, desc(products.isFeatured), desc(products.ratingAvg), desc(products.viewCount))
    .limit(limit + 2);
  return rows.map((r) => ({ name: r.name, slug: r.slug, shortDescription: r.shortDescription, categoryName: r.categoryName, ratingAvg: r.ratingAvg, featured: r.featured, ...priceLabel(r), priceLabel: priceLabel(r).label }));
}

function kbTermHit(lq: string, term: string) {
  // whole-word/phrase match so short terms like "pri" never hit inside "pricing"
  const words = lq.split(/[^a-z0-9]+/);
  const termWords = term.split(/\s+/).filter(Boolean);
  outer: for (let i = 0; i <= words.length - termWords.length; i++) {
    for (let j = 0; j < termWords.length; j++) {
      if (words[i + j] !== termWords[j]) continue outer;
    }
    return true;
  }
  return false;
}

/** SEO buying-guide pages relevant to a query – keeps AI answers linked to indexable pages. */
function hubLinks(q: string): { label: string; href: string }[] {
  const lq = q.toLowerCase();
  const hits = SEO_HUBS.filter((h) =>
    h.keywords.some((k) => lq.includes(k) || k.includes(lq)) ||
    h.query.split(/\s+/).some((w) => w.length > 3 && lq.includes(w)) ||
    lq.includes(h.slug.replace(/-/g, " "))
  ).slice(0, 3);
  return hits.map((h) => ({ label: `Guide: ${h.h1}`, href: `/solutions/${h.slug}` }));
}

function findKB(q: string): KB[] {
  const lq = q.toLowerCase();
  return KB.filter((k) => k.terms.some((t) => kbTermHit(lq, t))).slice(0, 2);
}

const CHIP_SET = {
  rec: ["I need an Internet Leased Line", "Compare PRI vs SIP Trunk", "Explain Cloud Telephony", "How do I request a quote?"],
  vendor: ["How do vendors get verified?", "How do I list a product?", "How does pricing work?", "What is BANTConfirm?"],
  buyer: ["Recommend a CRM for 20 sales agents", "WhatsApp Business API pricing", "How does requesting a quote work?", "Show popular products"],
};

async function recommendation(q: string): Promise<AiReply> {
  const items = await retrieve(q, 4);
  if (!items.length) {
    return {
      text: `I couldn't find an exact match for “${q}” in our catalog yet — but our marketplace keeps growing. Try one of these verified best-sellers, or describe your need differently (e.g. number of users, calling volumes, city).`,
      products: await retrieve("popular", 4).catch(() => []),
      chips: ["Show popular products", "SIP Trunk for AI agent", "Internet Leased Line in Mumbai", "Talk to a solution advisor"],
    };
  }
  const lines = items.map((p, i) => {
    const price = p.priceLabel === "Custom Pricing" ? "Custom Pricing" : `${p.priceLabel}${p.unit ? ` / ${p.unit}` : ""}`;
    return `${i + 1}. **${p.name}** — ${price}\n   ${p.shortDescription ?? ""}`;
  });
  return {
    text: `Based on your need — “${q}” — here are the best-matching solutions from verified vendors on BANTConfirm:\n\n${lines.join("\n\n")}\n\nAll are GST-registered and delivered across India. Open any product to see plans, or tap Request Quote — the vendor responds within one business day.\n\nTo narrow it down further, tell me your budget, scale (users/lines/sites) and city.`,
    products: items,
    chips: CHIP_SET.buyer,
    links: hubLinks(q),
  };
}

export async function runAssistant(messages: { role: string; content: string }[]): Promise<AiReply> {
  const q = (messages.filter((m) => m.role === "user").at(-1)?.content ?? "").trim();
  const lq = q.toLowerCase();

  // --- greetings & small talk
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(lq) && lq.length < 30) {
    return { text: "Hello! 👋 I'm BANT AI, BANTConfirm's assistant. I can recommend telecom, cloud, software and AI-calling solutions, explain products and pricing, or guide you as a buyer or vendor. What are you looking for today?", products: [], chips: ["What is BANTConfirm?", "Recommend a SIP trunk for AI agents", "I need an Internet Leased Line", "How do I become a vendor?"] };
  }
  if (/^(thanks|thank you|thx|dhanyavad)\b/.test(lq)) return { text: "You're welcome! 😊 Anything else — product recommendations, pricing, comparisons, or vendor onboarding — just ask.", products: [], chips: CHIP_SET.buyer };
  if (/^(help|what can you do|capabilities)/.test(lq)) return { text: "Here's what I can help with:\n• Recommend the right product (SIP trunk, MPLS, leased line, CRM, cloud…)\n• Explain any solution and its typical pricing\n• Compare two products\n• Guide buyers to request quotes\n• Guide vendors through registration, verification and listing\n\nTry asking: “Recommend a cloud telephony for a 50-agent call centre” or “Compare PRI vs SIP Trunk”.", products: [], chips: [...CHIP_SET.buyer.slice(0, 2), ...CHIP_SET.vendor.slice(0, 2)] };

  // --- about platform
  if (/what is bant|about bant|who are you|what does bant|bantconfirm\b.*what|tell me about/.test(lq)) {
    return {
      text: "**BANTConfirm** is India's B2B technology marketplace. We connect businesses with **verified** telecom, cloud, software, communication, AI-calling and security vendors.\n\nWhy 'BANT'? Every enquiry captures **B**udget, **A**uthority, **N**eed and **T**imeline — so vendors receive genuinely qualified leads, and buyers get fast, relevant responses.\n\nBuyers can search 2,000+ solutions (leased lines, SIP trunks, MPLS, CRM, ERP, AWS/Azure…), compare plans, and request quotes in one click. Vendors get a free storefront, verification, and BANT-qualified leads. Ask me for product recommendations anytime!",
      products: [], chips: CHIP_SET.buyer,
    };
  }
  if (/how (does|do) bant|how (does )?it work|how the platform works|how does this work/.test(lq)) {
    return {
      text: "BANTConfirm works in 3 steps:\n\n**1. Search & compare** — browse by category or describe what you need (e.g. “SIP trunk for AI agents”).\n**2. Request a quote** — share your Budget, Authority, Need and Timeline once.\n**3. Close with confidence** — verified vendors respond within one business day; you compare offers and buy directly.\n\nVendors register free, get GST/KYC verified, list products with pricing and brochures, and receive enquiries in their dashboard. Try searching for a product below!",
      products: await retrieve("popular", 3).catch(() => []), chips: CHIP_SET.buyer,
    };
  }

  // --- buyer flow
  if (/request(ing)? a? quote|how (do i|to) (get|ask for|raise).*quote|contact vendor|request quote/.test(lq)) {
    return {
      text: "Requesting a quote on BANTConfirm takes under a minute:\n\n1. Open the product you like and tap **“Request Quote”**.\n2. Fill the short form — name, work email, mobile, company, and the BANT fields: budget range and timeline.\n3. The enquiry goes securely to the product's verified vendor (and your account, if logged in).\n4. The vendor responds within one business day with pricing and next steps.\n\nIt's free and you're never spammed — your data is only shared with that vendor. Want me to find a product to start with?",
      products: [], chips: ["Recommend a product for my business", "What is BANTConfirm?"],
    };
  }

  // --- vendor flow
  if (/become a vendor|vendor (registration|register|signup|sign up)|how (do|can) (i|vendors) (sell|list)|list (my )?product|sell on/.test(lq)) {
    return {
      text: "Listing on BANTConfirm is free and takes about 10 minutes:\n\n1. **Register** at /vendor/register with your company details and GST number.\n2. **Get verified** — our team checks GST/KYC within 1–2 business days (you get a Verified badge).\n3. **Add products** from your dashboard — name, category, description, pricing/plans, features, image, brochure/video and SEO keywords.\n4. **Receive BANT-qualified leads** in your dashboard with notes, status tracking and buyer contact details.\n\nProducts go live after a quick admin review. Tap below to start!",
      products: [], chips: ["What is BANTConfirm?", "How do buyers request quotes?"],
    };
  }
  if (/vendor (verif|approved|approval)|get verified|gst.*verif|verification status/.test(lq)) {
    return {
      text: "Vendor verification works like this:\n• After registration, your profile status is **pending**.\n• The BANTConfirm team validates your GST number and business details (KYC) — typically within 1–2 business days.\n• Once verified you get a blue **Verified badge**, higher visibility, and approval settings may auto-publish your products.\n• Products you add while pending are still saved; they go live after review.\n\nYou'll see your status in the Vendor Dashboard → Company Profile.",
      products: [], chips: ["How do I list a product?", "How does pricing work?"],
    };
  }

  // --- comparison
  const kbs = findKB(lq);
  if (/(compare|comparison|vs\.?|versus|difference between|better than)/.test(lq) && kbs.length >= 2) {
    const [a, b] = kbs;
    const pa = await retrieve(a.terms[0], 2);
    const pb = await retrieve(b.terms[0], 2);
    const fa = pa[0];
    const fb = pb[0];
    const line = (p: AiProduct | undefined) => (p ? `${p.priceLabel}${p.unit ? ` / ${p.unit}` : ""}` : "—");
    return {
      text: `Here's a quick comparison of **${a.title}** vs **${b.title}**:\n\n**${a.title}** — ${a.explain}\n• Marketplace range: ${line(fa)}\n• Recommended for: ${a.who ?? "businesses matching your scale"}\n\n**${b.title}** — ${b.explain}\n• Marketplace range: ${line(fb)}\n• Recommended for: ${b.who ?? "businesses matching your scale"}\n\nOpen the products below for full plans, or tell me your use-case (e.g. AI agents, EPABX, 50 employees) and I'll recommend one.`,
      products: [fa, fb].filter((x): x is AiProduct => !!x),
      chips: [`Recommend ${a.title} for my business`, `Recommend ${b.title} for my business`, "Compare ILL vs MPLS"],
      links: hubLinks(`${a.title} ${b.title}`),
    };
  }

  // --- price question on a specific product
  if (/(price|pricing|cost|rate|charges|how much|plans?|fees)/.test(lq)) {
    const kbHit = findKB(lq)[0];
    const items = await retrieve(kbHit ? kbHit.terms[0] : q, 1);
    if (items[0]) {
      const p = items[0];
      const d = await db.query.products.findFirst({ where: eq(products.slug, p.slug) });
      const planLine = d?.plans?.length ? d.plans.slice(0, 3).map((pl) => `${pl.name}: ${pl.price}${pl.period ? ` (${pl.period})` : ""}`).join(" · ") : null;
      return {
        text: `For **${p.name}**:\n• Starting price: **${p.priceLabel}**${p.unit ? ` (${p.unit})` : ""}\n${planLine ? `• Typical plans: ${planLine}\n` : "• Plans: available on the product page\n"}• Category: ${p.categoryName}${Number(p.ratingAvg) > 0 ? ` · Rated ${p.ratingAvg}/5` : ""}\n\nPricing varies with volume and location, so the exact quote comes from the verified vendor after you request it. Tap the product to see full plans.`,
        products: [p],
        chips: [`Request quote for ${p.name.slice(0, 40)}`, "Is there a cheaper alternative?", "Explain the pricing unit"],
        links: hubLinks(p.name),
      };
    }
  }

  // --- product explanation
  if (kbs.length) {
    const kb = kbs[0];
    const items = await retrieve(kb.terms[0], 3);
    const itemLines = items.length
      ? `\n\nHere are verified ${kb.title} solutions on the platform:\n${items.map((p, i) => `${i + 1}. **${p.name}** — ${p.priceLabel}${p.unit ? ` / ${p.unit}` : ""}`).join("\n")}`
      : "";
    return {
      text: `**${kb.title}** — ${kb.explain}${kb.who ? `\n\nBest for: ${kb.who}` : ""}${itemLines}\n\nOpen one to view plans and request a quote, or ask me to compare it with another option.`,
      products: items,
      chips: [`Compare ${kb.title} with an alternative`, `Recommend ${kb.title} for my business`, ...CHIP_SET.buyer.slice(0, 1)],
      links: hubLinks(`${kb.title} ${kb.terms.join(" ")}`),
    };
  }

  // --- fallback recommendation (search-like)
  const items = await retrieve(q, 4);
  if (items.length) return recommendation(q);
  return {
    text: `I understand you're looking for “${q}” — could you share a little more detail? For example: are you an enterprise or SME, how many users/calling agents/sites do you need, and which city?\n\nMeanwhile, here are popular verified solutions you can explore:`,
    products: await retrieve("popular", 4).catch(() => []),
    chips: [...CHIP_SET.buyer, ...CHIP_SET.vendor],
  };
}

export async function assistantWithLLM(messages: { role: string; content: string }[]): Promise<AiReply | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const q = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const catalog = await retrieve(q, 6);
    const ctx = catalog.map((p) => `${p.name} | ${p.categoryName} | ${p.priceLabel}${p.unit ? "/" + p.unit : ""} | ${p.shortDescription ?? ""} | /products/${p.slug}`).join("\n");
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: `You are BANT AI, the assistant of BANTConfirm — India's B2B technology marketplace (BANT = Budget, Authority, Need, Timeline). Be concise, professional, and recommend only REAL products listed below. Never invent prices; if none shown, say "Custom Pricing". Real catalog:\n${ctx}\nIf nothing matches, suggest browsing /products or describe needs (budget, scale, city).` },
          ...messages.slice(-8),
        ],
      }),
    });
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content;
    if (!text) return null;
    return { text, products: catalog, chips: ["Show popular products", "How do I request a quote?"] };
  } catch {
    return null;
  }
}

export { slugify };
