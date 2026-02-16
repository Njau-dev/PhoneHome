import { ID, ISODate } from "./common"

export type PaymentStatus =
    | "pending"
    | "success"
    | "failed"

export interface Payment {
    id: ID
    payment_method: "mpesa" | "card" | "cash"
    amount: number
    status: PaymentStatus
    order_reference: string
    transaction_id?: string | null
    mpesa_receipt?: string | null
    phone_number?: string | null
    failure_reason?: string | null
    created_at?: ISODate
    updated_at?: ISODate
}
