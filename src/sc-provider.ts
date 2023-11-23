import { IProvider } from "./types";

export class SC_Provider implements IProvider {
  private _url!: string;
  private _image_endpoint!: string;
  private _trailer_endpoint!: string;

  constructor() {
    this.url = "https://streamingcommunity.care";
    this._trailer_endpoint = "https://www.youtube-nocookie.com/embed";
  }

  get url() {
    return this._url;
  }

  set url(updated_url) {
    this._url = updated_url;
    this._image_endpoint = `${updated_url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }

  image(filename: string) {
    return `${this._image_endpoint}/${filename}`;
  }

  trailer(key: string) {
    return `${this._trailer_endpoint}/${key}`;
  }
}
