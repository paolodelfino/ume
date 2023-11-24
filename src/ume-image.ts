export class Ume_Image {
  endpoint!: string;

  constructor() {}

  url({ filename }: { filename: string }) {
    return `${this.endpoint}/${filename}`;
  }
}
