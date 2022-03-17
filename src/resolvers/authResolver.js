import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const checkIsAuth = (isAuth) => {
  if (!isAuth) {
    throw new Error('Auth error');
  }
};

export const checkIsAdmin = (req) => {
  const authorizationHeaders = req.headers.authorization;
  if (!authorizationHeaders) {
    throw new Error('Access error');
  }

  const { isAdmin } = jwt.decode(authorizationHeaders.split(' ')[1]);

  if (!isAdmin) {
    throw new Error('Access error');
  }

  return true;
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
      const usersCount = await User.count({});

      const user = new User({
        email: args.userInput.email,
        password: hashedPassword,
        isAdmin: usersCount >= 1 ? false : true,
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
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    return {
      userId: user.id,
      isAdmin: user.isAdmin,
      token: `Bearer ${token}`,
      tokenExpiration: 1200,
      email: user.email,
    };
  },

  updateUser: async (args, req) => {
    checkIsAuth(req.isAuth);
    try {
      const existingUser = await User.findById(args.updateUserInput.id);

      const isEqual = await bcrypt.compare(args.updateUserInput.password, existingUser.password);
      if (!isEqual) {
        throw new Error('Current password is incorrect');
      }

      if (args.updateUserInput.newPassword !== args.updateUserInput.confirmNewPassword) {
        throw new Error('Password mismatch');
      }

      const id = args.updateUserInput.id;
      const hashedNewPassword = await bcrypt.hash(args.updateUserInput.newPassword, 12);

      await User.findByIdAndUpdate(id, {
        password: hashedNewPassword,
      });

      const result = await User.findById(id);
      return result;
    } catch (err) {
      throw err;
    }
  },

  user: async (args, req) => {
    const authorizationHeaders = req.headers.authorization;

    if (!authorizationHeaders) {
      throw Error('access denied')
    }

    const token = authorizationHeaders.split(' ')[1];

    const { email, userId: id, isAdmin, iat, exp } = jwt.decode(token);

    try {
      return {
        id,
        email,
        isAdmin,
        token,
        iat,
        exp
      };

    } catch (err) {
      throw err;
    }
  }
};
