export class SC {
  private _url!: string;
  image_endpoint!: string;
  trailer_endpoint;

  constructor() {
    this.url = "https://streamingcommunity.broker";
    this.trailer_endpoint = "https://www.youtube-nocookie.com/embed";
  }

  get url() {
    return this._url;
  }

  set url(updated_url) {
    this._url = updated_url;
    this.image_endpoint = `${updated_url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }
}
