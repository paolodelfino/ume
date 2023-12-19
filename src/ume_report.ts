import { WebhookClient, WebhookMessageCreateOptions } from "discord.js";

export class Ume_Report {
  private _client;

  constructor({ webhook_url }: { webhook_url: string }) {
    this._client = new WebhookClient({
      url: webhook_url,
    });
  }

  async send({ title, description }: { title: string; description: string }) {
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
