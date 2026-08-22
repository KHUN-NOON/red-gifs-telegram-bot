import { inject, injectable } from "tsyringe";
import { CategoryRepository } from "./category.repository.js";

@injectable()
export class CategoryService {
  constructor(
    @inject(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {}

  async find() {
    return await this.categoryRepository.find();
  }
}
