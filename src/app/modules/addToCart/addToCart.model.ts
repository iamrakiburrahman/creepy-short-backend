import { Schema, model } from "mongoose";
import { IAddToCart, ICartProduct } from "./addToCart.interface";

const CartProductSchema = new Schema<ICartProduct>(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        size: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        color: { type: String },
    },
    { _id: true }
);

const CartSchema = new Schema<IAddToCart>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        products: { type: [CartProductSchema], required: true },
        totalAmount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Cart = model<IAddToCart>("Cart", CartSchema);