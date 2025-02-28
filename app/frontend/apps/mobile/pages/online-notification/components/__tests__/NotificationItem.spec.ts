// Copyright (C) 2012-2023 Zammad Foundation, https://zammad-foundation.org/

import { renderComponent } from '#tests/support/components/index.ts'
import type { Scalars, Ticket } from '#shared/graphql/types.ts'
import { OnlineNotificationDeleteDocument } from '#shared/entities/online-notification/graphql/mutations/delete.api.ts'
import { mockGraphQLApi } from '#tests/support/mock-graphql-api.ts'
import { convertToGraphQLId } from '#shared/graphql/utils.ts'
import { generateObjectData } from '#tests/graphql/index.ts'
import NotificationItem from '../NotificationItem.vue'
import type { Props } from '../NotificationItem.vue'

const userId = convertToGraphQLId('User', 100)

const renderNotificationItem = (props: Partial<Props> = {}) => {
  mockGraphQLApi(OnlineNotificationDeleteDocument).willResolve({
    onlineNotificationDelete: {
      errors: null,
      success: true,
    },
  })

  const finishedProps: Props = {
    itemId: '111',
    objectName: 'Ticket',
    typeName: 'update',
    seen: false,
    createdBy: {
      id: userId,
      fullname: 'John Doe',
      firstname: 'John',
      lastname: 'Doe',
      active: true,
    },
    createdAt: new Date('2019-12-30 00:00:00').toISOString(),
    metaObject: generateObjectData<Ticket>('Ticket', {
      title: 'Ticket Title',
      id: convertToGraphQLId('Ticket', 1),
      internalId: 1,
    }),
    ...props,
  }

  return renderComponent(NotificationItem, {
    props: finishedProps,
    router: true,
  })
}

describe('NotificationItem.vue', () => {
  it('check activity message output', () => {
    const view = renderNotificationItem()

    expect(view.container).toHaveTextContent(
      'John Doe updated ticket Ticket Title',
    )
  })

  it('unseen identifier visible', () => {
    const view = renderNotificationItem()

    expect(view.getByLabelText('Unread notification')).toBeInTheDocument()
  })

  it('seen identifier visible', () => {
    const view = renderNotificationItem({
      seen: true,
    })

    expect(view.getByLabelText('Notification read')).toBeInTheDocument()
  })

  it('can delete online notification', async () => {
    const view = renderNotificationItem()

    const deleteIcon = view.getByIconName('mobile-delete')
    expect(deleteIcon).toBeInTheDocument()

    await view.events.click(deleteIcon)

    expect(view.emitted().remove).toBeTruthy()

    const emittedRemove = view.emitted().remove as Array<
      Array<Scalars['ID']['output']>
    >
    expect(emittedRemove[0][0]).toBe('111')
  })

  it('should emit "seen" event on click for none linked notifications', async () => {
    const view = renderNotificationItem({
      metaObject: undefined,
      createdBy: undefined,
    })

    const item = view.getByText('You can no longer see the ticket.')

    await view.events.click(item)

    expect(view.emitted().seen).toBeTruthy()

    const emittedSeen = view.emitted().seen as Array<
      Array<Scalars['ID']['output']>
    >
    expect(emittedSeen[0][0]).toBe('111')
  })
})
