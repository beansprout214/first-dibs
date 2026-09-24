function checkAdminPassword(req, res, next) {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Provided password is incorrect." });
  }

  next();
}

module.exports = checkAdminPassword;
