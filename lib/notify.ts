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
};

const SITE_URL = "https://bobo-xi-five.vercel.app";

export async function notifyNewOrder(order: OrderSummary): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const productLine = [order.product, order.color, order.variantType]
    .filter(Boolean)
    .join(" · ");
  const qtyLabel = order.quantity > 1 ? ` · ×${order.quantity}` : "";
  const headline = `🎉💰 *הזמנה חדשה!*\n*${productLine}* — מידה ${order.size}${qtyLabel}`;
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

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎉 הזמנה חדשה: ${productLine}${qtyLabel} (${order.name})`,
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

type WaitlistSummary = {
  product: string;
  size: string;
  quantity: number;
  name: string;
  phone: string;
  notes: string | null;
};

export async function notifyNewWaitlistEntry(
  entry: WaitlistSummary
): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const qtyLabel = entry.quantity > 1 ? ` · ×${entry.quantity}` : "";
  const headline = `👀 *רישום לרשימת המתנה*\n*${entry.product}* — מידה ${entry.size}${qtyLabel}`;

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: headline },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*שם:*\n${entry.name}` },
        { type: "mrkdwn", text: `*טלפון:*\n${entry.phone}` },
      ],
    },
  ];

  if (entry.notes) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `📝 _${entry.notes}_` },
    });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `👀 רישום לרשימת המתנה: ${entry.product}${qtyLabel} (${entry.name})`,
        blocks,
      }),
    });
    if (!res.ok) {
      console.error("slack waitlist notify failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("slack waitlist notify threw", err);
  }
}
