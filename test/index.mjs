import "dotenv/config";
import { UME } from "../dist/index.mjs";
const ume = new UME({ tmdb_api_key: process.env.TMDB_API_KEY });

const time = async (label, func) => {
  console.log(label + " -------------");
  console.time(label);
  await func();
  console.timeEnd(label);
  console.log("-------------");
};

/**
 * @type import("../dist/index.mjs").TitleSearch
 */
let movie;
await time("search", async () => {
  const movies = await ume.title.search({ name: "fallimento" });
  console.assert(movies.length > 0);
  movie = movies[0];
});

/**
 * @type import("../dist/index.mjs").TitleDetails
 */
let details;
await time("details", async () => {
  details = await ume.title.details({ id: movie.id, slug: movie.slug });
});

await time("misc", async () => {
  const image = ume.title.image.url({
    provider: details.provider,
    filename: details.images[0].filename,
  });
  const trailer = ume.title.trailer.url({
    provider: details.provider,
    key: details.trailers[0].youtube_id,
  });
  const iframe = ume.title.trailer.iframe({
    url: trailer,
    className: "w-full h-full",
  });
  console.log(image);
  console.log(trailer);
  console.log(iframe);
});

await time("playlist", async () => {
  const playlist = await ume.title.playlist({
    title_id: details.id,
    //   episode_id: (await details.seasons[4].episodes)[5].id,
  });
  console.log(playlist);
});
