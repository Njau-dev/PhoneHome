import { ID, ISODate } from "./common"

export type ProductType =
    | "phone"
    | "laptop"
    | "tablet"
    | "audio"

export interface Product {
    id: ID
    name: string
    description: string
    price: number
    image_urls: string[]
    category_id: ID
    brand_id: ID
    type: ProductType
    hasVariation: boolean
    isBestSeller?: boolean
    created_at?: ISODate
    updated_at?: ISODate
}

export interface ProductVariation {
    id: ID
    product_id: ID
    ram: string
    storage: string
    price: number
}

export interface PhoneSpecs {
    ram: string
    storage: string
    battery: string
    main_camera: string
    front_camera: string
    display: string
    processor: string
    connectivity: string
    colors: string
    os: string
}

export type PhoneProduct = Product & {
    specs: PhoneSpecs
}

export interface LaptopSpecs {
    ram: string
    storage: string
    battery: string
    display: string
    processor: string
    os: string
}

export type LaptopProduct = Product & {
    specs: LaptopSpecs
}

export interface TabletSpecs {
    ram: string
    storage: string
    battery: string
    display: string
    processor: string
    os: string
    connectivity: string
    colors: string
    main_camera: string
    front_camera: string
}

export type TabletProduct = Product & {
    specs: TabletSpecs
}

export interface AudioSpecs {
    battery: string
}

export type AudioProduct = Product & {
    specs: AudioSpecs
}
