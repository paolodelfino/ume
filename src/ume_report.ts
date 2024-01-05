import { WebhookClient, WebhookMessageCreateOptions } from "discord.js";

export class Ume_Report {
  private _client;

  constructor({ webhook_url }: { webhook_url: string }) {
    this._client = new WebhookClient({
      url: webhook_url,
    });
  }

  /**
   * @param title Max 100
   * @param description Max 2000
   */
  async send({ title, description }: { title: string; description: string }) {
    if (title.length > 100) {
      throw new Error("Exceeded title max length of 100 chars");
    }
    if (description.length > 2000) {
      throw new Error("Exceeded title max length of 2000 chars");
    }

    const options: WebhookMessageCreateOptions = {
      username: "Ume",
      content: `## ${title}
*${description}*

*Sent on ${new Date(Date.now()).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}*
`,
    };
    await this._client.send(options);
  }
}
