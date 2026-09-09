import { sql } from "drizzle-orm";
import { db } from "@/db";
import { banners, blogs, categories, products, reviews, settings, users, vendors, activityLogs } from "@/db/schema";
import { hashPassword } from "./auth";
import { buildSearchText, slugify } from "./utils";
import { CATEGORY_SEO, VENDOR_SEO } from "./seo-content";

type Cat = "it-software" | "telecom" | "cloud" | "communication" | "business-automation" | "ai-calling" | "security" | "marketing";

const CATEGORIES: { name: string; slug: Cat; icon: string; description: string; keywords: string }[] = [
  { name: "IT Software", slug: "it-software", icon: "💻", description: "CRM, ERP, billing, inventory and business software for Indian enterprises.", keywords: "crm software india, erp software, billing software, inventory management" },
  { name: "Telecom", slug: "telecom", icon: "📡", description: "Internet leased lines, PRI, SIP trunks, MPLS and point-to-point connectivity from top Indian carriers.", keywords: "internet leased line, PRI line, SIP trunk, MPLS, P2P, Tata, Airtel, Jio, Vodafone Idea" },
  { name: "Cloud", slug: "cloud", icon: "☁️", description: "Public, private and hybrid cloud hosting: AWS, Azure, GCP and Indian data-centre clouds.", keywords: "aws cloud india, azure cloud, cloud hosting, managed cloud" },
  { name: "Communication", slug: "communication", icon: "💬", description: "Cloud telephony, WhatsApp Business, email solutions and unified communication.", keywords: "cloud telephony, whatsapp business api, email hosting, ivr" },
  { name: "Business Automation", slug: "business-automation", icon: "⚙️", description: "Automate attendance, workflows, billing and operations.", keywords: "attendance management, workflow automation, hrms" },
  { name: "AI & Calling", slug: "ai-calling", icon: "🤖", description: "AI voice agents, auto dialers, IBR/IVR, GSM gateways and SIM-based calling solutions.", keywords: "ai agent calling, auto dialer, ibr, gsm gateway, sim based calling, truecaller business" },
  { name: "Security", slug: "security", icon: "🔐", description: "Firewalls, endpoint protection, DDoS mitigation and email security.", keywords: "firewall, endpoint security, ddos protection, soc" },
  { name: "Marketing", slug: "marketing", icon: "📣", description: "Bulk email, SMS, WhatsApp campaigns and lead-generation tools.", keywords: "bulk email, bulk sms, whatsapp marketing" },
];

const VENDORS = [
  { company: "Tata Tele Business Services", city: "Mumbai", state: "Maharashtra", years: 25, kw: "tata teleservices ttbs tata", featured: true },
  { company: "Airtel Business", city: "Gurugram", state: "Haryana", years: 22, kw: "airtel bharti", featured: true },
  { company: "Jio Business", city: "Navi Mumbai", state: "Maharashtra", years: 8, kw: "jio reliance", featured: true },
  { company: "CloudConnect Communications", city: "Bengaluru", state: "Karnataka", years: 12, kw: "cloudconnect knowlarity exotel", featured: true },
  { company: "NexGen Cloud Solutions", city: "Hyderabad", state: "Telangana", years: 9, kw: "nexgen aws azure partner", featured: false },
  { company: "Infinity Softlabs", city: "Pune", state: "Maharashtra", years: 11, kw: "infinity softlabs zoho tally", featured: false },
  { company: "VoxTel Technologies", city: "Noida", state: "Uttar Pradesh", years: 7, kw: "voxtel dinstar yeastar", featured: false },
  { company: "SecureEdge Networks", city: "Chennai", state: "Tamil Nadu", years: 10, kw: "secureedge fortinet sophos", featured: false },
];

type ProdSeed = {
  name: string;
  cat: Cat;
  vendor: number; // index into VENDORS
  short: string;
  desc: string;
  features: string[];
  price: number | null;
  unit: string;
  keywords: string;
  featured?: boolean;
  popular?: boolean;
  plans?: { name: string; price: string; period: string; features: string[] }[];
  faqs?: { q: string; a: string }[];
};

const img = (cat: Cat) => `/images/cat-${cat}.jpg`;

