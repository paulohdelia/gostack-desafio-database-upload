import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  value: number;
  type: 'income' | 'outcome';
}

class ValidateTransactionService {
  public async execute({ value, type }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionRepository);

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (total < value) {
        throw new AppError('Insufficient money to complete the transaction.');
      }
    }
  }
}

export default ValidateTransactionService;
