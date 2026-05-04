import { imagePathFor } from "./product-image";

type Summary = {
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

async function postSlack(headline: string, fallbackText: string, summary: Summary): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const imageUrl = `${SITE_URL}${imagePathFor(summary)}`;

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: headline },
      accessory: {
        type: "image",
        image_url: imageUrl,
        alt_text: summary.product,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*שם:*\n${summary.name}` },
        { type: "mrkdwn", text: `*טלפון:*\n${summary.phone}` },
      ],
    },
  ];

  if (summary.notes) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `📝 _${summary.notes}_` },
    });
  }

  if (summary.heardFrom) {
    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `📣 שמע/ה עלינו דרך: *${summary.heardFrom}*` },
      ],
    });
  }

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

function productLine(s: Summary): string {
  return [s.product, s.color, s.variantType].filter(Boolean).join(" · ");
}

function qtyLabel(s: Summary): string {
  return s.quantity > 1 ? ` · ×${s.quantity}` : "";
}

export async function notifyNewOrder(order: Summary): Promise<void> {
  const line = productLine(order);
  const qty = qtyLabel(order);
  const headline = `🎉💰 *הזמנה חדשה!*\n*${line}* — מידה ${order.size}${qty}`;
  const fallbackText = `🎉 הזמנה חדשה: ${line}${qty} (${order.name})`;
  await postSlack(headline, fallbackText, order);
}

export async function notifyNewWaitlistEntry(entry: Summary): Promise<void> {
  const line = productLine(entry);
  const qty = qtyLabel(entry);
  const headline = `👀 *רישום לרשימת המתנה*\n*${line}* — מידה ${entry.size}${qty}`;
  const fallbackText = `👀 רישום לרשימת המתנה: ${line}${qty} (${entry.name})`;
  await postSlack(headline, fallbackText, entry);
}
