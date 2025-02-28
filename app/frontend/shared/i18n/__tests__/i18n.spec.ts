// Copyright (C) 2012-2023 Zammad Foundation, https://zammad-foundation.org/

import { defineComponent, nextTick } from 'vue'
import { renderComponent } from '#tests/support/components/index.ts'
import { i18n } from '#shared/i18n.ts'

const Example = defineComponent({
  name: 'Example',
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  data: () => ({ i18n }),
  template: '<div>{{ i18n.t(text) }}</div>',
})

const populateTranslationMap = () => {
  const map = new Map([
    ['yes', 'ja'],
    ['Hello world!', 'Hallo Welt!'],
    ['The second component.', 'Die zweite Komponente.'],
    [
      'String with 3 placeholders: %s %s %s',
      'Zeichenkette mit 3 Platzhaltern: %s %s %s',
    ],
    ['FORMAT_DATE', 'dd/mm/yyyy'],
    ['FORMAT_DATETIME', 'dd/mm/yyyy HH:MM:SS'],
  ])

  i18n.setTranslationMap(map)
}

describe('i18n', () => {
  afterEach(() => {
    i18n.setTranslationMap(new Map())
  })

  it('starts with empty state', () => {
    expect(i18n.t('unknown string')).toBe('unknown string')
    expect(i18n.t('yes')).toBe('yes')
  })

  describe('i18n populated', () => {
    beforeEach(() => {
      populateTranslationMap()
    })

    it('translates known strings', () => {
      expect(i18n.t('yes')).toBe('ja')
    })

    it('handles placeholders correctly', () => {
      // No arguments.
      expect(i18n.t('String with 3 placeholders: %s %s %s')).toBe(
        'Zeichenkette mit 3 Platzhaltern: %s %s %s',
      )
    })

    it('translates dates', () => {
      expect(i18n.date('2021-04-09T10:11:12Z')).toBe('09/04/2021')
      expect(i18n.dateTime('2021-04-09T10:11:12Z')).toBe('09/04/2021 10:11:12')
      expect(i18n.relativeDateTime(new Date().toISOString())).toBe('just now')
    })

    it('updates (reactive) translations automatically', async () => {
      const { container } = renderComponent(Example, {
        props: {
          text: 'Hello world!',
        },
        global: {
          mocks: {
            i18n,
          },
        },
      })

      expect(container).toHaveTextContent('Hallo Welt!')
      i18n.setTranslationMap(new Map())
      await nextTick()
      expect(container).toHaveTextContent('Hello world!')
    })
  })
})
