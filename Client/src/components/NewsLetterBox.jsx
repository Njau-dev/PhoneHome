import React from 'react'

const NewsLetterBox = () => {

    const onSubmitHandler = (event) => {
        event.preventDefault();
    }

  return (
    <div className='text-center'>
      <p className='text-2xl font-medium text-white'>Subscribe now & get a discount</p>
      <p className="text-primary mt-3"></p>
      
      <form onSubmit={onSubmitHandler} className='w-4/5 sm:w-1/3  md:w-1/2 flex items-center gap-3 mx-auto my-6 pl-3 text-xl bg-primary'>
        <input className='w-full sm:flex-1 outline-none  m-0 bg-primary text-lg text-black' type="email" placeholder='Enter your email' required/>
        <button type='submit' className='bg-accent text-black text-sm px-10 py-4'>SUBSCRIBE</button>
      </form>
    </div>
  )
}

export default NewsLetterBox
