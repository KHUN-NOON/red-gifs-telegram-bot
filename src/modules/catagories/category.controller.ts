import type { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class CategoryController {
  async find(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query;
      return res.status(200).json(query);
    } catch (error) {
      next(error);
    }
  }

  async findById() {}

  async create() {}

  async update() {}

  async delete() {}
}