const PRODUCTS: ProdSeed[] = [
  { name: "Truecaller Business Verified Caller ID", cat: "ai-calling", vendor: 3, short: "Verified green badge, brand name & logo on every outbound call to boost answer rates.", desc: "Get your business verified on Truecaller so customers see your brand name, logo and verified badge instead of an unknown number. Improve call pick-up rates by up to 40%, reduce spam marking and build trust for sales, support and collections teams.", features: ["Verified business badge", "Brand name, logo & tagline on caller ID", "Call reason display", "Spam protection & number reputation monitoring", "Analytics dashboard", "Multi-number support"], price: 25000, unit: "per year", keywords: "truecaller business verified caller id brand identity call pickup rate spam", featured: true, popular: true },
  { name: "Bulk Email Marketing Platform", cat: "marketing", vendor: 5, short: "Send transactional & promotional emails at scale with 99% inbox delivery.", desc: "Enterprise bulk email solution with dedicated IPs, SPF/DKIM/DMARC setup, drag-and-drop templates, automation workflows and real-time analytics. Ideal for newsletters, OTPs, invoices and campaigns.", features: ["Dedicated IP & domain warm-up", "Drag-and-drop editor", "SMTP relay & REST API", "Automation & drip campaigns", "Bounce & complaint handling", "Real-time open/click reports"], price: 1499, unit: "per month", keywords: "bulk email mass mailing smtp email marketing campaign newsletter", popular: true },
  { name: "IBR – Interactive Bot Response", cat: "ai-calling", vendor: 3, short: "AI-powered voice bot that answers, qualifies and routes calls 24x7 in Indian languages.", desc: "IBR (Interactive Bot Response) replaces static IVR menus with a conversational AI agent. It understands natural speech in Hindi, English and regional languages, resolves FAQs, books appointments and hands off to human agents with full context.", features: ["Conversational AI in 10+ Indian languages", "Intent detection & smart routing", "CRM integration", "Call recording & transcripts", "Sentiment analytics", "Works with SIP trunk / PRI"], price: 9999, unit: "per month", keywords: "ibr interactive bot response ai voice bot ivr ai agent conversational", featured: true },
  { name: "Cloud Auto Dialer", cat: "ai-calling", vendor: 3, short: "Predictive, progressive & preview dialing for sales and collection teams.", desc: "Boost agent talk-time 3x with an intelligent cloud auto dialer. Upload leads, set campaign rules, and let the system dial, detect answering machines and connect only live calls to agents. Includes DND scrubbing and TRAI compliance.", features: ["Predictive / progressive / preview modes", "Answering machine detection", "DND scrubbing & TRAI compliance", "Live agent monitoring", "Call disposition & callbacks", "CRM & WhatsApp integration"], price: 1200, unit: "per agent / month", keywords: "auto dialer predictive dialer outbound calling call center telecalling", popular: true },
  { name: "Sales CRM for SMEs", cat: "it-software", vendor: 5, short: "Pipeline, lead management, WhatsApp & telephony built for Indian sales teams.", desc: "An intuitive CRM to capture leads from website, IndiaMART, JustDial and ads, assign them automatically, track follow-ups and close more deals. Mobile app, GST invoicing and WhatsApp integration included.", features: ["Lead capture from 20+ sources", "Visual pipeline", "Task & follow-up reminders", "Click-to-call & call logging", "Quotation & GST invoice", "Android/iOS apps"], price: 799, unit: "per user / month", keywords: "crm software sales crm lead management customer relationship zoho salesforce alternative", featured: true, popular: true },
  { name: "Enterprise ERP Suite", cat: "it-software", vendor: 5, short: "Finance, inventory, manufacturing, HR & GST compliance in one integrated ERP.", desc: "Modular cloud ERP for manufacturing, trading and distribution businesses. Covers procurement, production planning, inventory, finance with GST/e-invoicing, payroll and analytics with role-based access.", features: ["GST, e-invoicing & e-way bill", "Multi-branch & multi-currency", "Production planning & BOM", "Payroll & HR", "Business intelligence dashboards", "On-premise or cloud deployment"], price: 150000, unit: "one-time + AMC", keywords: "erp software enterprise resource planning manufacturing erp sap tally alternative", featured: true },
  { name: "Inventory Management Software", cat: "it-software", vendor: 5, short: "Real-time stock, barcode, multi-warehouse and purchase management.", desc: "Track inventory across warehouses and stores with barcode/QR scanning, reorder alerts, batch & expiry tracking and integration with e-commerce marketplaces and Tally.", features: ["Barcode & QR scanning", "Multi-warehouse", "Batch/serial/expiry tracking", "Reorder alerts", "Tally & marketplace integrations", "Stock audit reports"], price: 999, unit: "per month", keywords: "inventory management stock management warehouse software", popular: true },
  { name: "Attendance Management System", cat: "business-automation", vendor: 5, short: "Biometric, face-recognition & geo-fenced mobile attendance with payroll sync.", desc: "Cloud attendance with biometric devices, face recognition kiosk and GPS-based mobile punch for field staff. Automated shifts, leave management, overtime rules and payroll export.", features: ["Biometric & face recognition", "GPS mobile attendance", "Shift & roster management", "Leave & OT rules", "Payroll integration", "Compliance reports"], price: 49, unit: "per employee / month", keywords: "attendance management biometric attendance hrms time tracking payroll", popular: true },
  { name: "Cloud Telephony & Virtual Number", cat: "communication", vendor: 3, short: "Virtual numbers, IVR, call routing, recording and analytics without hardware.", desc: "Complete cloud telephony suite with virtual/toll-free numbers, multi-level IVR, smart call routing, missed-call alerts, recording and detailed analytics. Setup in 15 minutes.", features: ["Virtual & toll-free numbers", "Multi-level IVR", "Call recording", "Sticky agent routing", "Missed-call alerts", "CRM integration & APIs"], price: 1499, unit: "per month", keywords: "cloud telephony virtual number toll free ivr call management knowlarity exotel myoperator", featured: true, popular: true },
  { name: "Tata Internet Leased Line", cat: "telecom", vendor: 0, short: "Dedicated 1:1 symmetric enterprise internet with 99.5% uptime SLA across India.", desc: "Tata Tele Business Services Internet Leased Line (ILL) delivers dedicated, symmetric bandwidth on a fibre backbone with 99.5% uptime SLA, static IPs, 24x7 NOC support and proactive monitoring. Ideal for offices, BPOs and cloud-first enterprises.", features: ["Dedicated symmetric bandwidth 10 Mbps – 10 Gbps", "99.5% uptime SLA", "Static IP pool", "Low latency fibre backbone", "24x7 enterprise NOC", "Burstable bandwidth option"], price: 8000, unit: "per month (10 Mbps)", keywords: "tata internet leased line ill tata tele business services dedicated internet enterprise bandwidth", featured: true, popular: true },
  { name: "Airtel Internet Leased Line", cat: "telecom", vendor: 1, short: "Enterprise-grade dedicated internet from India's largest fibre network.", desc: "Airtel Business ILL offers dedicated bandwidth with 99.5% SLA, dual last-mile redundancy option, DDoS protection add-on and pan-India coverage across 1,000+ cities.", features: ["Dedicated symmetric bandwidth", "Dual last-mile redundancy", "DDoS protection add-on", "Pan-India coverage", "Static IPs", "Enterprise support"], price: 8500, unit: "per month (10 Mbps)", keywords: "airtel internet leased line ill airtel business dedicated internet", popular: true },
  { name: "Jio Internet Leased Line", cat: "telecom", vendor: 2, short: "High-capacity fibre ILL with quick provisioning and competitive pricing.", desc: "JioBusiness Internet Leased Line provides dedicated high-speed connectivity on an all-IP fibre network with rapid deployment, uptime SLA and value-added security services.", features: ["Symmetric dedicated bandwidth", "Rapid provisioning", "Uptime SLA", "Static IP", "Managed router option", "Security add-ons"], price: 7500, unit: "per month (10 Mbps)", keywords: "jio internet leased line ill jio business dedicated fibre internet" },
  { name: "PRI Line (Primary Rate Interface)", cat: "telecom", vendor: 0, short: "30-channel ISDN PRI for EPABX with DID numbers and pan-India calling.", desc: "Enterprise PRI line with 30 simultaneous voice channels, 100+ DID numbers, low per-minute tariffs and high voice quality for EPABX/call centres.", features: ["30 concurrent channels", "DID number series", "Competitive call tariffs", "CLI presentation", "Toll-free integration", "Redundant options"], price: 4000, unit: "per month + usage", keywords: "pri line primary rate interface isdn pri epabx tata airtel pri 30 channel", popular: true },
  { name: "SIP Trunk for AI Agents & Contact Centres", cat: "telecom", vendor: 3, short: "Carrier-grade SIP trunking with unlimited concurrent channels for AI voice agents, dialers and cloud PBX.", desc: "Our SIP Trunk is built for modern AI voice agents and contact centres. Connect Twilio-style platforms, Asterisk, FreeSWITCH, Vapi, Retell or any SIP-compatible AI agent directly to Indian DIDs with DoT-compliant termination, HD voice, elastic scaling and per-second billing.", features: ["Elastic concurrent channels", "DoT-compliant Indian termination", "Works with AI agent platforms (Vapi, Retell, Bland, custom LLM bots)", "HD voice codecs (G.711, Opus)", "Per-second billing", "Failover & geo-redundancy"], price: 2999, unit: "per month + usage", keywords: "sip trunk sip trunking ai agent ai voice agent contact centre asterisk freeswitch vapi retell voip trunk", featured: true, popular: true },
  { name: "Point-to-Point (P2P) Leased Circuit", cat: "telecom", vendor: 1, short: "Dedicated Layer-2 P2P connectivity between offices, DCs and branches.", desc: "Secure, private point-to-point leased circuits for connecting head office, branches and data centres with guaranteed bandwidth and ultra-low latency.", features: ["Layer-2 private circuit", "Guaranteed bandwidth", "Low latency", "Fibre & RF last-mile", "24x7 monitoring", "Scalable up to 100 Gbps"], price: 12000, unit: "per month", keywords: "p2p leased circuit point to point connectivity private line dc connectivity" },
  { name: "MPLS VPN Network", cat: "telecom", vendor: 0, short: "Managed MPLS Layer-3 VPN connecting multi-location enterprises with QoS.", desc: "Tata MPLS VPN provides a secure, any-to-any private network with class-of-service for voice, video and data, centralised internet breakout and managed CPE across 2,000+ Indian locations.", features: ["Any-to-any Layer-3 VPN", "QoS / class of service", "Managed CPE & monitoring", "Centralised internet breakout", "SD-WAN ready", "Global reach via partners"], price: 15000, unit: "per site / month", keywords: "mpls vpn mpls network multi location wan tata mpls airtel mpls jio mpls sd-wan", featured: true, popular: true },
  { name: "Airtel MPLS & SD-WAN", cat: "telecom", vendor: 1, short: "Hybrid MPLS + SD-WAN for secure, application-aware branch connectivity.", desc: "Combine Airtel MPLS with SD-WAN overlay for application-aware routing, cloud on-ramps and simplified branch management.", features: ["MPLS + broadband hybrid", "Application-aware routing", "Cloud on-ramps", "Centralised policy", "Zero-touch provisioning", "Analytics portal"], price: 14000, unit: "per site / month", keywords: "airtel mpls sd-wan hybrid wan branch connectivity" },
  { name: "Managed Cloud Hosting (India DC)", cat: "cloud", vendor: 4, short: "Fully managed VMs, Kubernetes and backups in MeitY-empanelled Indian data centres.", desc: "Managed cloud hosting with Indian data residency, 24x7 SRE support, automated backups, DR and predictable INR billing. Great for SaaS, ERP and regulated workloads.", features: ["MeitY-empanelled Indian DCs", "Managed Kubernetes", "Automated backups & DR", "24x7 SRE support", "Predictable INR pricing", "Migration assistance"], price: 3500, unit: "per month", keywords: "cloud hosting managed cloud india data centre vps kubernetes", popular: true },
  { name: "Microsoft Azure Cloud Services", cat: "cloud", vendor: 4, short: "Azure subscriptions, migration, managed services and cost optimisation via CSP.", desc: "As a Microsoft CSP partner we provision Azure subscriptions with INR billing, run assessments, migrate workloads, set up landing zones and provide ongoing FinOps and managed services.", features: ["Azure CSP with INR billing", "Landing zone & migration", "Azure AD / Entra ID setup", "Backup & Site Recovery", "Cost optimisation (FinOps)", "24x7 managed support"], price: null, unit: "pay as you go", keywords: "azure cloud microsoft azure csp partner cloud migration india", featured: true },
  { name: "AWS Cloud Consulting & Managed Services", cat: "cloud", vendor: 4, short: "AWS partner for architecture, migration, DevOps and 24x7 managed operations.", desc: "Certified AWS consulting partner delivering well-architected reviews, migrations, serverless/DevOps builds, security hardening and managed operations with consolidated INR billing.", features: ["AWS reseller billing in INR", "Well-Architected reviews", "Migration & modernisation", "DevOps & CI/CD", "Security & compliance", "24x7 CloudOps"], price: null, unit: "pay as you go", keywords: "aws cloud amazon web services aws partner cloud consulting managed aws india", popular: true },
  { name: "GSM Gateway (4/8/16/32 Port)", cat: "ai-calling", vendor: 6, short: "VoIP-to-GSM gateways for cost-effective mobile calling from your PBX or dialer.", desc: "Rack-mount GSM/VoLTE gateways with 4 to 32 SIM ports, SIP integration, SMS support, IMEI rotation and remote management. Perfect for call centres and enterprises wanting mobile-to-mobile tariffs.", features: ["4/8/16/32 SIM ports", "SIP & VoLTE support", "SMS send/receive", "Remote web management", "Call routing rules", "1-year warranty"], price: 28000, unit: "one-time (4 port)", keywords: "gsm gateway voip gateway sim gateway dinstar yeastar openvox 32 port", popular: true },
  { name: "SIM-Based Calling Solution", cat: "ai-calling", vendor: 6, short: "Cloud call management using your existing SIM cards – no PRI, no gateway.", desc: "App + cloud based calling that turns any Android phone with a business SIM into a monitored call-centre seat with recording, dialer, CRM sync and manager dashboards. Fully TRAI compliant.", features: ["Works with any SIM/operator", "Auto call recording", "Click-to-call dialer", "Live agent dashboard", "CRM/WhatsApp sync", "No hardware required"], price: 499, unit: "per user / month", keywords: "sim based calling sim calling solution mobile call recording telecalling app", featured: true },
  { name: "WhatsApp Business API Solution", cat: "communication", vendor: 3, short: "Official WhatsApp Business API with chatbot, broadcast, catalog and team inbox.", desc: "Get the official Meta WhatsApp Business API with green tick support, bulk broadcasts, no-code chatbots, shared team inbox, payment links and integrations with Shopify, CRM and ERP.", features: ["Official Meta BSP", "Green tick verification", "Broadcast & templates", "No-code chatbot builder", "Shared team inbox", "CRM / Shopify integration"], price: 1999, unit: "per month + Meta charges", keywords: "whatsapp business api whatsapp business solution chatbot broadcast green tick", featured: true, popular: true },
  { name: "Business Email Solution (Google Workspace / M365 / Zimbra)", cat: "communication", vendor: 5, short: "Professional email on your domain with security, backup and migration.", desc: "Choose Google Workspace, Microsoft 365 or cost-effective hosted Zimbra email. We handle domain setup, migration, security policies, archiving and ongoing support.", features: ["Google Workspace & M365 reseller", "Zimbra / Linux email hosting", "Migration & DNS setup", "Anti-spam & anti-phishing", "Email archiving", "Admin training"], price: 99, unit: "per mailbox / month", keywords: "email solution business email google workspace microsoft 365 zimbra email hosting" },
  { name: "VRP Solution – Vehicle Route Planning & Fleet Optimisation", cat: "business-automation", vendor: 5, short: "AI-powered vehicle routing, delivery scheduling and fleet tracking.", desc: "Optimise multi-stop delivery routes, cut fuel costs 20%+ and improve on-time delivery with AI-based Vehicle Route Planning, live GPS tracking, proof of delivery and customer notifications.", features: ["AI route optimisation", "Live GPS tracking", "Proof of delivery", "Customer SMS/WhatsApp alerts", "Driver app", "Analytics & SLA reports"], price: 4999, unit: "per month", keywords: "vrp solution vehicle route planning fleet management logistics optimisation delivery routing" },
  { name: "GST Billing & Invoicing Software", cat: "it-software", vendor: 5, short: "Fast GST invoicing, e-invoicing, inventory and accounting for SMEs.", desc: "Create GST-compliant invoices, e-invoices and e-way bills in seconds, manage receivables, track stock and file GSTR reports. Works online and offline with Tally export.", features: ["GST & e-invoice ready", "E-way bill generation", "Receivables & payment reminders", "Inventory tracking", "GSTR reports", "Tally export"], price: 3999, unit: "per year", keywords: "billing software gst billing invoicing software accounting tally vyapar alternative", popular: true },
  { name: "Enterprise Firewall & UTM", cat: "security", vendor: 7, short: "Next-gen firewall with IPS, web filtering, VPN and 24x7 managed SOC option.", desc: "Deploy next-generation firewalls (Fortinet, Sophos, Palo Alto) with unified threat management, SSL inspection, SD-WAN and optional managed SOC monitoring.", features: ["NGFW with IPS/IDS", "Web & app filtering", "Site-to-site & remote VPN", "SSL inspection", "Managed SOC option", "Compliance reporting"], price: 45000, unit: "one-time + subscription", keywords: "firewall utm ngfw fortinet sophos palo alto network security", featured: true },
  { name: "Endpoint Protection & EDR", cat: "security", vendor: 7, short: "AI-driven endpoint security with ransomware rollback and central console.", desc: "Protect laptops, desktops and servers with next-gen antivirus, EDR, device control and ransomware rollback managed from a single cloud console.", features: ["NGAV + EDR", "Ransomware rollback", "Device & USB control", "Patch management", "Cloud console", "MDM add-on"], price: 899, unit: "per device / year", keywords: "endpoint security edr antivirus ransomware protection crowdstrike sophos" },
  { name: "DDoS Protection for Leased Lines", cat: "security", vendor: 1, short: "Carrier-level volumetric DDoS scrubbing for your ILL and web services.", desc: "Always-on or on-demand DDoS mitigation at the carrier edge, protecting internet leased lines, DNS and web applications from volumetric and application-layer attacks.", features: ["Carrier-edge scrubbing", "Always-on / on-demand", "L3–L7 protection", "Real-time attack dashboard", "SLA-backed mitigation", "Works with any ILL"], price: 6000, unit: "per month", keywords: "ddos protection ddos mitigation leased line security airtel secure" },
  { name: "Bulk SMS & OTP Gateway", cat: "marketing", vendor: 3, short: "DLT-compliant transactional, OTP and promotional SMS with 99% delivery.", desc: "High-throughput SMS gateway with DLT registration support, OTP APIs, unicode/regional language support and real-time delivery reports.", features: ["DLT registration assistance", "OTP & transactional APIs", "Promotional campaigns", "Regional languages", "Delivery reports", "Sender ID management"], price: 0.15, unit: "per SMS", keywords: "bulk sms otp sms gateway dlt promotional sms transactional sms" },
];

