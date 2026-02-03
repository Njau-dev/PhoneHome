import Image from "next/image";

interface BrandedSpinnerProps {
  message?: string;
}

const BrandedSpinner = ({ message = "Loading..." }: BrandedSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <div className="relative w-32 h-32">
        {/* Morphing shape */}
        <div className="absolute inset-0 bg-linear-to-br from-accent-hover via-accent to-accent-light rounded-3xl opacity-80 blur-sm"
          style={{
            animation: 'morph 4s ease-in-out infinite',
          }}
        />

        {/* Inner glow */}
        <div className="absolute inset-2 bg-linear-to-br from-accent to-accent-light rounded-2xl opacity-40 blur-md"
          style={{
            animation: 'morph 4s ease-in-out 0.5s infinite',
          }}
        />

        {/* Logo container */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center bg-bg backdrop-blur-sm rounded-2xl border border-border">
          <Image
            src='/assets/logo.png'
            alt="Logo"
            className="w-16 h-auto object-contain"
            width={64}
            height={64}
          />
        </div>

        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-accent-hover rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-accent-hover rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent rounded-br-lg" />
      </div>

      <p className="mt-8 text-primary font-medium tracking-wide">{message}</p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-accent rounded-full"
            style={{
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BrandedSpinner;
