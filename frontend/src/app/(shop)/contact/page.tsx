import Title from "@/components/common/Title";
import NewsLetterBox from "@/components/common/NewsLetterBox";
import ContactInfoBox from "@/components/common/ContactInfoBox";

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4">
            <div className="my-8 md:my-12 text-center text-2xl sm:text-3xl">
                <Title text1="CONTACT" text2="US" />
                <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
                    We are here to help you with any questions you may have. Reach out to us
                    and we&apos;ll respond as soon as we can.
                </p>
            </div>
            <ContactInfoBox />
            <NewsLetterBox />
        </div>
    );
}
