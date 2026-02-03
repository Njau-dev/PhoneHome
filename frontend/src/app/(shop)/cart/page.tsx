"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart, useProducts } from "@/lib/hooks";
import Title from "@/components/common/Title";
import CartTotal from "@/components/cart/CartTotal";
import CartItem from "@/components/cart/CartItem";
import Breadcrumbs from "@/components/common/BreadCrumbs";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { allProducts } = useProducts();

  // Transform cart items for display
  const cartData = useMemo(() => {
    const data: Array<{
      productId: number;
      variationKey: string;
      quantity: number;
      price: number;
    }> = [];

    for (const productId in items) {
      const productVariations = items[productId];

      for (const variationKey in productVariations) {
        const variation = productVariations[variationKey];
        data.push({
          productId: parseInt(productId),
          variationKey,
          quantity: variation.quantity,
          price: variation.price,
        });
      }
    }

    return data;
  }, [items]);

  const handleQuantityChange = (
    productId: number,
    variationKey: string,
    action: "increase" | "decrease"
  ) => {
    const currentQuantity = items[productId.toString()]?.[variationKey]?.quantity || 0;
    const newQuantity = action === "increase" ? currentQuantity + 1 : currentQuantity - 1;

    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity, variationKey);
    }
  };

  const handleRemoveItem = (productId: number, variationKey: string) => {
    removeItem(productId, variationKey);
  };

  const handleClearCart = () => {
    clearCart();
  };

  if (cartData.length === 0) {
    return (
      <>
        <Breadcrumbs />
        <div className="flex flex-col items-center justify-center min-h-100 text-center">
          <ShoppingBag className="size-20 sm:size-28 text-secondary mb-4" />
          <p className="text-lg sm:text-xl mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/collection")}
            className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent text-bg font-medium py-3 px-6 rounded-full transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs />
      <div className="pt-4">
        <div className="text-xl sm:text-3xl mb-3">
          <Title text1="YOUR" text2="CART" />
        </div>

        <div className="pt-6 lg:pt-14 flex flex-col lg:flex-row lg:justify-between lg:gap-10">
          {/* Cart Table */}
          <div className="w-full lg:w-2/3 flex-1">
            <table className="w-full border-collapse">
              <thead className="hidden lg:table-header-group">
                <tr className="text-left text-sm sm:text-lg border-b border-border">
                  <th className="pb-4 font-medium">Product</th>
                  <th className="pb-4 font-medium"></th>
                  <th className="pb-4 font-medium">Price</th>
                  <th className="pb-4 font-medium">Quantity</th>
                  <th className="pb-4 font-medium">Subtotal</th>
                  <th className="pb-4 font-medium"></th>
                </tr>
              </thead>

              <tbody>
                {cartData.map((item, index) => {
                  const product = allProducts.find(
                    (p) => p.id === item.productId
                  );

                  if (!product) return null;

                  return (
                    <CartItem
                      key={`${item.productId}-${item?.variationKey}-${index}`}
                      product={product}
                      variationKey={item.variationKey}
                      quantity={item.quantity}
                      price={item.price}
                      onUpdateQuantity={(action) =>
                        handleQuantityChange(
                          item.productId,
                          item.variationKey,
                          action
                        )
                      }
                      onRemove={() =>
                        handleRemoveItem(item.productId, item.variationKey)
                      }
                    />
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearCart}
                className="border border-accent text-accent hover:bg-accent hover:text-bg rounded px-4 py-2 text-sm font-medium transition-all"
              >
                CLEAR CART
              </button>
            </div>
          </div>

          {/* Cart Total */}
          <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
            <div className="p-6 border-2 border-accent rounded-md">
              <CartTotal />
              <div className="w-full text-center">
                <button
                  onClick={() => router.push("/place-order")}
                  className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-11 transition-all"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
