import { shallow } from 'enzyme'
import toJSON from 'enzyme-to-json'
import ItemComponent from '../components/Item'

const fakeItem = {
  id: 'ABC123',
  title: 'Cool item',
  price: 5000,
  description: 'this is a cool item',
  image: 'item.jpg',
  largeImage: 'litem.jpeg',
}

describe('</Item>', () => {
  it('should render and match the snapshot', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />)
    expect(toJSON(wrapper)).toMatchSnapshot()
  })
  it('should render and display image and title properly', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />)
    const PriceTag = wrapper.find('PriceTag')
    expect(PriceTag.children().text()).toBe('$50')
    expect(wrapper.find('Title a').text()).toBe(fakeItem.title)
  })

  it('should render the image properly', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />)
    const img = wrapper.find('img')
    expect(img.props().src).toBe(fakeItem.image)
    expect(img.props().alt).toBe(fakeItem.title)
  })

  it('should render the buttons properly', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />)
    const buttonList = wrapper.find('.buttonList')
    expect(buttonList.children()).toHaveLength(3)
    expect(buttonList.find('Link').exists()).toBe(true)
    expect(buttonList.find('AddToCart').exists()).toBe(true)
    expect(buttonList.find('DeleteItem').exists()).toBe(true)
  })
})
