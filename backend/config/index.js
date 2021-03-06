module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  db: {
    username: process.env.DB_FROGGY,
    password: process.env.DB_FRESH,
    database: process.env.DB_KRISPY,
    host: process.env.DB_KREME,
  },
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN)
  }
};
