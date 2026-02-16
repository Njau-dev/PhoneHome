import { ID, ISODate } from "./common"
import { Product } from "./product"

export interface Wishlist {
    id: ID
    user_id: ID
    created_at?: ISODate
    products: Product[]
}