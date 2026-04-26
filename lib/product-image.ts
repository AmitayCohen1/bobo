type ProductInfo = {
  product: string;
  variantType?: string | null;
  color?: string | null;
};

export function imagePathFor(order: ProductInfo): string {
  if (order.product === "חולצת מפוני הבובו") {
    return order.color === "חום"
      ? "/assets/hotel_bobo_shirt_brown.png"
      : "/assets/hotel_bobo_shirt_green.png";
  }
  if (order.product === "מפוני קריית ספר") {
    return order.variantType === "סווטשירט"
      ? "/assets/hotel_bobo_sweatshirt.png"
      : "/assets/kiryat_sefer_shirt.png";
  }
  return "/assets/favicon.ico";
}
