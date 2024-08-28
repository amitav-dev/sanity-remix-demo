import { faker } from '@faker-js/faker'
import { htmlToBlocks } from '@sanity/block-tools'
import { Schema } from '@sanity/schema'
import { JSDOM } from 'jsdom'
import type { FieldDefinition, SanityDocumentLike } from 'sanity'
import { getCliClient } from 'sanity/cli'

import schema from '~/sanity/schemaTypes'

const client = getCliClient()
const RECORD_COUNT = 6
const CAST_COUNT = 20

const defaultSchema = Schema.compile({ types: schema })
const blockContentSchema = defaultSchema
  .get('record')
  .fields.find((field: FieldDefinition) => field.name === 'content').type

// Create 2-5 paragraphs of fake block content
function createFakeBlockContent() {
  const html = Array.from({ length: faker.number.int({ min: 2, max: 5 }) })
    .map(() => `<p>${faker.lorem.paragraph({ min: 2, max: 5 })}</p>`)
    .join(``)
  return htmlToBlocks(html, blockContentSchema, {
    parseHtml: (html) => new JSDOM(html).window.document,
  })
}

async function createData() {
  console.log(`Create new data with...`)
  console.log(`Project ID: ${client.config().projectId}`)
  console.log(`Dataset: ${client.config().dataset}`)

  await client.delete({
    query: `*[_type in $types]`,
    params: { types: ['home', 'record', 'cast', 'genre', 'sanity.imageAsset'] },
  })

  const home = {
    _id: 'home',
    _type: 'home',
    title: 'Interactive live previews with Presentation',
    siteTitle: 'Sanity ❤️ Remix',
  }

  const casts: SanityDocumentLike[] = []

  for (let categoryI = 0; categoryI < CAST_COUNT; categoryI++) {
    const name = faker.person.fullName()

    casts.push({
      _type: 'cast',
      _id: faker.string.uuid(),
      name,
      slug: { current: faker.helpers.slugify(name).toLowerCase() },
    })
  }

  const genres: SanityDocumentLike[] = []
  const uniqueGenres: string[] = Array.from({ length: 50 })
    .map((_) => faker.music.genre())
    .reduce<string[]>(
      (acc, cur) => (acc.includes(cur) ? acc : [...acc, cur]),
      [],
    )

  for (let genreI = 0; genreI < uniqueGenres.length; genreI++) {
    const title = faker.music.genre()

    genres.push({
      _type: 'genre',
      _id: faker.string.uuid(),
      title,
      slug: { current: faker.helpers.slugify(title).toLowerCase() },
    })
  }

  const records: SanityDocumentLike[] = []

  for (let postI = 0; postI < RECORD_COUNT; postI++) {
    const title = faker.music.songName()

    const imageUrl = faker.image.urlPicsumPhotos({ width: 800, height: 600 })
    const imageBuffer = await fetch(imageUrl).then((res) => res.arrayBuffer())
    const imageAsset = await client.assets.upload(
      'image',
      Buffer.from(imageBuffer),
    )

    records.push({
      _type: 'record',
      _id: faker.string.uuid(),
      title,
      slug: { current: faker.helpers.slugify(title).toLowerCase() },
      releaseDate: faker.date.past(),
      likes: Math.floor(Math.random() * 100),
      dislikes: Math.floor(Math.random() * 100),
      content: createFakeBlockContent(),
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id,
        },
      },
      genres: faker.helpers
        .arrayElements(genres, { min: 2, max: 4 })
        .map((genre) => ({
          _key: faker.string.uuid(),
          _ref: genre._id,
          _type: 'reference',
        })),
      tracks: faker.helpers
        .arrayElements(
          Array.from(
            new Set(
              Array.from({ length: 20 }).map((_) => faker.music.songName()),
            ),
          ),
          { min: 8, max: 12 },
        )
        .map((track) => ({
          _key: faker.string.uuid(),
          title: track,
          duration: faker.number.int({ min: 120, max: 360 }),
        })),
      cast: {
        _type: 'reference',
        _ref: casts[Math.floor(Math.random() * CAST_COUNT)]._id,
      },
    })
  }

  const data = [home, ...casts, ...genres, ...records]

  const transaction = client.transaction()

  for (let dataI = 0; dataI < data.length; dataI++) {
    transaction.create(data[dataI])
  }

  transaction
    .commit()
    .then((res) => {
      console.log(`Complete!`, res)
    })
    .catch((err) => {
      console.error(err)
    })
}

createData()
