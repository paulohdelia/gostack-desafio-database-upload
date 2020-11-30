import { getCustomRepository, getRepository } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import ValidateTransactionService from './ValidateTransactionService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);

    const validateTransaction = new ValidateTransactionService();
    await validateTransaction.execute({ type, value });

    const categoriesRepository = getRepository(Category);
    const findCategory = await categoriesRepository.findOne({
      where: { title: categoryTitle },
    });

    async function createCategory(category_title: string): Promise<Category> {
      const newCategory = categoriesRepository.create({
        title: category_title,
      });

      await categoriesRepository.save(newCategory);

      return newCategory;
    }

    const category = findCategory || (await createCategory(categoryTitle));

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: category.id,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
