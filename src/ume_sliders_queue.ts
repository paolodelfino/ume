import { Ume } from ".";
import { Slider_Fetch } from "./types";
import { Ume_Slider } from "./ume_slider";

export class Ume_Sliders_Queue {
  private readonly _ume;

  private readonly _sz;
  private readonly _count;
  private _cur = 0;
  private readonly _sliders;

  data: Ume_Slider[] = [];

  constructor({
    ume,
    sliders,
    groups_size,
  }: {
    ume: Ume;
    sliders: {
      label: string;
      fetch: Slider_Fetch;
    }[];
    groups_size?: number;
  }) {
    this._ume = ume;

    this._sz = groups_size
      ? groups_size
      : sliders.length < 3
      ? sliders.length
      : 3;
    this._count = Math.ceil(sliders.length / this._sz);
    this._sliders = sliders;
  }

  next() {
    const next_cur = this._cur + 1;

    for (
      let i = this._sz * this._cur;
      i < this._sz * next_cur && i < this._sliders.length;
      ++i
    ) {
      this.data.push(
        new Ume_Slider({
          ...this._sliders[i],
          ume: this._ume,
        })
      );
    }

    return {
      has_next: ++this._cur < this._count,
    };
  }
}
