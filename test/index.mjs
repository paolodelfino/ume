import { get_movie_details, search_movie } from "../dist/index.mjs";

const movies = await search_movie({ name: "rick" });
console.assert(movies.length > 0);
const rick = movies[0];
const details = await get_movie_details({ id: rick.id, slug: rick.slug });
console.log(details);
