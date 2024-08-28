import {Users} from 'lucide-react'
import {defineField, defineType} from 'sanity'

export const castType = defineType({
  name: 'cast',
  title: 'Cast',
  type: 'document',
  icon: Users,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})
