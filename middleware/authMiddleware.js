const authMiddleware = (req, res, next) => {
    console.log('Authentication middleware invoked - Allowing all requests for now.');
    next();
  };
  
  module.exports = authMiddleware;