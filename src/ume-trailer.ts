export class Ume_Trailer {
  endpoint: string;

  constructor() {
    this.endpoint = "https://www.youtube-nocookie.com/embed";
  }

  url({ key }: { key: string }) {
    return `${this.endpoint}/${key}`;
  }

  iframe({ url, className }: { url: string; className: string }) {
    return `
<iframe
  className="${className}"
  src="${url}"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
></iframe>`;
  }
}
