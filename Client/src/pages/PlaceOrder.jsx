import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import Breadcrumbs from '../components/BreadCrumbs';
import MpesaPaymentModal from '../components/MpesaPaymentModal';

const PlaceOrder = () => {

  const [selectedMethod, setSelectedMethod] = useState('COD');
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('MPESA'); // For Pay on Order sub-options
  const [showMpesaModal, setShowMpesaModal] = useState(false);

  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);

  // Payment options for "Pay on Order" - easily extensible
  const paymentOptions = [
    { id: 'MPESA', name: 'M-Pesa', available: true },
    { id: 'PAYPAL', name: 'PayPal', available: false },
    { id: 'CARD', name: 'Credit/Debit Card', available: false },
    // Add more payment methods here as needed
  ];

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

  const handleMpesaPayment = () => {
    // Validate form first
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'street'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setShowMpesaModal(true);
  };

  const handlePayOnOrder = () => {
    // Validate form first
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'street'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Handle different payment options
    switch (selectedPaymentOption) {
      case 'MPESA':
        handleMpesaPayment();
        break;
      case 'PAYPAL':
        toast.info('PayPal payment coming soon!');
        break;
      case 'CARD':
        toast.info('Card payment coming soon!');
        break;
      default:
        toast.warning('Please select a payment option');
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.info('Please log in to complete the order')
      return;
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

            const response = await fetch(backendUrl + "/orders", {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (response.status === 201) {
              toast.success(data.message);
              navigate("/orders");
              setCartItems({});
            } else {
              toast.error(data.error || "Failed to place order");
            }
          } catch (error) {
            toast.error("Failed to place order");
            console.error("Order error:", error);
          }
          break;

        case "PAY_ON_ORDER":
          handlePayOnOrder();
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
      <div onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-3 sm:pt-10 min-h-[70vh]'>

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
                onClick={() => setSelectedMethod('PAY_ON_ORDER')}
                className={`flex items-center gap-3 p-2 px-3 cursor-pointer ${selectedMethod === 'PAY_ON_ORDER' ? 'bg-gray-800' : ''}`}
              >
                <p className={`min-w-3.5 h-3.5 border ${selectedMethod === 'PAY_ON_ORDER' ? 'border-accent bg-accent' : 'border-primary'} rounded-full`}></p>
                <p className='text-base font-medium'>Pay on Order</p>
              </div>

              {/* Conditional Info and Payment Options for Pay on Order */}
              {selectedMethod === 'PAY_ON_ORDER' && (
                <div className='transition-all duration-300'>
                  <div className={`p-2 px-3 text-sm text-gray-300 border-l-2 bg-border border-accent mb-3`}>
                    Pay when placing order: Available for all locations including outside Nairobi CBD.
                  </div>

                  {/* Payment Options */}
                  <div className='ml-4 flex flex-col gap-2'>
                    {paymentOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => option.available && setSelectedPaymentOption(option.id)}
                        className={`flex items-center gap-3 p-2 px-3 cursor-pointer ${!option.available ? 'opacity-50 cursor-not-allowed' : ''
                          } ${selectedPaymentOption === option.id && option.available ? 'bg-gray-700' : ''}`}
                      >
                        <p className={`min-w-3 h-3 border ${selectedPaymentOption === option.id && option.available
                          ? 'border-accent bg-accent'
                          : 'border-primary'
                          } rounded-full`}></p>
                        <p className={`text-sm font-medium ${!option.available ? 'text-gray-500' : ''}`}>
                          {option.name}
                          {!option.available && ' (Coming Soon)'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='w-full text-center mt-8'>
              {selectedMethod === 'PAY_ON_ORDER' ? (
                <button
                  type='button'
                  onClick={handlePayOnOrder}
                  className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-12'
                >
                  PAY NOW
                </button>
              ) : (
                <button
                  type='submit'
                  className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-12'
                >
                  PLACE ORDER
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa Payment Modal */}
      {showMpesaModal && (
        <MpesaPaymentModal
          isOpen={showMpesaModal}
          onClose={() => setShowMpesaModal(false)}
          orderData={{
            total_amount: getCartAmount() + delivery_fee,
            address: formData,
            payment_method: "MPESA",
          }}
          onSuccess={() => {
            setShowMpesaModal(false);
            navigate("/orders");
            setCartItems({});
          }}
          // Remove onSTKPushSent callback completely
          onModalClose={() => {
            setShowMpesaModal(false);
            navigate("/orders");
            setCartItems({});
          }}
        />
      )}
    </>
  )
}

export default PlaceOrder