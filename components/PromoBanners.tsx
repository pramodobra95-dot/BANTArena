import PromoCarousel from "./PromoCarousel";
import { getPromoBanners } from "@/lib/queries";

/** Promotional banner strip rendered under the product catalog. Admin-managed via Admin → Banners & blogs. */
export default async function PromoBanners() {
  const banners = await getPromoBanners();
  if (!banners.length) return null;
  return <PromoCarousel banners={banners} />;
}
