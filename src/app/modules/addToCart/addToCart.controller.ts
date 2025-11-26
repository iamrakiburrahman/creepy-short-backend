import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse"
import { AddToCartService } from "./addToCart.service"

const getMyCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await AddToCartService.getCartByUser(id)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart retrieved successfully',
        data: result,
    });
})
const addItem = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    req.body.userId = id
    const result = await AddToCartService.addItemToCart(req.body)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart item added successfully',
        data: result,
    });
})
const setItemInCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    req.body.userId = id
    const result = await AddToCartService.setItemInCart(req.body)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart item set successfully',
        data: result,
    });
})
const incrementItemQuantity = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const { productId } = req.params;
    const result = await AddToCartService.incrementCartItem(id, productId)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Quantity incremented successfully',
        data: result,
    });
})
const decrementItemQuantity = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const { productId } = req.params;
    const result = await AddToCartService.decrementCartItem(id, productId)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Quantity decremented successfully',
        data: result,
    });
})
const removeFromCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const { productId } = req.params;
    const { size, color } = req.query;
    const result = await AddToCartService.removeItemFromCart(
        id,
        productId,
        String(size),
        typeof color === "string" ? color : undefined
    )
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Item removed successfully',
        data: result,
    });
})
const clearCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await AddToCartService.clearCart(id)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart clear successfully',
        data: result,
    });
})
export const AddToCartController = { getMyCart, addItem, setItemInCart, removeFromCart, clearCart, incrementItemQuantity, decrementItemQuantity }
