import { ID, ISODate } from "./common"

export interface Review {
    id: ID
    user_id: ID
    product_id: ID
    rating: number
    comment?: string | null
    created_at?: ISODate
}