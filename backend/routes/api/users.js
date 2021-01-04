const router = require('express').Router();
const asyncHandler = require('express-async-handler');

const { setTokenCookie } = require('../../utils/auth');
const { User, Post } = require('../../db/models');

router.post('/', require('../../utils/validation').validateSignup, asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  const user = await User.signup({ email, username, password });

  await setTokenCookie(res, user);

  return res.json({ user });
}));

router.get('/:username(\\D+\\w+)/posts', asyncHandler(async (req, res) => {
  const { username } = req.params;
  const posts = (await User.findOne({
    where: { username },
    include: Post
  })).Posts;
  res.json({ posts });
}));

module.exports = router;
