import { Request, Response } from "express";
import { ChangeQuantitySchema, CreateCartSchema } from "../schema/cart";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { Product } from "@prisma/client";
import { prismaClient } from "..";
import { UnauthorizedException } from "../exceptions/unauthorized";

export const addItemToCart = async (req: Request, res: Response) => {
  //check for the existence of the same product in users cart and alter the quantity as required
  const validatedData = CreateCartSchema.parse(req.body); // Validate the incoming request body
  let product: Product;
  try {
    product = await prismaClient.product.findFirstOrThrow({
      where: {
        id: validatedData.productId,
      },
    });
  } catch (error) {
    throw new NotFoundException(
      "Product not found!",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
  const cart = await prismaClient.cartItem.create({
    data: {
      userId: req.user?.id,
      productId: product.id,
      quantity: validatedData.quantity,
    },
  });
  res.json(cart);
};

export const deleteItemFromCart = async (req: Request, res: Response) => {
  //check if user is deleting his own cart item
  if (req.user?.id !== req.params.id) {
    throw new UnauthorizedException(
      "You are not authorized to delete this item",
      ErrorCode.UNAUTHORIZED
    );
  }
  await prismaClient.cartItem.delete({
    where: {
      id: +req.params.id,
    },
  });
  res.json({ success: true });
};

export const changeQuantity = async (req: Request, res: Response) => {
  //check if user is updating his own cart item
  const cartItem = await prismaClient.cartItem.findUnique({
    where: {
      id: +req.params.id,
    },
  });
  if (!cartItem) {
    throw new Error("Cart item not found");
  }
  if (cartItem?.userId !== req.user?.id) {
    throw new UnauthorizedException(
      "You are not authorized to update this item",
      ErrorCode.UNAUTHORIZED
    );
  }
  const validatedData = ChangeQuantitySchema.parse(req.body);
  const updatedCart = await prismaClient.cartItem.update({
    where: {
      id: +req.params.id,
    },
    data: {
      quantity: validatedData.quantity,
    },
  });
  res.json(updatedCart);
};

export const getCart = async (req: Request, res: Response) => {
  const cart = await prismaClient.cartItem.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      product: true,
    },
  });
  res.json(cart);
};
