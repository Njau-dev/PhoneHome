import { ID } from "./common"
import { Product } from "./product"

export interface CartItem {
    id: ID
    product: Product
    quantity: number
    variation_name?: string | null
    variation_price?: number | null
}

export interface Cart {
    id: ID
    user_id: ID
    items: CartItem[]
}