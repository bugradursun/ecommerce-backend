import { Router } from "express";
import {
  addAddress,
  changeUserRole,
  deleteAddress,
  getUserById,
  listAddress,
  listUsers,
  updateUser,
} from "../controllers/users";
import { errorHandler } from "../error-handler";
import authMiddleware from "../middlewares/auth";
import adminMiddleware from "../middlewares/admin";

const usersRoutes: Router = Router();

usersRoutes.post("/address", [authMiddleware], errorHandler(addAddress));
usersRoutes.delete(
  "/address/:id",
  [authMiddleware],
  errorHandler(deleteAddress)
);
usersRoutes.get("/address", [authMiddleware], errorHandler(listAddress));
usersRoutes.put("/update", [authMiddleware], errorHandler(updateUser));
usersRoutes.put(
  "/:id/role",
  [authMiddleware, adminMiddleware],
  errorHandler(changeUserRole)
);
usersRoutes.get(
  "/:id",
  [authMiddleware, adminMiddleware],
  errorHandler(getUserById)
);
usersRoutes.get(
  "/",
  [authMiddleware, adminMiddleware],
  errorHandler(listUsers)
);

export default usersRoutes;
