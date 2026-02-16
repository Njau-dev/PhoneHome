"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RefreshCcw } from "lucide-react";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import Title from "@/components/common/Title";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileStats from "@/components/profile/ProfileStats";
import StatusBadge from "@/components/common/StatusBadge";
import { apiClient } from "@/lib/api/client";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { CURRENCY } from "@/lib/utils/constants";
import { toast } from "sonner";
import { User } from "@/lib/types/user";

interface ProfileOrderItem {
  id?: string | number;
  image_url: string;
  name: string;
  brand?: string;
  variation_name?: string | null;
}

interface ProfileOrder {
  id: string | number;
  status: string;
  total_amount: number;
  date: string;
  items: ProfileOrderItem[];
}

interface ProfileWishlistItem {
  id: string | number;
  image_url: string;
  product_name: string;
  brand: string;
  price: number;
}

interface ProfileData {
  stats: {
    order_count: number;
    total_payment: number;
    wishlist_count: number;
    review_count: number;
  };
  recentOrders: ProfileOrder[];
  wishlistItems: ProfileWishlistItem[];
}

export default function ProfilePage() {
  const { user, updateUser, isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    stats: {
      order_count: 0,
      total_payment: 0,
      wishlist_count: 0,
      review_count: 0,
    },
    recentOrders: [],
    wishlistItems: [],
  });

  const toRecord = (input: unknown): Record<string, unknown> => {
    return typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  };

  const normalizeStats = (value: unknown): ProfileData["stats"] => {
    const root = toRecord(value);
    const data = toRecord(root.data);
    const stats = toRecord(root.stats);
    const dataStats = toRecord(data.stats);
    const source = Object.keys(stats).length
      ? stats
      : Object.keys(dataStats).length
        ? dataStats
        : data;

    const toNumber = (input: unknown): number => {
      const parsed = typeof input === "number" ? input : Number(input);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      order_count: toNumber(source.order_count ?? source.orderCount),
      total_payment: toNumber(source.total_payment ?? source.totalPayment),
      wishlist_count: toNumber(source.wishlist_count ?? source.wishlistCount),
      review_count: toNumber(source.review_count ?? source.reviewCount),
    };
  };

  const normalizeOrders = (value: unknown): ProfileOrder[] => {
    const root = toRecord(value);
    const data = toRecord(root.data);
    const rawOrders = Array.isArray(value)
      ? value
      : Array.isArray(root.orders)
        ? root.orders
        : Array.isArray(root.data)
          ? (root.data as unknown[])
          : Array.isArray(data.orders)
            ? (data.orders as unknown[])
            : [];

    return rawOrders.map((entry, index) => {
      const order = toRecord(entry);
      const rawItems = Array.isArray(order.items) ? order.items : [];
      const items: ProfileOrderItem[] = rawItems.map((rawItem, itemIndex) => {
        const item = toRecord(rawItem);
        return {
          id:
            typeof item.id === "number" || typeof item.id === "string"
              ? item.id
              : `${index}-${itemIndex}`,
          image_url: typeof item.image_url === "string" ? item.image_url : "",
          name: typeof item.name === "string" ? item.name : "",
          brand: typeof item.brand === "string" ? item.brand : "",
          variation_name:
            typeof item.variation_name === "string" ? item.variation_name : null,
        };
      });

      const id =
        typeof order.id === "number" || typeof order.id === "string"
          ? order.id
          : index;
      const totalAmount =
        typeof order.total_amount === "number"
          ? order.total_amount
          : Number(order.total_amount) || 0;
      const date =
        typeof order.date === "string"
          ? order.date
          : typeof order.created_at === "string"
            ? order.created_at
            : "";
      const status = typeof order.status === "string" ? order.status : "Unknown";

      return {
        id,
        items,
        total_amount: totalAmount,
        date,
        status,
      };
    });
  };

  const normalizeWishlist = (value: unknown): ProfileWishlistItem[] => {
    const root = toRecord(value);
    const data = toRecord(root.data);
    const rawWishlist = Array.isArray(value)
      ? value
      : Array.isArray(root.wishlist)
        ? root.wishlist
        : Array.isArray(root.data)
          ? (root.data as unknown[])
          : Array.isArray(data.wishlist)
            ? (data.wishlist as unknown[])
            : [];

    return rawWishlist.map((entry, index) => {
      const item = toRecord(entry);
      return {
        id:
          typeof item.id === "number" || typeof item.id === "string"
            ? item.id
            : index,
        image_url: typeof item.image_url === "string" ? item.image_url : "",
        product_name:
          typeof item.product_name === "string" ? item.product_name : "",
        brand: typeof item.brand === "string" ? item.brand : "",
        price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
      };
    });
  };

  const fetchProfileData = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const [statsRes, ordersRes, wishlistRes] = await Promise.all([
        apiClient.get("/profile/stats"),
        apiClient.get("/profile/orders"),
        apiClient.get("/profile/wishlist"),
      ]);

      setProfileData({
        stats: normalizeStats(statsRes),
        recentOrders: normalizeOrders(ordersRes),
        wishlistItems: normalizeWishlist(wishlistRes),
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setIsError(true);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchProfileData();
  }, [hasHydrated, isAuthenticated, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileUpdate = async (data: Partial<User>) => {
    try {
      await apiClient.put("/profile", data);
      updateUser(data);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  // Transform orders for display (one item per row, max 5)
  const transformedOrders = Array.isArray(profileData.recentOrders)
    ? profileData.recentOrders
      .flatMap((order) =>
        order.items.map((item, index: number) => ({
          ...order,
          items: [item],
          showOrderDetails: index === 0,
        }))
      )
      .slice(0, 5)
    : [];

  if (!user) {
    return <BrandedSpinner message="Loading profile..." />;
  }

  if (isLoading) {
    return <BrandedSpinner message="Loading profile data..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-100 text-center">
        <h2 className="text-2xl mb-4">Something went wrong</h2>
        <p className="text-secondary mb-6">We couldn&apos;t load your profile information</p>
        <button
          onClick={fetchProfileData}
          className="flex items-center bg-accent text-bg px-6 py-3 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all"
        >
          <RefreshCcw size={18} className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-16">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12 text-center text-2xl sm:text-3xl">
          <Title text1="MY" text2="PROFILE" />
          <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
            Manage your personal information and track your orders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <ProfileCard user={user} onUpdate={handleProfileUpdate} />
          </div>

          {/* Stats and Activity */}
          <div className="lg:col-span-3">
            {/* Stats */}
            <ProfileStats stats={profileData.stats} />

            {/* Recent Orders and Wishlist */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Recent Orders */}
              <div className="md:col-span-3 bg-bg-card rounded-xl p-6 border border-border shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Recent Orders</h3>
                  <Link href="/orders">
                    <button className="text-accent text-sm hover:underline">
                      View All
                    </button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {transformedOrders.length > 0 ? (
                    <table className="w-full min-w-155">
                      <thead className="text-left">
                        <tr className="border-b border-border">
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Product
                          </th>
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Total
                          </th>
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Date
                          </th>
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transformedOrders.map((order, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="py-4">
                              {order.items[0] && (
                                <div className="flex items-center">
                                  <Image
                                    src={order.items[0].image_url || "/assets/logo.png"}
                                    alt={order.items[0].name}
                                    width={48}
                                    height={48}
                                    unoptimized
                                    className="w-12 h-12 object-cover rounded-md mr-3"
                                  />
                                  <div>
                                    <p className="font-medium text-sm">
                                      {order.items[0].name}
                                    </p>
                                    <p className="text-secondary text-xs">
                                      {order.items[0].brand}
                                      {order.items[0].variation_name &&
                                        ` - ${order.items[0].variation_name}`}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 text-sm">
                              {order.showOrderDetails ? (
                                <>
                                  {CURRENCY} {formatPrice(order.total_amount)}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-4 text-sm">
                              {order.showOrderDetails
                                ? formatDate(order.date)
                                : "-"}
                            </td>
                            <td className="py-4">
                              {order.showOrderDetails ? (
                                <StatusBadge status={order.status} type="order" />
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary mb-4">
                        You haven&apos;t placed any orders yet
                      </p>
                      <Link href="/collection">
                        <button className="bg-accent text-bg px-6 py-2 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all">
                          Shop Now
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Wishlist */}
              <div className="md:col-span-2 bg-bg-card rounded-xl p-6 border border-border shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Wishlist</h3>
                  <Link href="/wishlist">
                    <button className="text-accent text-sm hover:underline">
                      View All
                    </button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {profileData.wishlistItems.length > 0 ? (
                    <table className="w-full min-w-100">
                      <thead className="text-left">
                        <tr className="border-b border-border">
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Product
                          </th>
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Brand
                          </th>
                          <th className="pb-3 text-secondary font-medium text-sm">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileData.wishlistItems.slice(0, 5).map((item) => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-4">
                              <div className="flex items-center">
                                <Image
                                  src={item.image_url || "/assets/logo.png"}
                                  alt={item.product_name}
                                  width={48}
                                  height={48}
                                  unoptimized
                                  className="w-12 h-12 object-cover rounded-md mr-3"
                                />
                                <p className="font-medium text-sm">
                                  {item.product_name}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 text-sm">{item.brand}</td>
                            <td className="py-4 text-sm">
                              {CURRENCY} {formatPrice(item.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary mb-4">
                        Your wishlist is empty
                      </p>
                      <Link href="/collection">
                        <button className="bg-accent text-bg px-6 py-2 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all">
                          Discover Products
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
