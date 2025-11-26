import express from "express"
import { AddToCartController } from "./addToCart.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enums/user";
const router = express.Router()


router.get("/me", auth(USER_ROLES.USER), AddToCartController.getMyCart);
router.post("/add", auth(USER_ROLES.USER), AddToCartController.addItem);
router.put("/item", auth(USER_ROLES.USER) ,AddToCartController.setItemInCart);
router.patch("/item/:productId/increment", auth(USER_ROLES.USER) ,AddToCartController.incrementItemQuantity);
router.patch("/item/:productId/decrement", auth(USER_ROLES.USER) ,AddToCartController.decrementItemQuantity);
router.delete("/item/:productId", auth(USER_ROLES.USER), AddToCartController.removeFromCart);
router.delete("/clear", auth(USER_ROLES.USER), AddToCartController.clearCart);

export const CartRouter = router
