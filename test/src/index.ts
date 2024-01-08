import { assert } from "chai";
import fs from "fs";
import path from "path";
import { exit } from "process";
import { ustore } from "pustore";
import { Test_Set } from "putesting";
import { parseArgs } from "util";
import { Ume, Ume_Sliders_Queue } from "../../dist/index.mjs";
import "./utils";

type Tests =
  | "store"
  | "search"
  | "search suggestion"
  | "caching system"
  | "details"
  | "preview"
  | "misc"
  | "master playlist"
  | "sliders"
  | "parse master playlist"
  | "download video"
  | "download subtitle"
  | "mylist"
  | "continue_watching"
  | "person search"
  | "person details"
  | "following (movie)"
  | "following (tv)"
  | "following (person)";

async function main() {
  assert.isDefined(process.env.TMDB_API_KEY);
  assert.isDefined(process.env.PASTEBIN_API_KEY);
  assert.isDefined(process.env.PASTEBIN_NAME);
  assert.isDefined(process.env.PASTEBIN_PASSWORD);
  assert.isDefined(process.env.DISCORD_WEBHOOK_URL);

  const ume = new Ume();
  await ume.init({
    tmdb_api_key: process.env.TMDB_API_KEY!,
    pastebin_api_key: process.env.PASTEBIN_API_KEY!,
    pastebin_name: process.env.PASTEBIN_NAME!,
    pastebin_password: process.env.PASTEBIN_PASSWORD!,
    discord_webhook_url: process.env.DISCORD_WEBHOOK_URL!,
  });

  if (!(await ume.sc.check_url())) {
    console.log(ume.sc.url, "is outdated. Reporting...");
    await ume.sc.report_outdated_url();
    console.log("Reported!");
    exit(1);
  }

  let query: string;
  let movie: Awaited<ReturnType<typeof ume.title.search>>[number];
  let details: Awaited<ReturnType<typeof ume.title.details>>;
  let master_playlist: string;
  let download_objs: Awaited<
    ReturnType<typeof ume.title.parse_master_playlist>
  >;
  let video_playlist: Awaited<
    ReturnType<typeof ume.title.parse_master_playlist>
  >[number];
  let buffer: Buffer;
  let subtitle_playlist: Awaited<
    ReturnType<typeof ume.title.parse_master_playlist>
  >[number];
  let rick: Awaited<ReturnType<typeof ume.title.search>>[number];
  let enola: Awaited<ReturnType<typeof ume.title.search>>[number];

  const tests = new Test_Set<Tests>({
    store: {
      async callback() {
        assert.strictEqual(await ume.mylist.length(), 0);

        await ume.mylist.add({
          id: 1,
          slug: "test",
        });
        assert.strictEqual(await ume.mylist.length(), 1);

        const backup = await ume.store.export();

        const mylist = new ustore.Async();
        await mylist.init("mylist");
        await mylist.clear();

        assert.strictEqual(await ume.mylist.length(), 0);

        await ume.store.import(backup);

        assert.strictEqual(await ume.mylist.length(), 1);
        assert.strictEqual((await ume.mylist.some(1))[0].slug, "test");
      },
    },
    search: {
      async callback() {
        // These queries shouldn't give any error, everywhere
        const query_movie = "enola";
        const query_series = "rick";
        query = query_series;

        const search_history = new ustore.Async<any>();
        await search_history.init("search_history");
        await search_history.clear();

        assert.strictEqual(await search_history.length(), 0);

        const movies = await ume.title.search({ query });
        assert.isAbove(movies.length, 0);
        movie = movies[0];

        assert.strictEqual(await search_history.length(), 1);
        assert.strictEqual((await search_history.values())[0].data, query);

        await ume.title.search({ query: "he" });

        assert.strictEqual(await search_history.length(), 2);

        const history = await search_history.values();
        assert.isDefined(history.find((q) => q.data == query));
        assert.isDefined(history.find((q) => q.data == "he"));

        await ume.title
          .search({
            query:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          })
          .then(() => assert(0, "Should not succeed"))
          .catch((err) =>
            assert.strictEqual(
              err.message as string,
              "query exceeds 256 chars limit"
            )
          );
      },
      async after() {
        await tests.run("search (cached)", {
          async callback() {
            assert.isAbove((await ume.title.search({ query })).length, 0);
          },
        });
      },
    },
    "search suggestion": {
      async before() {
        await ume.title.search({ query: "rick" });
        await ume.title.search({ query: "enola" });
        await ume.title.search({ query: "e" });
      },
      async callback() {
        const suggestions = await ume.search_suggestion.get({
          query: "eo",
        });
        assert.include(suggestions, "enola");
      },
    },
    "caching system": {
      async callback() {
        const details_cache = new ustore.Async<any>();
        await details_cache.init("details");
        await details_cache.clear();
        assert.strictEqual(await details_cache.length(), 0);

        const samples = [
          { id: 739, slug: "escobar-il-fascino-del-male" },
          { id: 1441, slug: "escape-plan-fuga-dallinferno", times: 3 },
          { id: 1442, slug: "escape-plan-2-ritorno-allinferno", times: 0 },
          { id: 1649, slug: "esp-fenomeni-paranormali", times: 0 },
          { id: 1650, slug: "esp-fenomeni-paranormali", times: 2 },
          // { id: 1663, slug: "estate-di-morte", times: 3 },
          // { id: 2711, slug: "escape-room", times: 1 },
          // { id: 3192, slug: "estraneo-a-bordo", times: 2 },
          // { id: 3550, slug: "escape-room-2-gioco-mortale", times: 4 },
          // { id: 6241, slug: "aquaman-e-il-regno-perduto", times: 1 },
        ];

        await ume.title.details(samples[0]);
        assert.strictEqual(await details_cache.length(), 1);

        for (const sample of samples) {
          await ume.title.details(sample);
        }
        assert.strictEqual(await details_cache.length(), 5);

        assert.strictEqual(
          (await details_cache.get(samples[0].id.toString())).interacts,
          1
        );
        for (const sample of samples.slice(1)) {
          assert.strictEqual(
            (await details_cache.get(sample.id.toString())).interacts,
            0
          );
        }

        for (const sample of samples) {
          for (let i = 0; i < sample.times!; ++i) {
            await ume.title.details(sample);
          }
        }

        assert.isDefined(await details_cache.get(samples[2].id.toString()));
        assert.isUndefined(await details_cache.get("2158"));

        await ume.title.details({
          id: 2158,
          slug: "halloween-4-il-ritorno-di-michael-myers",
        });
        assert.strictEqual(await details_cache.length(), 5);

        assert.isUndefined(await details_cache.get(samples[2].id.toString()));
        assert.isDefined(await details_cache.get("2158"));

        await details_cache.clear();
        assert.strictEqual(await details_cache.length(), 0);
      },
    },
    details: {
      async callback() {
        details = await ume.title.details({ id: movie.id, slug: movie.slug });
      },
      deps: ["search"],
      async after() {
        await tests.run("details (cached)", {
          async callback() {
            assert.strictEqual(
              (await ume.title.details({ id: movie.id, slug: movie.slug }))
                .name,
              details.name
            );
          },
          deps: ["search", "details"],
        });

        if (details.type == "movie") {
          await tests.run("movie collection", {
            async callback() {
              assert.isNotNull(details.collection);
              console.log(details.collection!.length);
            },
            deps: ["details"],
          });
        } else {
          await tests.run("seasons", {
            async callback() {
              assert.isAtLeast(details.seasons.filter(Boolean).length, 6);

              const episodes = await ume.seasons.get(4, {
                slug: details.slug,
                id: details.id,
              });
              assert.isDefined(episodes);
              assert.isAbove(episodes!.length, 0);
            },
            deps: ["details"],
          });

          await tests.run("seasons (cache)", {
            async callback() {
              const episodes = await ume.seasons.get(4, {
                slug: details.slug,
                id: details.id,
              });
              assert.isDefined(episodes);
              assert.isAbove(episodes!.length, 0);
            },
            deps: ["details"],
          });

          await tests.run("episode seek bounds", {
            async callback() {
              const [prev, next] = await ume.seasons.seek_bounds_episode(
                {
                  season_number: 6,
                  episode_index: 4,
                },
                { id: details.id, seasons: details.seasons, slug: details.slug }
              );
              assert.isNotNull(prev);
              assert.isNotNull(next);
              assert.strictEqual(prev!.data.number, 4);
              assert.strictEqual(next!.data.number, 6);
            },
            deps: ["details"],
          });

          await tests.run("episode seek bounds (next not available)", {
            async callback() {
              const [prev, next] = await ume.seasons.seek_bounds_episode(
                {
                  season_number: 6,
                  episode_index: 9,
                },
                { id: details.id, seasons: details.seasons, slug: details.slug }
              );
              assert.isNotNull(prev);
              assert.isNull(next);
              assert.strictEqual(prev!.data.number, 9);
            },
            deps: ["details"],
          });

          await tests.run("episode seek bounds (prev not available)", {
            async callback() {
              const [prev, next] = await ume.seasons.seek_bounds_episode(
                {
                  season_number: 1,
                  episode_index: 0,
                },
                { id: details.id, seasons: details.seasons, slug: details.slug }
              );
              assert.isNull(prev);
              assert.isNotNull(next);
              assert.strictEqual(next!.data.number, 2);
            },
            deps: ["details"],
          });

          await tests.run("double episode seek bounds", {
            async callback() {
              const [prev, next] = await ume.seasons.seek_bounds_episode(
                {
                  season_number: 4,
                  episode_index: 3,
                },
                { id: details.id, seasons: details.seasons, slug: details.slug }
              );
              assert.isNotNull(prev);
              assert.isNotNull(next);
              assert.strictEqual(prev!.data.number, 3);
              assert.strictEqual(next!.data.number, 5);

              const [prev2, next2] = await ume.seasons.seek_bounds_episode(
                {
                  episode_index: next!.episode_index,
                  season_number: next!.season_number,
                },
                { id: details.id, seasons: details.seasons, slug: details.slug }
              );
              assert.isNotNull(prev2);
              assert.isNotNull(next2);
              assert.strictEqual(prev2!.data.number, 4);
              assert.strictEqual(next2!.data.number, 6);
            },
            deps: ["details"],
          });
        }
      },
    },
    preview: {
      async callback() {
        assert.strictEqual(
          (await ume.title.preview({ id: movie.id })).id,
          movie.id
        );
      },
      async after() {
        await tests.run("preview (cached)", {
          async callback() {
            assert.strictEqual(
              (await ume.title.preview({ id: movie.id })).id,
              movie.id
            );
          },
          deps: ["preview"],
        });
      },
      deps: ["search"],
    },
    misc: {
      async callback() {
        const image = ume.title.image_url({
          filename: details.images[0].filename,
        });
        console.log(image);
      },
      deps: ["details"],
    },
    "master playlist": {
      async callback() {
        master_playlist = await ume.title.master_playlist({
          title_id: details.id,
          episode_id:
            details.type == "tv"
              ? (await ume.seasons.get(2, {
                  id: details.id,
                  slug: details.slug,
                }))![5].id
              : undefined,
        });
        console.log(master_playlist);
      },
      deps: ["details"],
    },
    "parse master playlist": {
      async callback() {
        download_objs = await ume.title.parse_master_playlist(master_playlist);
        assert.isAbove(download_objs.length, 0);
      },
      deps: ["master playlist"],
      async after() {
        video_playlist = download_objs.find((obj) => obj.kind == "video")!;
        assert.isDefined(video_playlist);
      },
    },
    "download video": {
      async callback() {
        buffer = (await ume.title.download(video_playlist)) as Buffer;
        assert.isAbove(buffer.byteLength, 0);
      },
      deps: ["parse master playlist"],
      async after() {
        console.log("writing the downloaded content");
        const batch_sz = 2147483647;
        const batch_count = Math.ceil(buffer.buffer.byteLength / batch_sz);

        const output_mp4 = fs.openSync(
          path.resolve(__dirname, "../output.mp4"),
          "w"
        );
        for (let i = 0; i < batch_count; ) {
          fs.appendFileSync(
            output_mp4,
            new Uint8Array(buffer.buffer.slice(batch_sz * i, batch_sz * ++i))
          );
        }
        fs.closeSync(output_mp4);

        subtitle_playlist = download_objs.find(
          (obj) => obj.kind == "subtitle"
        )!;
        assert.isDefined(subtitle_playlist);
      },
    },
    "download subtitle": {
      async callback() {
        buffer = (await ume.title.download(subtitle_playlist!)) as Buffer;
        assert.isAbove(buffer.byteLength, 0);
      },
      deps: ["parse master playlist"],
      async after() {
        fs.writeFileSync(path.resolve(__dirname, "../output.vtt"), buffer);
      },
    },
    sliders: {
      async callback() {
        {
          const queue = new Ume_Sliders_Queue({
            ume,
            groups_size: 6,
            sliders: [
              {
                fetch: { genre: "Action & Adventure", name: "genre" },
                label: "Action & Adventure",
              },
              {
                fetch: { genre: "Animazione", name: "genre" },
                label: "Animazione",
              },
              {
                fetch: { genre: "Commedia", name: "genre" },
                label: "Commedia",
              },
              { fetch: { genre: "Crime", name: "genre" }, label: "Crime" },
              { fetch: { name: "latest" }, label: "Latest" },
              { fetch: { name: "top10" }, label: "Top 10" },
              { fetch: { name: "trending" }, label: "Trending" },
            ],
          });
          assert.strictEqual(queue.data.length, 0);
          assert.isTrue(queue.next().has_next);
          assert.strictEqual(queue.data.length, 6);
          assert.isFalse(queue.next().has_next);
          assert.strictEqual(queue.data.length, 7);
        }

        {
          const upcoming = ume.title.upcoming();
          assert.strictEqual(upcoming.titles.length, 0);
          await upcoming.next();
          console.log(`upcoming (${upcoming.titles.length})`);
        }
      },
    },
    "person search": {
      async callback() {
        const search_history = new ustore.Async<any>();
        await search_history.init("search_history");
        await search_history.clear();

        assert.strictEqual(await search_history.length(), 0);

        const people = await ume.person.search({ query: "millie" });
        assert.isNotEmpty(people);

        assert.strictEqual(await search_history.length(), 1);
        assert.strictEqual((await search_history.values())[0].data, "millie");
      },
      async after() {
        await tests.run("person search (cached)", {
          async callback() {
            const people = await ume.person.search({ query: "millie" });
            assert.isNotEmpty(people);
          },
        });
      },
    },
    "person details": {
      async callback() {
        const tennant = (await ume.person.details(20049))!;
        assert.isNotNull(tennant);
        Object.entries(tennant).forEach(([, value]) => assert.isDefined(value));
        assert.strictEqual(tennant.name, "David Tennant");
        assert.isNotEmpty(tennant.known_for_movies);
      },
      async after() {
        await tests.run("person details (cached)", {
          async callback() {
            const tennant = (await ume.person.details(20049))!;
            assert.isNotNull(tennant);
            Object.entries(tennant).forEach(([, value]) =>
              assert.isDefined(value)
            );
            assert.strictEqual(tennant.name, "David Tennant");
            assert.isNotEmpty(tennant.known_for_movies);
          },
        });
      },
    },
    continue_watching: {
      async before() {
        rick = (await ume.title.search({ query: "rick and morty" }))[0];
        enola = (await ume.title.search({ query: "enola" }))[0];
      },
      async callback() {
        const search_history = new ustore.Async<any>();
        await search_history.init("search_history");
        await search_history.clear();
        assert.strictEqual(await search_history.length(), 0);

        assert.strictEqual(await ume.continue_watching.length(), 0);

        assert.isNull(
          await ume.continue_watching.time({
            id: rick.id,
            season_number: 4,
            episode_number: 2,
          })
        );

        await ume.continue_watching.update({
          id: rick.id,
          slug: rick.slug,
          season_number: 4,
          episode_number: 2,
          time: 10,
        });
        assert.strictEqual(await ume.continue_watching.length(), 1);

        let time = await ume.continue_watching.time({
          id: rick.id,
          season_number: 4,
          episode_number: 2,
        });
        assert.strictEqual(time, 10);

        assert.isNull(
          await ume.continue_watching.time({
            id: rick.id,
            season_number: 3,
            episode_number: 2,
          })
        );

        await ume.continue_watching.update({
          id: rick.id,
          slug: rick.slug,
          season_number: 3,
          episode_number: 2,
          time: 145,
        });
        assert.strictEqual(await ume.continue_watching.length(), 1);

        time = await ume.continue_watching.time({
          id: rick.id,
          season_number: 3,
          episode_number: 2,
        });
        assert.strictEqual(time, 145);

        await ume.continue_watching.update({
          id: enola.id,
          slug: enola.slug,
          time: 15,
        });
        assert.strictEqual(await ume.continue_watching.length(), 2);

        await ume.continue_watching.rm(enola.id);
        assert.strictEqual(await ume.continue_watching.length(), 1);

        const titles = await ume.title.search({
          query: "enola",
          max_results: 30,
        });
        for (const title of titles) {
          await ume.continue_watching.update({
            id: title.id,
            slug: title.slug,
            time: 5,
          });
        }
        assert.strictEqual(titles.length, 30);
        assert.strictEqual(await ume.continue_watching.length(), 31);

        assert.strictEqual((await ume.continue_watching.some(10)).length, 10);

        assert.strictEqual(await ume.continue_watching.pages(), 4);

        const page0 = await ume.continue_watching.next(0);
        assert.strictEqual(page0.length, 10);

        const page1 = await ume.continue_watching.next(1);
        assert.strictEqual(page1.length, 10);

        const page2 = await ume.continue_watching.next(2);
        assert.strictEqual(page2.length, 10);

        const page3 = await ume.continue_watching.next(3);
        assert.strictEqual(page3.length, 1);

        assert.notEqual(page0[0].id, page1[0].id);
        assert.notEqual(page0[0].id, page2[0].id);
        assert.notEqual(page0[0].id, page3[0].id);
        assert.notEqual(page1[0].id, page2[0].id);
        assert.notEqual(page1[0].id, page3[0].id);
        assert.notEqual(page2[0].id, page3[0].id);

        const result = await ume.continue_watching.search({
          query: "en lomes",
        });
        assert.isAtLeast(result.length, 2);
        assert.isDefined(result.find((e) => e.slug == "enola-holmes"));
        assert.isDefined(result.find((e) => e.slug == "enola-holmes-2"));
        assert.strictEqual(await search_history.length(), 2);
        assert.isDefined(
          (await search_history.values()).find(
            (query) => query.data == "en lomes"
          )
        );
      },
    },
    mylist: {
      async before() {
        rick = (await ume.title.search({ query: "rick and morty" }))[0];
        enola = (await ume.title.search({ query: "enola" }))[0];
      },
      async callback() {
        const search_history = new ustore.Async<any>();
        await search_history.init("search_history");
        await search_history.clear();
        assert.strictEqual(await search_history.length(), 0);

        const mylist = new ustore.Async();
        await mylist.init("mylist");
        await mylist.clear();
        assert.strictEqual(await ume.mylist.length(), 0);

        await ume.mylist.add({
          id: rick.id,
          slug: rick.slug,
        });
        assert.strictEqual(await ume.mylist.length(), 1);

        await ume.mylist.add({
          id: enola.id,
          slug: enola.slug,
        });
        assert.strictEqual(await ume.mylist.length(), 2);

        await ume.mylist.rm(rick.id);
        assert.strictEqual(await ume.mylist.length(), 1);

        await ume.mylist.rm(enola.id);
        assert.strictEqual(await ume.mylist.length(), 0);

        const titles = await ume.title.search({
          max_results: 30,
          query: "enola",
        });
        for (const title of titles) {
          await ume.mylist.add({
            id: title.id,
            slug: title.slug,
          });
        }
        assert.strictEqual(titles.length, 30);

        await ume.mylist.add(rick);
        assert.strictEqual(await ume.mylist.length(), 31);

        assert.strictEqual((await ume.mylist.some(10)).length, 10);

        assert.strictEqual(await ume.mylist.pages(), 4);

        const page0 = await ume.mylist.next(0);
        assert.strictEqual(page0.length, 10);

        const page1 = await ume.mylist.next(1);
        assert.strictEqual(page1.length, 10);

        const page2 = await ume.mylist.next(2);
        assert.strictEqual(page2.length, 10);

        const page3 = await ume.mylist.next(3);
        assert.strictEqual(page3.length, 1);

        assert.notEqual(page0[0].id, page1[0].id);
        assert.notEqual(page0[0].id, page2[0].id);
        assert.notEqual(page0[0].id, page3[0].id);
        assert.notEqual(page1[0].id, page2[0].id);
        assert.notEqual(page1[0].id, page3[0].id);
        assert.notEqual(page2[0].id, page3[0].id);

        const result = await ume.mylist.search({ query: "en lomes" });
        assert.isAtLeast(result.length, 2);
        assert.isDefined(result.find((e) => e.slug == "enola-holmes"));
        assert.isDefined(result.find((e) => e.slug == "enola-holmes-2"));
        assert.strictEqual(await search_history.length(), 2);
        assert.isDefined(
          (await search_history.values()).find(
            (query) => query.data == "en lomes"
          )
        );
      },
    },
    "following (movie)": {
      async before() {
        await ume.following.add_movie({
          ...(await ume.title.details({
            id: 5777,
            slug: "enola-holmes-2",
          })),
          collection: {
            "Enola Holmes": { poster_path: "" },
          },
          collection_count: 1,
        });

        await ume.following.add_movie({
          ...(await ume.title.details({
            id: 270,
            slug: "harry-potter-e-la-pietra-filosofale",
          })),
          collection: {
            "faf afefe": { poster_path: "" },
          },
          collection_count: 1,
        });
      },
      async callback() {
        assert.isUndefined(await ume.following.last_checked_movies());

        let updates = await ume.following.something_new_movies();
        assert.isAbove((await ume.following.last_checked_movies())!, 0);
        assert.strictEqual(updates.length, 2);

        const enola_new_len = updates.find((e) => e.id == 5777)!.new_titles
          .length;
        const harry_new_len = updates.find((e) => e.id == 270)!.new_titles
          .length;

        await ume.following.add_movie({
          ...(await ume.title.details({
            id: 5777,
            slug: "enola-holmes-2",
          })),
          collection: {},
          collection_count: 0,
        });
        await ume.following.add_movie({
          ...(await ume.title.details({
            id: 270,
            slug: "harry-potter-e-la-pietra-filosofale",
          })),
          collection: {},
          collection_count: 0,
        });

        updates = await ume.following.something_new_movies();

        assert.strictEqual(
          updates.find((e) => e.id == 5777)!.new_titles.length - enola_new_len,
          1
        );
        assert.strictEqual(
          updates.find((e) => e.id == 270)!.new_titles.length,
          harry_new_len
        );
      },
      async after() {
        await tests.run("following selected (movie)", {
          async before() {
            assert.strictEqual(
              (await ume.following.something_new_movies([5777])).length,
              0
            );

            await ume.following.add_movie({
              ...(await ume.title.details({
                id: 270,
                slug: "harry-potter-e-la-pietra-filosofale",
              })),
              collection: {
                "Harry Potter e il prigioniero di Azkaban": { poster_path: "" },
              },
              collection_count: 1,
            });
          },
          async callback() {
            let updates = await ume.following.something_new_movies([270]);
            assert.strictEqual(updates.length, 1);

            const harry_new_len = updates.find((e) => e.id == 270)!.new_titles
              .length;

            await ume.following.add_movie({
              ...(await ume.title.details({
                id: 270,
                slug: "harry-potter-e-la-pietra-filosofale",
              })),
              collection: {},
              collection_count: 0,
            });

            updates = await ume.following.something_new_movies();

            assert.strictEqual(
              updates.find((e) => e.id == 270)!.new_titles.length -
                harry_new_len,
              1
            );
          },
        });
      },
    },
    "following (tv)": {
      async before() {
        await ume.following.add_tv({
          ...(await ume.title.details({
            id: 115,
            slug: "rick-and-morty",
          })),
          seasons: [{ number: 1, episodes_count: 4 }],
        });

        await ume.following.add_tv({
          ...(await ume.title.details({
            id: 2098,
            slug: "doctor-who",
          })),
          seasons: [{ number: 3, episodes_count: 0 }],
        });
      },
      async callback() {
        assert.isUndefined(await ume.following.last_checked_tvs());

        const updates = await ume.following.something_new_tvs();
        assert.isAbove((await ume.following.last_checked_tvs())!, 0);
        assert.strictEqual(updates.length, 2);

        assert.strictEqual(
          updates.find((e) => e.id == 115)!.new_episodes.length,
          6
        );
        assert.isFalse(
          updates.find((e) => e.id == 115)!.new_episodes.find((i) => i.i == 0)
            ?.is_new_season
        );
        assert.strictEqual(
          updates.find((e) => e.id == 115)!.new_episodes.find((i) => i.i == 0)
            ?.new_episodes_count,
          7
        );
        [1, 2, 3, 4, 5].map((i) =>
          assert.isTrue(
            updates
              .find((e) => e.id == 115)!
              .new_episodes.find((_i) => _i.i == i)?.is_new_season
          )
        );

        assert.strictEqual(
          updates.find((e) => e.id == 2098)!.new_episodes.length,
          13
        );
        assert.isTrue(
          updates.find((e) => e.id == 2098)!.new_episodes.find((i) => i.i == 2)
            ?.is_new_season
        );
        assert.strictEqual(
          updates.find((e) => e.id == 2098)!.new_episodes.find((i) => i.i == 2)
            ?.new_episodes_count,
          14
        );
        [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) =>
          assert.isTrue(
            updates
              .find((e) => e.id == 2098)!
              .new_episodes.find((_i) => _i.i == i)?.is_new_season
          )
        );
      },
      async after() {
        await tests.run("following selected (tv)", {
          async before() {
            assert.strictEqual(
              (await ume.following.something_new_tvs([2098])).length,
              0
            );

            await ume.following.add_tv({
              ...(await ume.title.details({
                id: 2098,
                slug: "doctor-who",
              })),
              seasons: [{ number: 3, episodes_count: 0 }],
            });
          },
          async callback() {
            const updates = await ume.following.something_new_tvs([2098]);
            assert.strictEqual(updates.length, 1);

            assert.strictEqual(
              updates.find((e) => e.id == 2098)!.new_episodes.length,
              13
            );
            assert.isTrue(
              updates
                .find((e) => e.id == 2098)!
                .new_episodes.find((i) => i.i == 2)?.is_new_season
            );
            assert.strictEqual(
              updates
                .find((e) => e.id == 2098)!
                .new_episodes.find((i) => i.i == 2)?.new_episodes_count,
              14
            );
            [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) =>
              assert.isTrue(
                updates
                  .find((e) => e.id == 2098)!
                  .new_episodes.find((_i) => _i.i == i)?.is_new_season
              )
            );
          },
        });
      },
    },
    "following (person)": {
      async before() {
        await ume.following.add_person({
          ...(await ume.person.details(1356210))!,
          known_for_movies: {
            "Stranger Things": { poster_path: "" },
          },
          known_for_movies_count: 1,
        });

        await ume.following.add_person({
          ...(await ume.person.details(20049))!,
          known_for_movies: {
            "WDFffwFAEAEE GAEGEEAGAfeafef": { poster_path: "" },
          },
          known_for_movies_count: 1,
        });
      },
      async callback() {
        assert.isUndefined(await ume.following.last_checked_people());

        let updates = await ume.following.something_new_people();
        assert.isAbove((await ume.following.last_checked_people())!, 0);
        assert.strictEqual(updates.length, 2);

        const millie_new_len = updates.find((e) => e.id == 1356210)!.new_titles
          .length;
        const tennant_new_len = updates.find((e) => e.id == 20049)!.new_titles
          .length;

        await ume.following.add_person({
          ...(await ume.person.details(1356210))!,
          known_for_movies: {},
          known_for_movies_count: 0,
        });
        await ume.following.add_person({
          ...(await ume.person.details(20049))!,
          known_for_movies: {},
          known_for_movies_count: 0,
        });

        updates = await ume.following.something_new_people();

        assert.strictEqual(
          updates.find((e) => e.id == 1356210)!.new_titles.length -
            millie_new_len,
          1
        );
        assert.strictEqual(
          updates.find((e) => e.id == 20049)!.new_titles.length,
          tennant_new_len
        );
      },
      async after() {
        await tests.run("following selected (person)", {
          async before() {
            assert.strictEqual(
              (await ume.following.something_new_people([20049])).length,
              0
            );

            await ume.following.add_person({
              ...(await ume.person.details(20049))!,
              known_for_movies: {
                "Doctor Who": { poster_path: "" },
              },
              known_for_movies_count: 1,
            });
          },
          async callback() {
            let updates = await ume.following.something_new_people([20049]);
            assert.strictEqual(updates.length, 1);

            const tennant_new_len = updates.find((e) => e.id == 20049)!
              .new_titles.length;

            await ume.following.add_person({
              ...(await ume.person.details(20049))!,
              known_for_movies: {},
              known_for_movies_count: 0,
            });

            updates = await ume.following.something_new_people();

            assert.strictEqual(
              updates.find((e) => e.id == 20049)!.new_titles.length -
                tennant_new_len,
              1
            );
          },
        });
      },
    },
  });

  const argc = process.argv.length - 2;
  const argv = process.argv.slice(2);

  if (argc == 0) {
    await tests.run();
  } else {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        list: {
          type: "boolean",
        },
      },
    });

    if (values.list) {
      console.log(tests.keys);
      return;
    }

    for (const arg of positionals) {
      if (!tests.has(arg)) {
        throw new Error(`"${arg}" is not a valid test`);
      }
      await tests.run(arg);
    }
  }
}

main().then(() => exit(0));
