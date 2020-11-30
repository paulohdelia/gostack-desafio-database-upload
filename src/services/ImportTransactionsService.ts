import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository } from 'typeorm';
import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import ValidateTransactionService from './ValidateTransactionService';

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const csvFilePath = filepath;

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);
    const lines: Array<{
      title: string;
      type: 'income' | 'outcome';
      value: number;
      category: string;
    }> = [];

    parseCSV.on('data', line => {
      const parseLine = {
        title: line[0],
        type: line[1],
        value: line[2],
        category: line[3],
      };

      lines.push(parseLine);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    await fs.promises.unlink(filepath);

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    async function createCategory(category_title: string): Promise<Category> {
      const newCategory = categoriesRepository.create({
        title: category_title,
      });

      await categoriesRepository.save(newCategory);

      return newCategory;
    }

    const transactions: Transaction[] = [];

    for (const line of lines) {
      const { type, value, category: categoryTitle, title } = line;
      const validateTransaction = new ValidateTransactionService();
      await validateTransaction.execute({ type, value });

      const findCategory = await categoriesRepository.findOne({
        where: { title: categoryTitle },
      });

      const category = findCategory || (await createCategory(categoryTitle));

      const transaction = transactionsRepository.create({
        title,
        type,
        value,
        category_id: category.id,
        category,
      });

      await transactionsRepository.save(transaction);

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
