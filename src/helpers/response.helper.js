const responseTemplate = (data, message, errors, status) => {
  return {
    data,
    message,
    errors,
    status,
  };
};

module.exports = responseTemplate;