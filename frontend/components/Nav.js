import Link from 'next/link'
import NavStyles from './styles/NavStyles'
import User from './User'
import Signout from './Signout'

const Nav = () => (
  <User>
    {({ data: { me } }) => (
      <NavStyles>
        <Link href="/items">
          <a href="items">Shop</a>
        </Link>

        {me && (
          <>
            <Link href="/sell">
              <a href="sell">Sell</a>
            </Link>
            <Link href="/orders">
              <a href="orders">Orders</a>
            </Link>
            <Link href="/me">
              <a href="me">Account</a>
            </Link>
            <Signout />
          </>
        )}
        {!me && (
          <Link href="/signup">
            <a href="signup">Signup</a>
          </Link>
        )}
      </NavStyles>
    )}
  </User>
)

export default Nav
