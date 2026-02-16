import { ID, ISODate } from "./common"

export interface User {
    id: ID
    username: string
    email: string
    phone_number: string
    address?: string | null
    role?: "admin" | "user"
    created_at?: ISODate
    updated_at?: ISODate
}
