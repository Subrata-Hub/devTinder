const adminauth = (req, res, next) => {
  const token = 1234;

  const isAdminauthorize = token === 1234222;

  if (!isAdminauthorize) {
    res.status(401).send("Admin not authorize");
  } else {
    next();
  }
};

const userauth = (req, res, next) => {
  const token = 1234;

  const isUserauthorize = token === 123455;

  if (!isUserauthorize) {
    res.status(401).send("User not authorize");
  } else {
    next();
  }
};

module.exports = { adminauth, userauth };
