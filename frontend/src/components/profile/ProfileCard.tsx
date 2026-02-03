"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Edit, X, Save, Camera } from "lucide-react";
import { User } from "@/lib/types/user";
import { formatDate } from "@/lib/utils/format";

interface ProfileCardProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
}

const ProfileCard = ({ user, onUpdate }: ProfileCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username,
    email: user.email,
    phone_number: user.phone_number || "",
    address: user.address || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await onUpdate(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number || "",
      address: user.address || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-bg-card rounded-xl overflow-hidden border border-border hover:border-accent transition-all shadow-md">
      <div className="bg-linear-to-r from-accent/20 to-accent/10 py-6 px-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-bg p-2 rounded-full hover:bg-bg-light transition"
          >
            {isEditing ? <X size={16} /> : <Edit size={16} />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-4 border-accent text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {isEditing && (
              <div className="absolute bottom-0 right-0">
                <button className="bg-accent text-bg p-2 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition">
                  <Camera size={16} />
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
          ) : (
            <input
              type="text"
              name="username"
              value={editForm.username}
              onChange={handleInputChange}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-xl font-bold mb-1 text-center w-full"
            />
          )}

          <p className="text-secondary text-sm">
            Member since {formatDate(user.created_at || "")}
          </p>
        </div>
      </div>

      <div className="p-6">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-accent mr-3 mt-1" />
              <div>
                <p className="text-secondary text-sm">Email</p>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 text-accent mr-3 mt-1" />
              <div>
                <p className="text-secondary text-sm">Phone</p>
                <p>{user.phone_number || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-accent mr-3 mt-1" />
              <div>
                <p className="text-secondary text-sm">Address</p>
                <p>{user.address || "Not provided"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-secondary text-sm mb-1">Email</label>
              <div className="flex">
                <span className="bg-bg px-3 py-2 rounded-l-lg flex items-center border border-r-0 border-border">
                  <Mail className="w-5 h-5 text-accent" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="bg-bg border border-border rounded-r-lg px-3 py-2 w-full outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-1">Phone</label>
              <div className="flex">
                <span className="bg-bg px-3 py-2 rounded-l-lg flex items-center border border-r-0 border-border">
                  <Phone className="w-5 h-5 text-accent" />
                </span>
                <input
                  type="tel"
                  name="phone_number"
                  value={editForm.phone_number}
                  onChange={handleInputChange}
                  className="bg-bg border border-border rounded-r-lg px-3 py-2 w-full outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-1">Address</label>
              <div className="flex">
                <span className="bg-bg px-3 py-2 rounded-l-lg flex items-start border border-r-0 border-border">
                  <MapPin className="w-5 h-5 text-accent" />
                </span>
                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-bg border border-border rounded-r-lg px-3 py-2 w-full outline-none focus:border-accent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleSave}
                className="bg-accent text-bg flex items-center justify-center gap-2 py-2 px-4 rounded-lg hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition w-full"
              >
                <Save size={16} />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="bg-bg-light flex items-center justify-center gap-2 py-2 px-4 rounded-lg hover:bg-bg transition w-full"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
