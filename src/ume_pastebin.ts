import PasteClient, { Publicity } from "pastebin-api";

export class Ume_Pastebin {
  private _client!: PasteClient;
  private _token!: string;

  async init({
    pastebin_api_key,
    pastebin_name,
    pastebin_password,
  }: {
    pastebin_api_key: string;
    pastebin_name: string;
    pastebin_password: string;
  }) {
    this._client = new PasteClient(pastebin_api_key);
    this._token = await this._client.login({
      name: pastebin_name,
      password: pastebin_password,
    });
  }

  async get(name: string) {
    const key = (
      await this._client.getPastesByUser({
        userKey: this._token,
      })
    ).find((paste) => paste.paste_title == name)?.paste_key;

    if (key) {
      return this._client.getRawPasteByKey({
        userKey: this._token,
        pasteKey: key,
      });
    }
  }

  async delete(name: string) {
    const key = (
      await this._client.getPastesByUser({
        userKey: this._token,
      })
    ).find((paste) => paste.paste_title == name)?.paste_key;

    if (key) {
      return this._client.deletePasteByKey({
        userKey: this._token,
        pasteKey: key,
      });
    }
  }

  async create({ name, content }: { name: string; content: string }) {
    await this._client.createPaste({
      name,
      publicity: Publicity.Private,
      apiUserKey: this._token,
      code: content,
    });
  }
}