function defaultPlans(p: ProdSeed) {
  const base = p.price ?? 0;
  const fmt = (n: number) => (n ? `₹${n.toLocaleString("en-IN")}` : "Custom");
  return [
    { name: "Starter", price: fmt(base), period: p.unit, features: p.features.slice(0, 3) },
    { name: "Business", price: fmt(Math.round(base * 2.2)), period: p.unit, features: p.features.slice(0, 5) },
    { name: "Enterprise", price: "Custom", period: "tailored SLA", features: [...p.features, "Dedicated account manager", "Priority 24x7 support"] },
  ];
}
function defaultFaqs(p: ProdSeed) {
  return [
    { q: `How quickly can ${p.name} be deployed?`, a: "Most deployments go live within 3–15 working days depending on location and feasibility. Cloud/software products can be activated within 24–48 hours." },
    { q: "Is GST invoicing available?", a: "Yes. All vendors on BANTConfirm are GST-registered and provide compliant tax invoices." },
    { q: "Do you provide support after purchase?", a: "Yes, the vendor provides onboarding, training and ongoing support as per the selected plan. Enterprise plans include a dedicated account manager." },
    { q: "How do I get a quote?", a: "Click “Request Quote” on this page. Your requirement is shared with the verified vendor who will contact you within one business day." },
  ];
}

