const responseTemplate = require('../../helpers/response.helper');
const jwt = require('jsonwebtoken');

const restrict = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      const response = responseTemplate(null, 'user unauthorized', null, 401)
      res.status(401).json(response);
      return;
    }

    const user = jwt.verify(authorization, process.env.JWT_SECRET);
    req.user = user;

    next();
  } catch (error) {
    const response = responseTemplate(null, 'user unauthorized', error.message, 401)
    res.status(401).json(response);
    return;
  }
};

module.exports = restrict;
