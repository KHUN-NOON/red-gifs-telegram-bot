import { Router } from "express";
import { container } from "tsyringe";
import { CategoryController } from "./category.controller.js";

const router = Router();

const categoryController = container.resolve(CategoryController);

router.get("/", (req, res, next) => categoryController.find(req, res, next));
router.get("/:id", (req, res, next) => categoryController.findById());

export default router;
