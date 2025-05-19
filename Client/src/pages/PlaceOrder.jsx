import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Breadcrumbs from '../components/BreadCrumbs';

const PlaceOrder = () => {

  const [selectedMethod, setSelectedMethod] = useState('COD');

  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    street: '',
    additionalInfo: ''
  })

  const onChangeHandler = (e) => {
    const name = e.target.name
    const value = e.target.value

    setFormData(data => ({ ...data, [name]: value }))

  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.info('Please log in to complete the order')
    }

    try {
      const total_amount = getCartAmount() + delivery_fee;
      const address = formData;

      // Check payment method
      switch (selectedMethod) {
        case "COD":
          try {
            const orderData = {
              total_amount: parseFloat(total_amount),
              address: address,
              payment_method: "COD"
            };

            const response = await axios.post(
              backendUrl + "/orders",
              orderData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (response.status === 201) {
              toast.success(response.data.Message);
              navigate("/orders");
              setCartItems({});
            }
          } catch (error) {
            toast.error(error.response?.data?.Error || "Failed to place order");
            console.error("Order error:", error);
          }
          break;

        // Placeholder for other payment methods
        case "Credit Card":
        case "PayPal":
        case "Mpesa":
          console.log("Other payment methods will be implemented later.");
          break;

        default:
          toast.warning("Invalid payment method selected.");
      }
    } catch (error) {
      if (error.status === 422) {
        toast.error("Please log in to continue placing the order")
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    }
  };


  return (
    <>
      <Breadcrumbs />
      <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-3 sm:pt-10 min-h-[70vh]'>

        {/* -----LEFT sIDE----- */}
        <div className='flex flex-col gap-4 w-full sm:max-w-[750px]'>

          <div className='text-xl sm:text-2xl my-3'>
            <Title text1={'DELIVERY'} text2={'INFORMATION'} />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="First name"
              name='firstName'
              value={formData.firstName}
              onChange={onChangeHandler}
              required
              className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            />
            <input
              type="text"
              placeholder="Last name"
              name='lastName'
              value={formData.lastName}
              onChange={onChangeHandler}
              required
              className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            />
          </div>

          <input
            type="email"
            placeholder="Email address"
            name='email'
            value={formData.email}
            onChange={onChangeHandler}
            required
            className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          />

          <input
            type="number"
            placeholder="Phone no."
            name='phone'
            value={formData.phone}
            onChange={onChangeHandler}
            required
            className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          />

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="City / Town"
              name='city'
              value={formData.city}
              onChange={onChangeHandler}
              required
              className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            />
            <input
              type="text"
              placeholder="Street address"
              name='street'
              value={formData.street}
              onChange={onChangeHandler}
              required
              className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
            />
          </div>


          <textarea
            placeholder="Additional Information"
            name='additionalInfo'
            value={formData.additionalInfo}
            onChange={onChangeHandler}
            required
            className="w-full h-32 p-3 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded resize-none"
          ></textarea>


        </div>

        {/* -----RIGHT SIDE---------- */}

        <div className='mt-8 border-2 border-accent p-3 rounded-lg '>
          <div className='w-full lg:min-w-[420px] p-2 sm:p-4'>
            <CartTotal />
          </div>
          <div className='mt-4 p-2 sm:px-4 text-base sm:text-lg'>
            <Title text1={'PAYMENT'} text2={'METHOD'} />

            {/* ----------Payment method selection---------- */}
            <div className='flex gap-4 flex-col'>
              {/* Cash on Delivery */}
              <div
                onClick={() => setSelectedMethod('COD')}
                className={`flex items-center gap-3 p-2 px-3 cursor-pointer ${selectedMethod === 'COD' ? 'bg-gray-800' : ''}`}
              >
                <p className={`min-w-3.5 h-3.5 border ${selectedMethod === 'COD' ? 'border-accent bg-accent' : 'border-primary'} rounded-full`}></p>
                <p className='text-base font-medium'>Cash on Delivery</p>
              </div>
              {/* Conditional Info for Cash on Delivery */}
              {selectedMethod === 'COD' && (
                <div
                  className={`p-2 px-3 text-sm text-gray-300 border-l-2 bg-border border-accent transition-all duration-300`}
                >
                  Pay cash on delivery: Only applies for orders within Nairobi county.
                </div>
              )}

              {/* Pay on Order */}
              <div
                onClick={() => setSelectedMethod('order')}
                className={`flex items-center gap-3 p-2 px-3 cursor-pointer ${selectedMethod === 'order' ? 'bg-gray-800' : ''}`}
              >
                <p className={`min-w-3.5 h-3.5 border ${selectedMethod === 'order' ? 'border-accent bg-accent' : 'border-primary'} rounded-full`}></p>
                <p className='text-base font-medium'>Pay on Order</p>
              </div>

              {/* Conditional Info for Pay on Order */}
              {selectedMethod === 'order' && (
                <div
                  className={`p-2 px-3 text-sm text-gray-300 border-l-2 bg-border border-accent transition-all duration-300`}
                >
                  Pay when you order: This applies for orders outside Nairobi county
                </div>
              )}
            </div>

            <div className='w-full text-center mt-8'>
              <button type='submit' className='bg-accent  hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-12'>PLACE ORDER</button>
            </div>
          </div>

        </div>
      </form>
    </>

  )
}

export default PlaceOrder
