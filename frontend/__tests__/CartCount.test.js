import { shallow } from 'enzyme'
import toJSON from 'enzyme-to-json'
import CartCount from '../components/CartCount'

describe('<CartCount/>', () => {
  it('should render', () => {
    shallow(<CartCount count={10} />)
  })

  it('should match the snapshot', () => {
    const wrapper = shallow(<CartCount count={10} />)
    expect(toJSON(wrapper)).toMatchSnapshot()
  })

  it('should update its props properly', () => {
    const wrapper = shallow(<CartCount count={50} />)
    expect(toJSON(wrapper)).toMatchSnapshot()
    wrapper.setProps({ count: 10 })
    expect(toJSON(wrapper)).toMatchSnapshot()
  })
})
