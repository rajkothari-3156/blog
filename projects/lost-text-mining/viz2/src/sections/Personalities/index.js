import { compose } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { combinedProfileSelection } from '../../selectors'
import { getPersonalities } from '../../actions'
import { fireActions } from '../../hoc'

import Personalities from './Personalities'

export default compose(
  connect(
    state => ({
      data: combinedProfileSelection(state),
    }),
    {
      getPersonalities,
    },
  ),
  fireActions(['getPersonalities']),
)(Personalities)