import { Types } from "mongoose";

export interface ICartProduct {
    productId: Types.ObjectId;
    price: number;
    size: string;
    quantity: number;
    color?: string;
}

export interface IAddToCart {
    userId: Types.ObjectId;
    products: ICartProduct[];
    totalAmount?: number;
}
export type AddItemPayload = {
    userId: string;
    productId: Types.ObjectId;
    name: string;
    image: string;
    size: string;
    price: number;
    quantity: number;
    color?: string;
};