import { ID, ISODate } from "./common"

export interface Address {
    id: ID
    user_id: ID
    first_name: string
    last_name: string
    email: string
    phone: string
    city: string
    street: string
    additional_info?: string | null
    is_default?: boolean
    created_at?: ISODate
}
