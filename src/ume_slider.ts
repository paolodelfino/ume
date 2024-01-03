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
  private _max_offset;

  constructor({
    ume,
    fetch,
    label,
    max_offset,
  }: ConstructorParameters<typeof Ume_Sliders_Queue>["0"]["sliders"][number] & {
    ume: Ume;
  }) {
    this._ume = ume;
    this.label = label;
    this._fetch = fetch;
    this._max_offset = max_offset;
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

    this.titles.push(...titles);

    this._offset += 30;

    return {
      has_next:
        (this._max_offset && this._offset < this._max_offset) || !!titles,
    };
  }
}
