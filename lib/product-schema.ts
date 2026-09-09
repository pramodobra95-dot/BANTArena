import { z } from "zod";
export const productInput = z.object({
  name: z.string().min(3).max(200),
  categoryId: z.coerce.number().int(),
  shortDescription: z.string().max(400).optional().or(z.literal("")),
  description: z.string().max(10000).optional().or(z.literal("")),
  features: z.array(z.string().max(200)).max(30).default([]),
  plans: z.array(z.object({ name: z.string().max(60), price: z.string().max(40), period: z.string().max(60), features: z.array(z.string().max(200)) })).max(6).default([]),
  faqs: z.array(z.object({ q: z.string().max(300), a: z.string().max(2000) })).max(20).default([]),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
  brochureUrl: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().max(500).optional().or(z.literal("")),
  priceFrom: z.union([z.coerce.number().nonnegative(), z.literal(""), z.null()]).optional(),
  priceUnit: z.string().max(40).optional().or(z.literal("")),
  keywords: z.string().max(1000).optional().or(z.literal("")),
  seoTitle: z.string().max(200).optional().or(z.literal("")),
  seoDescription: z.string().max(400).optional().or(z.literal("")),
  seoH1: z.string().max(200).optional().or(z.literal("")),
  primaryKeyword: z.string().max(120).optional().or(z.literal("")),
  secondaryKeywords: z.string().max(1000).optional().or(z.literal("")),
  imageAlt: z.string().max(300).optional().or(z.literal("")),
});
export type ProductInput = z.infer<typeof productInput>;
