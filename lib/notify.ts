import { imagePathFor } from "./product-image";

type OrderSummary = {
  product: string;
  variantType: string | null;
  color: string | null;
  size: string;
  quantity: number;
  name: string;
  phone: string;
  notes: string | null;
  heardFrom: string | null;
  isWaitlist: boolean;
};

const SITE_URL = "https://bobo-xi-five.vercel.app";

export async function notifyNewOrder(order: OrderSummary): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const productLine = [order.product, order.color, order.variantType]
    .filter(Boolean)
    .join(" · ");
  const qtyLabel = order.quantity > 1 ? ` · ×${order.quantity}` : "";
  const headline = order.isWaitlist
    ? `👀 *רישום לרשימת המתנה*\n*${productLine}* — מידה ${order.size}${qtyLabel}`
    : `🎉💰 *הזמנה חדשה!*\n*${productLine}* — מידה ${order.size}${qtyLabel}`;
  const imageUrl = `${SITE_URL}${imagePathFor(order)}`;

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: headline },
      accessory: {
        type: "image",
        image_url: imageUrl,
        alt_text: order.product,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*שם:*\n${order.name}` },
        { type: "mrkdwn", text: `*טלפון:*\n${order.phone}` },
      ],
    },
  ];

  if (order.notes) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `📝 _${order.notes}_` },
    });
  }

  if (order.heardFrom) {
    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `📣 שמע/ה עלינו דרך: *${order.heardFrom}*` },
      ],
    });
  }

  const fallbackText = order.isWaitlist
    ? `👀 רישום לרשימת המתנה: ${productLine}${qtyLabel} (${order.name})`
    : `🎉 הזמנה חדשה: ${productLine}${qtyLabel} (${order.name})`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: fallbackText,
        blocks,
      }),
    });
    if (!res.ok) {
      console.error("slack notify failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("slack notify threw", err);
  }
}
