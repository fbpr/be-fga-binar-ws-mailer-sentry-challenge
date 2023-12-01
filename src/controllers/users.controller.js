const { PrismaClient } = require('@prisma/client');
const responseTemplate = require('../helpers/response.helper');
const bcrypt = require('bcrypt');
const Sentry = require('@sentry/node');
const prisma = new PrismaClient();

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      username,
      email,
      password: hashedPassword,
    };

    const existUser = await prisma.users.findUnique({ where: { email } });
    if (existUser) {
      const response = responseTemplate(null, 'User already exists', null, 400);
      res.status(400).json(response);
      return;
    }

    const { id } = await prisma.users.create({
      data: payload,
    });

    const response = responseTemplate({ id }, 'success', null, 201);

    req.io.emit('welcome', `Welcome, ${username}. Your account has been successfully registered`);

    res.status(201).json(response);
    return;
  } catch (error) {
    const response = responseTemplate(null, 'internal server error', error.message, 500);
    Sentry.captureException(error);
    res.status(500).json(response);
    return;
  }
};

module.exports = {
  createUser,
};
