import { assert } from "chai";
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
    title = title.trim();
    description = description.trim();

    assert.isAtMost(
      title.length,
      100,
      "Exceeded title max length of 100 chars"
    );
    assert.isAtMost(
      description.length,
      2000,
      "Exceeded description max length of 2000 chars"
    );

    const options: WebhookMessageCreateOptions = {
      username: "Ume",
      content: `## ${title}
*${description}*

*Sent on ${new Date().toLocaleString("en-US", {
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
