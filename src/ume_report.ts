import { Ume } from ".";

export class Ume_Report {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  async send({ subject, text }: { subject: string; text: string }) {
    await this._ume.sendgrid.send({
      from: "hackymail12@gmail.com",
      to: "hackymail12@gmail.com",
      subject,
      text,
    });
  }
}