const REVIEWERS = ["Rahul Mehta", "Priya Nair", "Amit Sharma", "Sneha Iyer", "Vikram Singh", "Kavita Rao", "Arjun Patel", "Neha Gupta"];
const REVIEW_TEXT = [
  "Smooth onboarding and responsive support team. Exactly what our operations needed.",
  "Good value for money. Deployment took a little longer than promised but works well.",
  "Reliable service, uptime has been excellent so far. Recommended for growing teams.",
  "Great product with strong Indian language and compliance support.",
];

let seeding: Promise<void> | null = null;

export async function ensureSeeded() {
  if (seeding) return seeding;
  seeding = (async () => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
    if (count > 0) return;
    await seed();
  })().catch((e) => {
    console.error("Seed failed", e);
    seeding = null;
  });
  return seeding;
}

export async function seed() {
  console.log("Seeding BANTConfirm database…");
  const pw = await hashPassword("Password@123");

  const catRows = await db
    .insert(categories)
    .values(
      CATEGORIES.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        seoTitle: `${c.name} Solutions for Business in India | BANTConfirm`,
        seoDescription: c.description,
        seoKeywords: c.keywords,
        seoH1: CATEGORY_SEO[c.slug]?.h1 ?? `${c.name} Solutions for Business in India`,
        seoContent: CATEGORY_SEO[c.slug]?.content ?? null,
        faqs: CATEGORY_SEO[c.slug]?.faqs ?? [],
        sortOrder: i,
      }))
    )
    .returning();
  const catId = Object.fromEntries(catRows.map((c) => [c.slug, c.id])) as Record<Cat, number>;

  const [admin] = await db
    .insert(users)
    .values({ name: "Platform Admin", email: "admin@bantconfirm.com", passwordHash: pw, role: "admin", emailVerified: true, company: "BANTConfirm" })
    .returning();
  await db.insert(users).values({ name: "Demo Buyer", email: "buyer@bantconfirm.com", passwordHash: pw, role: "buyer", emailVerified: true, company: "Acme Industries Pvt Ltd", phone: "9876543210" });

  const vendorRows: { id: number; companyName: string }[] = [];
  for (let i = 0; i < VENDORS.length; i++) {
    const v = VENDORS[i];
    const [u] = await db
      .insert(users)
      .values({ name: `${v.company} Team`, email: `vendor${i + 1}@bantconfirm.com`, passwordHash: pw, role: "vendor", emailVerified: true, company: v.company, phone: `98000000${(i + 10).toString()}` })
      .returning();
    const [vr] = await db
      .insert(vendors)
      .values({
        userId: u.id,
        companyName: v.company,
        slug: slugify(v.company),
        description: `${v.company} is a trusted provider of enterprise technology and telecom solutions serving businesses across India for ${v.years}+ years.`,
        city: v.city,
        state: v.state,
        status: "verified",
        isFeatured: v.featured,
        yearsInBusiness: v.years,
        contactEmail: `sales@${slugify(v.company).replace(/-/g, "")}.in`,
        contactPhone: `1800-100-${(1000 + i).toString()}`,
        gstNumber: `27AAAC${(1000 + i).toString()}A1Z${i}`,
        seoTitle: VENDOR_SEO[v.company]?.title ?? `${v.company} – Verified Vendor on BANTConfirm`,
        seoDescription: VENDOR_SEO[v.company]?.description ?? `${v.company} is a verified vendor on BANTConfirm. Compare their products, plans and pricing, then request a quote.`,
        seoKeywords: VENDOR_SEO[v.company]?.keywords ?? `${v.company}, ${v.city}`,
        serviceAreas: VENDOR_SEO[v.company]?.areas ?? ["India"],
      })
      .returning();
    vendorRows.push(vr);
  }

  const productRows = await db
    .insert(products)
    .values(
      PRODUCTS.map((p) => {
        const vendor = vendorRows[p.vendor];
        const catName = CATEGORIES.find((c) => c.slug === p.cat)!.name;
        let keywords = `${p.keywords} ${VENDORS[p.vendor].kw}`;
        // broaden coverage of common discovery phrases in search
        if (p.cat === "ai-calling" || /sip trunk/i.test(p.name) || /cloud telephony/i.test(p.name)) keywords += " ai calling solution ai voice agent solution";
        return {
          vendorId: vendor.id,
          categoryId: catId[p.cat],
          name: p.name,
          slug: slugify(p.name),
          shortDescription: p.short,
          description: p.desc,
          features: p.features,
          plans: p.plans ?? defaultPlans(p),
          faqs: p.faqs ?? defaultFaqs(p),
          imageUrl: img(p.cat),
          brochureUrl: `/brochures/${slugify(p.name)}.pdf`,
          videoUrl: null,
          priceFrom: p.price === null ? null : p.price.toString(),
          priceUnit: p.unit,
          keywords,
          searchText: buildSearchText({ name: p.name, shortDescription: p.short, description: p.desc, keywords, features: p.features, categoryName: catName, vendorName: vendor.companyName }),
          seoTitle: `${p.name} in India – Pricing, Features & Vendors | BANTConfirm`,
          seoDescription: p.short,
          status: "approved" as const,
          isFeatured: !!p.featured,
          isPopular: !!p.popular,
          viewCount: Math.floor(Math.random() * 900) + 100,
        };
      })
    )
    .returning({ id: products.id });

  // reviews
  const reviewValues = productRows.flatMap((p, i) => {
    const n = 2 + (i % 3);
    return Array.from({ length: n }, (_, k) => ({
      productId: p.id,
      authorName: REVIEWERS[(i + k) % REVIEWERS.length],
      rating: 4 + ((i + k) % 2),
      title: k === 0 ? "Solid B2B solution" : "Worth it",
      body: REVIEW_TEXT[(i + k) % REVIEW_TEXT.length],
    }));
  });
  await db.insert(reviews).values(reviewValues);
  await db.execute(sql`update products p set rating_avg = r.avg, rating_count = r.cnt from (select product_id, round(avg(rating)::numeric,2) avg, count(*) cnt from reviews group by product_id) r where r.product_id = p.id`);

  await db.insert(blogs).values([
    { title: "SIP Trunk vs PRI: Which is right for your AI voice agent in 2026?", slug: "sip-trunk-vs-pri-ai-voice-agent", excerpt: "A practical comparison of SIP trunking and PRI lines for contact centres and AI calling agents in India.", content: "SIP trunks deliver elastic capacity, per-second billing and native integration with AI agent platforms, while PRI remains a reliable choice for legacy EPABX. For AI voice agents, SIP is almost always the better fit because of API-driven provisioning, HD codecs and scalability.\n\nKey considerations: DoT compliance, concurrent channel needs, codec support, failover and CLI presentation.", authorId: admin.id, isPublished: true, seoKeywords: "sip trunk, pri, ai voice agent", coverUrl: "/images/cat-telecom.jpg" },
    { title: "How to choose an Internet Leased Line provider in India (Tata vs Airtel vs Jio)", slug: "choose-internet-leased-line-provider-india", excerpt: "Compare SLAs, last-mile options, pricing and support before signing a 12-month ILL contract.", content: "When evaluating ILL providers, look beyond headline pricing: uptime SLA (99.5% vs 99.9%), last-mile media (fibre vs RF), MTTR commitments, static IP allocation, burst options and NOC responsiveness. Ask for a feasibility check and reference customers in your area.", authorId: admin.id, isPublished: true, seoKeywords: "internet leased line, tata, airtel, jio", coverUrl: "/images/cat-cloud.jpg" },
    { title: "BANT qualification: how BANTConfirm delivers sales-ready B2B leads", slug: "bant-qualified-b2b-leads", excerpt: "Budget, Authority, Need and Timeline – why every enquiry on our platform captures them.", content: "Every enquiry on BANTConfirm captures Budget, Authority, Need and Timeline so vendors spend time only on real opportunities. Buyers benefit from faster, more relevant responses.", authorId: admin.id, isPublished: true, seoKeywords: "bant leads, b2b marketplace india", coverUrl: "/images/cat-it-software.jpg" },
  ]);

  await db.insert(banners).values([
    { title: "Verified telecom & IT vendors across India", subtitle: "Compare quotes for leased lines, SIP trunks, cloud and software in one place.", altText: "Indian businesses comparing telecom and IT solutions on BANTConfirm", seoKeywords: "b2b technology marketplace, verified vendors india", position: "home_hero", sortOrder: 0, linkUrl: "/products" },
    { title: "Become a verified vendor", subtitle: "Reach thousands of qualified B2B buyers every month.", position: "home_mid", sortOrder: 1, linkUrl: "/vendor/register" },
    // promotional carousel shown below the product catalog (rotates every 5 seconds)
    { title: "Post Your Requirement & Get the Right Solution", subtitle: "Tell us what your business needs and let verified technology vendors compete to offer you the right solution, pricing and support.", imageUrl: "/images/promo-requirement.jpg", altText: "Businesses posting requirements and receiving quotes from verified vendors", seoKeywords: "post requirement, business solutions, get quotes", linkUrl: "/contact", position: "promo", sortOrder: 0, isActive: true },
    { title: "Post Your Requirement & Earn up to 10% Rewards", subtitle: "Connect with the right vendor and get rewarded with up to 10% rewards when your eligible deal is successfully closed.", imageUrl: "/images/promo-rewards.jpg", altText: "Rewards promotion banner for buyers who close deals via BANTConfirm", seoKeywords: "rewards, buyer incentive, post requirement earn rewards", linkUrl: "/register", position: "promo", sortOrder: 1, isActive: true },
    { title: "Ask BANT AI – your free technology consultant", subtitle: "Describe your business need and get matched with SIP trunks, leased lines, cloud, CRM and more from verified vendors.", imageUrl: "/images/cat-cloud.jpg", altText: "BANT AI assistant recommending telecom, cloud and software solutions", seoKeywords: "bant ai, ai assistant, technology consultant", linkUrl: "/products", position: "promo", sortOrder: 2, isActive: true },
  ]);

  await db.insert(settings).values([
    { key: "site_name", value: "BANTConfirm" },
    { key: "support_email", value: "support@bantconfirm.com" },
    { key: "support_phone", value: "+91 1800 123 4567" },
    { key: "home_initial_products", value: "12" },
    { key: "auto_approve_products", value: "false" },
    { key: "lead_notification_email", value: "leads@bantconfirm.com" },
  ]);

  await db.insert(activityLogs).values({ actorId: admin.id, action: "platform.seeded", entity: "system", meta: { products: productRows.length, vendors: vendorRows.length } });
  console.log("Seed complete.");
}
