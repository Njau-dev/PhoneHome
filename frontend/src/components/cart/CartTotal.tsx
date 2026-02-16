"use client";

import { useCart } from "@/lib/hooks";
import { CURRENCY, DELIVERY_FEE } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/format";
import Title from "../common/Title";

const CartTotal = () => {
    const { total: subtotal } = useCart();
    const total = subtotal + DELIVERY_FEE;

    return (
        <div className="w-full">
            <div className="text-xl mb-3">
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className="flex flex-col gap-2 mt-2 text-sm sm:text-base">
                <div className="flex justify-between py-2 border-b border-border">
                    <p className="text-secondary">Subtotal</p>
                    <p className="text-primary">
                        {CURRENCY} {formatPrice(subtotal)}
                    </p>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                    <p className="text-secondary">Shipping Fee</p>
                    <p className="text-primary">
                        {DELIVERY_FEE === 0 ? "FREE" : `${CURRENCY} ${formatPrice(DELIVERY_FEE)}`}
                    </p>
                </div>

                <div className="flex justify-between py-3 text-lg font-bold">
                    <p className="text-primary">Total</p>
                    <p className="text-accent">
                        {CURRENCY} {formatPrice(total)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CartTotal;
