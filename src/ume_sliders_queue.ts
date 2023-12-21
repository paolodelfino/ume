import { Ume } from ".";
import { Slider_Fetch, Title_Slider } from "./types";
import { post } from "./utils";

export class Ume_Sliders_Queue {
  private _ume;
  private _batches: (() => Promise<Title_Slider[]>)[] = [];
  data: Title_Slider[] = [];

  constructor({ ume, sliders }: { ume: Ume; sliders: Slider_Fetch[] }) {
    this._ume = ume;

    const batch_sz = 6;
    let batch_count = Math.ceil(sliders.length / batch_sz);
    for (let i = 0; i < batch_count; i++) {
      this._batches.push(
        async () =>
          JSON.parse(
            await post(`${this._ume.sc.url}/api/sliders/fetch`, {
              sliders: sliders.slice(batch_sz * i, batch_sz * ++i),
            })
          ) as Title_Slider[]
      );
    }
  }

  async next() {
    const fetch_next = this._batches.shift();
    if (fetch_next) {
      this.data.push(...(await fetch_next()));
    }

    return { has_next: this._batches.length >= 1 };
  }
}
