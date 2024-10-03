import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom';

const ProductItem = ({ id, image, name, price, brand }) => {
    
    const { currency } = useContext(ShopContext);

  return (
      <Link to={`/product/${id}`} className='text-primary hover:border border-border hover:scale-105 transition ease-in-out p-2'>
          <div className='overflow-hidden'>
              <img src={image} alt={name} className='' />
          </div>

          <p className='pt-3 pb-1 pl-2 text-sm text-secondary'>{brand}</p>
          <p className='pt-3 pb-1 pl-2 text-sm'>{name}</p>
          <p className='text-sm font-medium p-2'>{currency} {price}</p>
      </Link>
  )
}

export default ProductItem
