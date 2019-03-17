import OrderList from '../components/OrderList'
import PleaseSignIn from '../components/PleaseSignIn'

const Orders = props => (
  <div>
    <PleaseSignIn>
      <OrderList>Your orders</OrderList>
    </PleaseSignIn>
  </div>
)

export default Orders
