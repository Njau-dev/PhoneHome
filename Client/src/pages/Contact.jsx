import React from 'react'
import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'
import ContactInfoBox from '../components/ContactInfoBox'
import Breadcrumbs from '../components/BreadCrumbs'

const Contact = () => {
  return (
    <>
      <Breadcrumbs />
      <div className="container mx-auto sm:px-4">
        <div className="my-8 md:my-12 text-center text-[20px] sm:text-3xl">
          <Title text1={'CONTACT'} text2={'US'} />
          <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
            We are here to help you with any questions you may have. Reach out to us and we'll respond as soon as we can.</p>
        </div>
        <ContactInfoBox />
        <NewsLetterBox />
      </div>
    </>
  )
}

export default Contact