"use client";

interface DeliveryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  street: string;
  additionalInfo?: string;
}

interface DeliveryFormProps {
  formData: DeliveryFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const DeliveryForm = ({ formData, onChange }: DeliveryFormProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="First name"
          name="firstName"
          value={formData.firstName}
          onChange={onChange}
          required
          className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />
        <input
          type="text"
          placeholder="Last name"
          name="lastName"
          value={formData.lastName}
          onChange={onChange}
          required
          className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />
      </div>

      <input
        type="email"
        placeholder="Email address"
        name="email"
        value={formData.email}
        onChange={onChange}
        required
        className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
      />

      <input
        type="tel"
        placeholder="Phone no."
        name="phone"
        value={formData.phone}
        onChange={onChange}
        required
        className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
      />

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="City / Town"
          name="city"
          value={formData.city}
          onChange={onChange}
          required
          className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />
        <input
          type="text"
          placeholder="Street address"
          name="street"
          value={formData.street}
          onChange={onChange}
          required
          className="w-full px-3 py-3.5 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />
      </div>

      <textarea
        placeholder="Additional Information"
        name="additionalInfo"
        value={formData.additionalInfo || ""}
        onChange={onChange}
        className="w-full h-32 p-3 text-primary placeholder:text-secondary bg-bg border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded resize-none"
      ></textarea>
    </div>
  );
};

export default DeliveryForm;
