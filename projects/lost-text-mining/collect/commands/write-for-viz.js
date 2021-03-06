import * as R from 'ramda'
import Promise from 'bluebird'

import { getPool, queries } from '../db'
import { logger, writeFile, prettyJson } from '../util'

const log = logger('tone')
const pad2 = str => (str.toString().length < 2 ? `0${str}` : str)
const episodeKey = (season, episode) => `S${pad2(season)}-E${pad2(episode)}`

export default async function writeForViz() {
  const pool = getPool()

  const dataFiles = [
    {
      filename: 'episodes',
      query: 'select * from episodes',
      process: R.addIndex(R.map)(({ season, episode, length }, index) => ({
        season,
        episode,
        key: episodeKey(season, episode),
        index,
        length,
      })),
    },
    {
      filename: 'wordCount',
      query: queries.wordCount(),
      process: R.map(row => ({
        ...row,
        density: (row.uniq / row.total) * 100,
      })),
    },
    {
      filename: 'linesPerChar',
      query: queries.linesPerChar(),
      process: R.map(row => ({
        ...row,
        lines: +row.lines,
        key: episodeKey(row.season, row.episode),
      })),
    },
    {
      filename: 'charWordFrequencies',
      query: queries.charWordFrequencies(),
      process: R.identity,
    },
    {
      filename: 'personalities',
      query: queries.personalities(),
      process: R.identity,
    },
    {
      filename: 'charCooccurrence',
      query: queries.charCooccurrence(),
      process: R.map(row => ({
        s: row.season,
        e: row.episode,
        f: row.from_char,
        t: row.to_char,
        v: +row.val,
      })),
    },
    {
      filename: 'flashes',
      query: `
        select
          season,
          episode,
          array_to_json(array_agg(meta->'flashback' order by seq asc)) as flashback,
          array_to_json(array_agg(meta->'flashsideways' order by seq asc)) as flashsideways,
    			array_to_json(array_agg(meta->'flashforward' order by seq asc)) as flashforward,
          array_agg(length(line)) as chars
        from dialog
        where type='dialog'
        group by season, episode
        order by season, episode
      ;`,
      process: R.map(d => ({
        season: d.season,
        episode: d.episode,
        flashes: R.transpose([
          d.flashback,
          d.flashsideways,
          d.flashforward,
          d.chars,
        ]).reduce((acc, [flashback, flashsideways, flashforward, chars]) => {
          if (!acc.length) {
            return [
              {
                flashback,
                flashsideways,
                flashforward,
                chars,
              },
            ]
          }

          if (R.last(acc).flashback != flashback) {
            acc.push({
              flashback,
              flashsideways,
              flashforward,
              chars,
            })
            return acc
          }

          if (R.last(acc).flashsideways != flashsideways) {
            acc.push({
              flashback,
              flashsideways,
              flashforward,
              chars,
            })
            return acc
          }

          if (R.last(acc).flashforward != flashforward) {
            acc.push({
              flashback,
              flashsideways,
              flashforward,
              chars,
            })
            return acc
          }

          acc[acc.length - 1] = {
            ...R.last(acc),
            chars: R.last(acc).chars + chars,
          }
          return acc
        }, []),
      })),
    },
    {
      filename: 'sceneTone',
      query: queries.sceneTone(),
      process: R.pipe(
        R.groupBy(ep => `${ep.season}-${ep.episode}`),
        Object.values,
        R.map(scenes => {
          let start = 0
          return {
            s: scenes[0].season,
            e: scenes[0].episode,
            c: scenes.map(scene => {
              const ret = {
                s: start,
                l: scene.length,
                t: scene.document_tone
                  ? scene.document_tone.tones.map(tone => ({
                      s: tone.score,
                      i: tone.tone_id,
                    }))
                  : [],
              }
              start += scene.length
              return ret
            }),
          }
        }),
      ),
    },
    {
      filename: 'countsPerEpisode',
      query: `
        select distinct season, episode,
          count(*) filter (where type='stageDirection') as num_stagedirections,
          count(*) filter (where type='scene')+1 as num_scenes,
          count(distinct char_name) filter (where type='dialog') as num_chars
        from dialog
        group by season, episode
        order by season, episode asc
        ;
			`,
      process: R.map(
        R.evolve({
          num_stagedirections: parseInt,
          num_scenes: parseInt,
          num_chars: parseInt,
        }),
      ),
    },
    {
      filename: 'episodeReadingLevel',
      query: 'select * from episode_readinglevel',
      process: R.identity,
    },
    {
      filename: 'charReadingLevel',
      query: 'select * from char_readinglevel',
      process: R.identity,
    },
    {
      filename: 'charAppearance',
      query: `
        select char_name, season, episode, count(*) from (
          select char_name, season, episode
          from dialog
          where type='dialog' and
          char_name in (
            select char_name from total_lines_by_char limit 8
          )
          group by season, episode, scene, char_name
          order by season, episode
        ) t
        group by char_name, season, episode
        order by season, episode
      `,
      process: R.pipe(
        R.groupBy(r => r.char_name),
        R.map(
          R.map(rr => ({
            ...rr,
            count: +rr.count,
          })),
        ),
      ),
    },
    {
      filename: 'charMentions',
      query: [
        'JACK',
        'SAWYER',
        'LOCKE',
        'KATE',
        'HURLEY',
        'SAYID',
        'CHARLIE',
        'BEN',
      ].map(
        name => `
          select '${name}' as char_name, season, episode, count(*) from dialog
          where line ~* '\\y${name.toLowerCase()}\\y' and type='dialog' and char_name != '${name}'
          group by season,episode;
        `,
      ),
      process: R.pipe(
        R.groupBy(r => r.char_name),
        R.map(
          R.map(rr => ({
            ...rr,
            count: +rr.count,
          })),
        ),
      ),
    },
    {
      filename: 'wordConnections',
      query: [
        'the monster',
        'the others',
        'dharma',
        'oceanic',
        //
        'island',
        //
        'hell',
        'heaven',
        //
        'north',
        'south',
        'east',
        'west',
        //
        'love',
        'hate',
        //
        'kill',
        'die',
        //
        'friend',
        'enemy',
        //
        'father',
        'mother',
        //
      ].map(
        name => `
          select season, episode, count(*) as count, '${name}' as word
          from dialog
          where line ilike '%${name}%' and type='dialog'
          group by season, episode
          order by season, episode;
        `,
      ),
      process: R.pipe(
        R.groupBy(r => r.word),
        R.map(
          R.map(rr => ({
            ...rr,
            count: +rr.count,
          })),
        ),
      ),
    },
  ]

  await Promise.map(
    [dataFiles.find(f => f.filename === 'sceneTone')],
    async dataFile => {
      log('doing', dataFile.filename)
      const rows = await Promise.reduce(
        Array.isArray(dataFile.query) ? dataFile.query : [dataFile.query],
        async (acc, query) => {
          const { rows } = await pool.query(query)
          return acc.concat(rows)
        },
        [],
      )
      const data = dataFile.process ? dataFile.process(rows) : rows
      return writeFile(
        `../viz2/src/data/${dataFile.filename}.json`,
        prettyJson(data),
      )
    },
  )

  log('done')

  return pool.end()
}
