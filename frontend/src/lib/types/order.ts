import { ID, ISODate } from "./common"
import { Address } from "./address"

// API returns mixed-case and domain-specific status values (e.g. "Payment Failed"),
// so keep this open-ended for compatibility.
export type OrderStatus = string

export interface OrderPayment {
    status?: string | null
    method?: string | null
    transaction_id?: string | null
    failure_reason?: string | null
    checkout_request_id?: string | null
    mpesa_receipt?: string | null
    [key: string]: unknown
}

export interface OrderItem {
    id?: ID
    product_id: ID
    quantity: number
    variation_name?: string | null
    variation_price?: number | null
    name?: string
    brand?: string
    image_url?: string
    price?: number
}

export interface Order {
    id: ID
    user_id?: ID
    status: OrderStatus
    total_amount: number
    order_reference?: string | null
    address?: Partial<Address> | null
    created_at?: ISODate
    updated_at?: ISODate
    items: OrderItem[]
    payment?: OrderPayment | string | null
    payment_method?: string | null
    transaction_id?: string | null
    failure_reason?: string | null
    checkout_request_id?: string | null
}
