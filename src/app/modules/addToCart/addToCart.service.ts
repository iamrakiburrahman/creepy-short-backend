import { Types } from "mongoose";
import { AddItemPayload } from "./addToCart.interface";
import { Cart } from "./addToCart.model";
import { CACHE_TTL, createCacheHelper } from "../../builder/RedisCacheHelper";

const cartCache = createCacheHelper('cart');
const calcTotal = (products: any[]) =>
    products.reduce((sum, p) => sum + p.price * p.quantity, 0);

const getCartByUser = async (userId: string) => {
    return await cartCache.wrapList(
        { userId },  // Custom key with the userId
        async () => {
            let cart = await Cart.findOne({ userId }).populate("products.productId", "images");
            if (!cart) {
                cart = await Cart.create({ userId, products: [], totalAmount: 0 });
            }
            return cart;
        },
        CACHE_TTL.VERY_LONG
    );
};

const addItemToCart = async (payload: AddItemPayload) => {
    const cart = await getCartByUser(payload.userId);
    const idx = cart.products.findIndex(
        (p) =>
            p.productId.toString() === payload.productId.toString() &&
            p.color === payload.color &&
            p.size === payload.size
    );

    if (idx > -1) {
        cart.products[idx].quantity += payload.quantity;
        cart.products[idx].price = payload.price;
    } else {
        cart.products.push({
            productId: payload.productId,
            size: payload.size,
            price: payload.price,
            quantity: payload.quantity,
            color: payload.color,
        } as any);
    }
    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    await cartCache.clearLists();
    return cart;
};
const setItemInCart = async (payload: AddItemPayload) => {
    const cart = await getCartByUser(payload.userId);
    const idx = cart.products.findIndex(
        (p) =>
            p.productId.toString() === payload.productId.toString() &&
            p.color === payload.color &&
            p.size === payload.size
    );


    if (idx > -1) {
        cart.products[idx].quantity = payload.quantity;
        cart.products[idx].price = payload.price;
    } else {
        cart.products.push({
            productId: payload.productId,
            size: payload.size,
            price: payload.price,
            quantity: payload.quantity,
            color: payload.color,
        } as any);
    }
    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    return cart;
};
const toId = (v: string | Types.ObjectId) =>
    typeof v === "string" ? new Types.ObjectId(v) : v;


// ✅ Increment API
export const incrementCartItem = async (
    userId: string,
    cartItemId: string // cart product এর _id
) => {
    const uid = toId(userId);
    const itemId = toId(cartItemId);

    const cart = await Cart.findOne({
        userId: uid,
        'products._id': itemId
    });

    if (!cart) {
        console.log('Cart or item not found');
        return null;
    }

    const item = cart.products.find((p: any) => (p as any)._id?.toString() === itemId.toString());
    if (!item) return null;

    item.quantity += 1;
    console.log(`Incremented to ${item.quantity}`);

    cart.totalAmount = cart.products.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
    );

    cart.markModified('products');
    await cart.save();
    await cartCache.clearLists()
    return cart;
};

// ✅ Decrement API
export const decrementCartItem = async (
    userId: string,
    cartItemId: string
) => {
    const uid = toId(userId);
    const itemId = toId(cartItemId);

    const cart = await Cart.findOne({
        userId: uid,
        'products._id': itemId
    });

    if (!cart) {
        console.log('Cart or item not found');
        return null;
    }

    const idx = cart.products.findIndex((p: any) => (p as any)._id?.toString() === itemId.toString());
    if (idx === -1) return null;

    cart.products[idx].quantity -= 1;
    console.log(`Decremented to ${cart.products[idx].quantity}`);

    if (cart.products[idx].quantity <= 0) {
        cart.products.splice(idx, 1);
        console.log('Removed item');
    }

    cart.totalAmount = cart.products.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
    );

    cart.markModified('products');
    await cart.save();
    await cartCache.clearLists()
    return cart;
};
const removeItemFromCart = async (
    userId: string,
    productId: string,
    size: string,
    color?: string
) => {
    const cart = await getCartByUser(userId);
    cart.products = cart.products.filter(
        (p) =>
            !(
                p.productId.toString() === productId.toString() &&
                p.size === size &&
                p.color === color
            )
    ) as any;
    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    return cart;
};
const clearCart = async (userId: string) => {
    const cart = await getCartByUser(userId);
    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();
    await cartCache.clearAll()
    return cart;
};
export const AddToCartService = {
    getCartByUser,
    addItemToCart,
    setItemInCart,
    incrementCartItem,
    decrementCartItem,
    removeItemFromCart,
    clearCart
}