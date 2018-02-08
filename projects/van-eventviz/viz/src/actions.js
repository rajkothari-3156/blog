import { get } from 'axios'

export const getEvents = () => async dispatch => {
  const events = await import('../data.json')

  dispatch({
    type: 'EVENTS',
    payload: events,
  })
}

export const toggleTag = tag => ({
  type: 'TOGGLE_TAG',
  payload: tag,
})

export const toggleAll = () => ({
  type: 'TOGGLE_ALL',
})

export const toggleNone = () => ({
  type: 'TOGGLE_NONE',
})

export const selectDates = range => ({
  type: 'SELECT_DATES',
  payload: range,
})