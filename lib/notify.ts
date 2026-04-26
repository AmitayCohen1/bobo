import { imagePathFor } from "./product-image";

type OrderSummary = {
  product: string;
  variantType: string | null;
  color: string | null;
  size: string;
  name: string;
  phone: string;
  notes: string | null;
};

const SITE_URL = "https://bobo-xi-five.vercel.app";

export async function notifyNewOrder(order: OrderSummary): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const productLine = [order.product, order.color, order.variantType]
    .filter(Boolean)
    .join(" · ");
  const headline = `🎉 *הזמנה חדשה!* 💰\n*${productLine}* — מידה ${order.size}`;
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

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎉 הזמנה חדשה: ${productLine} (${order.name})`,
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
