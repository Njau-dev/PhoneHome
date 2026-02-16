interface TitleProps {
  text1: string;
  text2: string;
}

const Title = ({ text1, text2 }: TitleProps) => {
  return (
    <div className="inline-flex gap-2 items-center mb-3 font-prata text-lg sm:text-xl">
      <p className="text-primary">
        {text1}{" "}
        <span className="text-primary font-bold">{text2}</span>
      </p>
      <p className="w-8 sm:w-12 h-px sm:h-0.5 bg-accent"></p>
    </div>
  );
};

export default Title;
