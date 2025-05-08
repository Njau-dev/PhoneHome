import React from 'react'
import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'

const Contact = () => {
  return (
    <div className='border-t border-border'>
      <div className="container mx-auto px-4">
        <div className="py-10 text-center">
          <div className="text-3xl">
            <Title text1={'CONTACT'} text2={'US'} />
          </div>
          <p className="mt-2 text-sm sm:text-base">We are here to help you with any questions you may have. Reach out to us and we'll respond as soon as we can.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-xl font-bold">Contact Information</h3>
            <p className="mt-2 text-sm sm:text-base">Phone: +254 712 345 678</p>
            <p className="text-sm sm:text-base">Email:
              <a href="mailto:" className="text-accent" />
            </p>
            <p className="text-sm sm:text-base">Address: 123 Main Street, Nairobi, Kenya</p>
          </div>

          <div>
            <h3 className="text-xl font-bold">Contact Form</h3>
            <form className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="Name" className="w-full p-2 border border-border rounded" />
                <input type="email" placeholder="Email" className="w-full p-2 border border-border rounded" />
                <textarea placeholder="Message" className="w-full p-2 border border-border rounded" rows="5" />
                <button type="submit" className="w-full bg-accent text-bgdark py-2 rounded hover:bg-bgdark hover:border hover:border-accent transition-all duration-300">Send Message</button>
              </div>
            </form>
          </div>
        </div>
        <NewsLetterBox />
      </div>
    </div>
  )
}

export default Contact
