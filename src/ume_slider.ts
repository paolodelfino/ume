import { Ume } from ".";
import { Title_Slider } from "./types";
import { Ume_Sliders_Queue } from "./ume_sliders_queue";
import { post } from "./utils";

export class Ume_Slider {
  private _ume;

  readonly label;
  readonly titles: Title_Slider["titles"] = [];

  private readonly _fetch;
  private _offset = 0;

  constructor({
    ume,
    fetch,
    label,
  }: ConstructorParameters<typeof Ume_Sliders_Queue>["0"]["sliders"][number] & {
    ume: Ume;
  }) {
    this._ume = ume;
    this.label = label;
    this._fetch = fetch;
  }

  async next() {
    const titles = (
      JSON.parse(
        await post(`${this._ume.sc.url}/api/sliders/fetch`, {
          sliders: [
            {
              ...this._fetch,
              offset: this._offset,
            },
          ],
        })
      ) as Title_Slider[]
    )[0]?.titles;

    this._offset += 30;

    this.titles.push(...titles);

    return { has_next: !!titles };
  }
}
