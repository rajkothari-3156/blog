export const getEpisodes = () => async dispatch => {
  const episodes = await import('../data/episodes.json')

  dispatch({
    type: 'EPISODES',
    payload: episodes,
  })
}

export const selectEpisodes = selection => ({
  type: 'SELECT_EPISODES',
  payload: selection,
})

export const getWordCount = () => async dispatch => {
  const wordCount = await import('../data/wordCount.json')

  dispatch({
    type: 'WORD_COUNT',
    payload: wordCount,
  })
}

export const getFlashes = () => async dispatch => {
  const flashes = await import('../data/flashes.json')

  dispatch({
    type: 'FLASHES',
    payload: flashes,
  })
}

export const getLinesPerChar = () => async dispatch => {
  const linesPerChar = await import('../data/linesPerChar.json')

  dispatch({
    type: 'LINES_PER_CHAR',
    payload: linesPerChar,
  })
}

export const getCharWordFrequencies = () => async dispatch => {
  const charWordFreq = await import('../data/charWordFrequencies.json')

  dispatch({
    type: 'CHAR_WORD_FREQ',
    payload: charWordFreq,
  })
}

export const getPersonalities = () => async dispatch => {
  const personalities = await import('../data/personalities.json')

  dispatch({
    type: 'PERSONALITIES',
    payload: personalities,
  })
}

export const selectProfiles = (groupIndex, selection) => ({
  type: 'SELECT_PROFILES',
  payload: {
    groupIndex,
    selection,
  },
})

export const addProfileGroup = () => ({
  type: 'ADD_PROFILE_GROUP',
})

export const removeProfileGroup = groupIndex => ({
  type: 'REMOVE_PROFILE_GROUP',
  payload: {
    groupIndex,
  },
})

export const getCooccurrence = () => async dispatch => {
  const charCooccurrence = await import('../data/charCooccurrence.json')

  dispatch({
    type: 'CHAR_COOCCURRENCE',
    payload: charCooccurrence,
  })
}

export const showPersonalityTooltip = target => ({
  type: 'PERSONALITY_TOOLTIP_SHOW',
  payload: target,
})

export const hidePersonalityTooltip = () => ({
	type: 'PERSONALITY_TOOLTIP_HIDE'
})