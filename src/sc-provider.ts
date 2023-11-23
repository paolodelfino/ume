export class SC_Provider {
  private _url!: string;
  private _image_endpoint!: string;

  constructor() {
    this.url = "https://streamingcommunity.care";
  }

  get url() {
    return this._url;
  }

  get image_endpoint() {
    return this._image_endpoint;
  }

  set url(updated_url) {
    this._url = updated_url;
    this._image_endpoint = `${updated_url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }

  image(filename: string) {
    return `${this.image_endpoint}/${filename}`;
  }
}
