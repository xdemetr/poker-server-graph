import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const checkIsAuth = (isAuth) => {
  if (!isAuth) {
    throw new Error('Auth error');
  }
};

export const authResolver = {
  /**
   * Регистрация
   * @param args
   * @returns {Promise<{[p: string]: *}>}
   */
  createUser: async (args) => {
    try {
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser) {
        throw new Error('User exists already.');
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        email: args.userInput.email,
        password: hashedPassword,
      });

      const result = await user.save();

      return { ...result._doc, password: null, _id: result.id };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Авторизация
   * @param email
   * @param password
   * @returns {Promise<{tokenExpiration: number, isAdmin: ({type: Boolean | BooleanConstructor}|*), userId, token: (*)}>}
   */
  login: async ({ email, password }, req) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error('Нет такого пользователя');
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error('Неверный пароль');
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    return {
      userId: user.id,
      isAdmin: user.isAdmin,
      token: `Bearer ${token}`,
      tokenExpiration: 3600,
    };
  },
};
