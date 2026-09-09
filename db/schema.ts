import {
  customType,
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Postgres bytea column – used to store uploaded banner images (JPEG/PNG). */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ---------- Enums ----------
export const roleEnum = pgEnum("user_role", ["buyer", "vendor", "admin"]);
export const vendorStatusEnum = pgEnum("vendor_status", ["pending", "verified", "rejected", "suspended"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "pending", "approved", "rejected"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "proposal", "won", "lost"]);

// ---------- Users ----------
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    company: varchar("company", { length: 200 }),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("buyer"),
    emailVerified: boolean("email_verified").notNull().default(false),
    verifyToken: varchar("verify_token", { length: 80 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_role_idx").on(t.role)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 80 }).primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

// ---------- Vendors ----------
export const vendors = pgTable(
  "vendors",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    website: varchar("website", { length: 300 }),
    gstNumber: varchar("gst_number", { length: 30 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    logoUrl: text("logo_url"),
    contactEmail: varchar("contact_email", { length: 200 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords"),
    serviceAreas: jsonb("service_areas").$type<string[]>().notNull().default([]),
    status: vendorStatusEnum("status").notNull().default("pending"),
    isFeatured: boolean("is_featured").notNull().default(false),
    yearsInBusiness: integer("years_in_business"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("vendors_slug_idx").on(t.slug),
    uniqueIndex("vendors_user_idx").on(t.userId),
    index("vendors_status_idx").on(t.status),
  ]
);

// ---------- Categories ----------
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 10 }),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords"),
    seoH1: varchar("seo_h1", { length: 200 }),
    seoContent: text("seo_content"),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)]
);

// ---------- Products ----------
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    shortDescription: varchar("short_description", { length: 400 }),
    description: text("description"),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    plans: jsonb("plans").$type<{ name: string; price: string; period: string; features: string[] }[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().notNull().default([]),
    imageUrl: text("image_url"),
    gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
    brochureUrl: text("brochure_url"),
    videoUrl: text("video_url"),
    priceFrom: numeric("price_from", { precision: 12, scale: 2 }),
    priceUnit: varchar("price_unit", { length: 40 }),
    keywords: text("keywords"),
    searchText: text("search_text"),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    seoH1: varchar("seo_h1", { length: 200 }),
    primaryKeyword: varchar("primary_keyword", { length: 120 }),
    secondaryKeywords: text("secondary_keywords"),
    imageAlt: varchar("image_alt", { length: 300 }),
    noindex: boolean("noindex").notNull().default(false),
    status: productStatusEnum("status").notNull().default("pending"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPopular: boolean("is_popular").notNull().default(false),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).notNull().default("0"),
    ratingCount: integer("rating_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_vendor_idx").on(t.vendorId),
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
    index("products_featured_idx").on(t.isFeatured, t.isPopular),
  ]
);

// ---------- Favourites (saved products) ----------
export const favourites = pgTable(
  "favourites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favourites_user_product_idx").on(t.userId, t.productId), index("favourites_user_idx").on(t.userId)]
);

// ---------- Reviews ----------
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 200 }),
    body: text("body"),
    isApproved: boolean("is_approved").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)]
);

// ---------- Leads ----------
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    vendorId: integer("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    buyerUserId: integer("buyer_user_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    company: varchar("company", { length: 200 }),
    city: varchar("city", { length: 100 }),
    quantity: varchar("quantity", { length: 60 }),
    budget: varchar("budget", { length: 60 }),
    timeline: varchar("timeline", { length: 60 }),
    message: text("message"),
    status: leadStatusEnum("status").notNull().default("new"),
    source: varchar("source", { length: 60 }).notNull().default("product_page"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("leads_vendor_idx").on(t.vendorId),
    index("leads_product_idx").on(t.productId),
    index("leads_status_idx").on(t.status),
    index("leads_buyer_idx").on(t.buyerUserId),
  ]
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    authorRole: varchar("author_role", { length: 20 }).notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("lead_notes_lead_idx").on(t.leadId)]
);

// ---------- Content: blogs, banners ----------
export const blogs = pgTable(
  "blogs",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 240 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverUrl: text("cover_url"),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    isPublished: boolean("is_published").notNull().default(false),
    seoKeywords: text("seo_keywords"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blogs_slug_idx").on(t.slug)]
);

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  linkUrl: varchar("link_url", { length: 300 }),
  altText: varchar("alt_text", { length: 300 }),
  seoKeywords: text("seo_keywords"),
  position: varchar("position", { length: 40 }).notNull().default("home_hero"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------- Notifications, Activity, Settings ----------
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    link: varchar("link", { length: 300 }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.isRead)]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 40 }),
    entityId: integer("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("activity_created_idx").on(t.createdAt)]
);

export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- SEO control (admin managed, path based) ----------
export const seoOverrides = pgTable(
  "seo_overrides",
  {
    id: serial("id").primaryKey(),
    path: varchar("path", { length: 300 }).notNull(),
    title: varchar("title", { length: 200 }),
    description: text("description"),
    h1: varchar("h1", { length: 200 }),
    keywords: text("keywords"),
    canonical: varchar("canonical", { length: 400 }),
    ogTitle: varchar("og_title", { length: 200 }),
    ogDescription: text("og_description"),
    ogImage: varchar("og_image", { length: 500 }),
    noindex: boolean("noindex").notNull().default(false),
    inSitemap: boolean("in_sitemap").notNull().default(true),
    seoContent: text("seo_content"),
    altText: varchar("alt_text", { length: 300 }),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("seo_overrides_path_idx").on(t.path)]
);

export const redirects = pgTable(
  "redirects",
  {
    id: serial("id").primaryKey(),
    fromPath: varchar("from_path", { length: 300 }).notNull(),
    toPath: varchar("to_path", { length: 400 }).notNull(),
    statusCode: integer("status_code").notNull().default(301),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("redirects_from_idx").on(t.fromPath)]
);

// ---------- Relations ----------
export const usersRelations = relations(users, ({ one, many }) => ({
  vendor: one(vendors, { fields: [users.id], references: [vendors.userId] }),
  leads: many(leads),
}));
export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, { fields: [vendors.userId], references: [users.id] }),
  products: many(products),
  leads: many(leads),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, { fields: [products.vendorId], references: [vendors.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  reviews: many(reviews),
  leads: many(leads),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));
export const leadsRelations = relations(leads, ({ one, many }) => ({
  product: one(products, { fields: [leads.productId], references: [products.id] }),
  vendor: one(vendors, { fields: [leads.vendorId], references: [vendors.id] }),
  notes: many(leadNotes),
}));
export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, { fields: [leadNotes.leadId], references: [leads.id] }),
}));

// ---------- Uploads (admin-uploaded JPEG/PNG assets) ----------
export const uploads = pgTable(
  "uploads",
  {
    id: serial("id").primaryKey(),
    filename: varchar("filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 80 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    data: bytea("data").notNull(),
    uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("uploads_created_idx").on(t.createdAt)]
);
