import { Router } from "express";
import test from "../controllers/test";

const testRoutes: Router = Router();

testRoutes.get("/", test);

export default testRoutes;
