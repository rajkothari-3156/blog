import { compose } from 'redux'
import { connect } from 'react-redux'
import { hot } from 'react-hot-loader'

import WordCount from './WordCount'
import { getWordCount, wordCountBySelection } from 'store/wordCount'
import fireActions from 'hoc/fireActions'

export default compose(
  hot(module),
  connect(
    state => ({
      data: wordCountBySelection(state),
    }),
    {
      getWordCount,
    },
  ),
  fireActions(['getWordCount']),
)(WordCount)
