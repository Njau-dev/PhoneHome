import { ID, ISODate } from "./common"

export interface Notification {
    id: ID
    user_id: ID
    message: string
    is_read?: boolean
    created_at?: ISODate
}