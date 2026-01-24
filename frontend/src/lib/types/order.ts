import { ID, ISODate } from "./common"
import { Address } from "./address"

export type OrderStatus =
    | "pending"
    | "paid"
    | "shipped"
    | "delivered"
    | "cancelled"

export interface OrderItem {
    id: ID
    product_id: ID
    quantity: number
    variation_name?: string | null
    variation_price?: number | null
}

export interface Order {
    id: ID
    user_id: ID
    status: OrderStatus
    total_amount: number
    order_reference?: string | null
    address?: Address | null
    created_at?: ISODate
    updated_at?: ISODate
    items: OrderItem[]
}