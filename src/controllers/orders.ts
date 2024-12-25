import { Request, Response } from "express";
import { prismaClient } from "..";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnauthorizedException } from "../exceptions/unauthorized";

export const createOrder = async (req: Request, res: Response) => {
  // 1. to create a transaction
  // 2. to list all the card items and proceed if card is not empty
  // 3. calculate the total amount
  // 4. fetch address of the user
  // 5. to define computed field for formatted address on address model
  // 6. we will create order and order products
  // 7. create an event
  // 8. to empty the cart

  return await prismaClient.$transaction(async (tx) => {
    //#transaction is used for multiple queries, independent writes
    //$transaction API: pass a fnc that can contain user code including Prisma Client queries, non-Prisma code and other control flow to executed in transaction.
    //when the application reaches the end of the fnc, tx is committed to database, if it encounters and error along the way, the tx is rolled back(return db to some previous state).

    const cartItems = await tx.cartItem.findMany({
      where: {
        userId: req.user?.id,
      },
      include: {
        product: true,
      },
    });
    if (cartItems.length === 0) {
      return res.json({ message: "Cart is empty" }); //returning a message if cart is empty and not proceeding further
    }
    //if cart is not empty
    const price = cartItems.reduce((prev, current) => {
      return prev + current.quantity * +current.product.price;
    }, 0);
    const address = await tx.address.findFirst({
      where: {
        id: req.user?.defaultShippingAddress,
      },
    });
    const order = await tx.order.create({
      data: {
        userId: +req.user.id,
        netAmount: price,
        address: address?.formattedAddress,
        products: {
          create: cartItems.map((cart) => {
            return {
              productId: cart.productId,
              quantity: cart.quantity,
            };
          }),
        },
      },
    });
    //order is created, now we will create an event
    const orderEvent = await tx.orderEvent.create({
      data: {
        orderId: order.id,
      },
    });
    await tx.cartItem.deleteMany({
      where: {
        userId: req.user.id,
      },
    });
    return res.json(order);
  });
};

export const listOrders = async (req: Request, res: Response) => {
  const orders = await prismaClient.order.findMany({
    where: {
      userId: req.user?.id,
    },
  });
  res.json(orders);
};

export const cancelOrder = async (req: Request, res: Response) => {
  //1. wrap it inside transaction
  //2. check if user is cancelling his own order

  try {
    if (req.user?.id !== req.params.id) {
      throw new UnauthorizedException(
        "You are not authorized to delete this item",
        ErrorCode.UNAUTHORIZED
      );
    }
    return await prismaClient.$transaction(async (tx) => {
      const order = await prismaClient.order.update({
        where: {
          id: +req.params.id,
        },
        data: {
          status: "CANCELLED",
        },
      });
      await prismaClient.orderEvent.create({
        data: {
          orderId: order.id,
          status: "CANCELLED",
        },
      });
      res.json(order);
    });
  } catch (error) {
    throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await prismaClient.order.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
      include: {
        products: true,
        events: true,
      },
    });
    res.json(order);
  } catch (error) {
    throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
  }
};

export const listAllOrders = async (req: Request, res: Response) => {
  let whereClause = {};
  const status = req.query.status;
  if (status) {
    whereClause = {
      status,
    };
  }
  const orders = await prismaClient.order.findMany({
    where: whereClause,
    skip: +req.query.skip || 0,
    take: 5,
  });
  res.json(orders);
};

export const changeStatus = async (req: Request, res: Response) => {
  return await prismaClient.$transaction(async (tx) => {
    try {
      const order = await prismaClient.order.update({
        where: {
          id: +req.params.id,
        },
        data: {
          status: req.body.status,
        },
      });
      await prismaClient.orderEvent.create({
        data: {
          orderId: order.id,
          status: req.body.status,
        },
      });
      res.json(order);
    } catch (error) {
      throw new NotFoundException("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }
  });
};

export const listUserOrders = async (req: Request, res: Response) => {
  let whereClause: any = {
    userId: +req.params.id,
  };
  const status = req.params.status;
  if (status) {
    whereClause = {
      ...whereClause,
      status,
    };
  }
  const orders = await prismaClient.order.findMany({
    where: whereClause,
    skip: +req.query.skip || 0,
    take: 5,
  });
  res.json(orders);
};
