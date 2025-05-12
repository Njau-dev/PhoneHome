import React from 'react'
import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'
import ContactInfoBox from '../components/ContactInfoBox'
import Breadcrumbs from '../components/BreadCrumbs'

const Contact = () => {
  return (
    <>
      <Breadcrumbs />
      <div className=''>
        <div className="container mx-auto px-4">
          <div className="pt-10 text-center">
            <div className="text-3xl">
              <Title text1={'CONTACT'} text2={'US'} />
            </div>
            <p className="w-3/4 m-auto text-sm sm:text-base text-secondary">We are here to help you with any questions you may have. Reach out to us and we'll respond as soon as we can.</p>
          </div>
          <ContactInfoBox />
          <NewsLetterBox />
        </div>
      </div>
    </>
  )
}

export default Contact