const { PrismaClient } = require('@prisma/client');
const responseTemplate = require('../helpers/response.helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Sentry = require("@sentry/node");
const userController = require('./users.controller');
const { transporter } = require('../libs/mailer');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    await userController.createUser(req, res);
    return;
  } catch (error) {
    const response = responseTemplate(null, 'internal server error', error.message, 500);
    Sentry.captureException(error);
    res.status(500).json(response);
    return;
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      const response = responseTemplate(null, 'Invalid email', null, 400);
      res.status(400).json(response);
      return;
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      const response = responseTemplate(null, 'Invalid password', null, 400);
      res.status(400).json(response);
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET_KEY
    );

    const response = responseTemplate(
      {
        user: {
          username: user.username,
          email: user.email,
        },
        token,
      },
      'success',
      null,
      200
    );
    res.status(200).json(response);
    return;
  } catch (error) {
    const response = responseTemplate(null, 'internal server error', error.message, 500);
    Sentry.captureException(error);
    res.status(500).json(response);
    return;
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email: userEmail } = req.body;
    const findUser = await prisma.users.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (findUser === null) {
      const response = responseTemplate(null, 'Email is not found or incorrect', null, 400);
      res.status(400).json(response);
      return;
    }

    const token = jwt.sign(
      {
        id: findUser.id,
        email: findUser.email,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    const mailOptions = {
      from: process.env.MAIL_SMTP,
      to: userEmail,
      subject: 'Reset your password',
      html: `You are receiving this because you (or someone else) have requested the reset of the password for your account. 
      Please click on the following link, http://localhost:8080/api/v1/auth/password_reset?token=${token}`,
    }

    await transporter.sendMail(mailOptions);
    
    const response = responseTemplate(null, 'Reset email has been sent to your email', null, 200);
    res.status(200).json(response);
    return;
  } catch (error) {
    const response = responseTemplate(null, 'internal server error', error.message, 500);
    Sentry.captureException(error);
    res.status(500).json(response);
    return;
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.query;

    const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    const response = responseTemplate(null, 'Password reset successfully', null, 200);

    req.io.emit('passwordReset', `Your password has been successfully reset`);

    res.status(200).json(response);
    return;
  } catch (error) {
    const response = responseTemplate(null, 'internal server error', error, 500);
    Sentry.captureException(error);
    res.status(500).json(response);
    return;
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
