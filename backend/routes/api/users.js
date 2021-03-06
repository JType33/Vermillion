const router = require('express').Router();
const asyncHandler = require('express-async-handler');

const { setTokenCookie, requireAuth, restoreUser } = require('../../utils/auth');
const db = require('../../db/models');

router.post('/', require('../../utils/validation').validateSignup, asyncHandler(async (req, res, next) => {
  try {
    const { body: { email, password, username } } = req;
    const testUser = await db.User.findOne({ where: { username } });
    if (testUser) {
      const error = new Error('Sorry, that username is already taken.');
      error.status = 400;
      return next(error);
    }
    const user = await db.User.signup({ email, username, password });
    await user.addFollower(user.id);
    await user.addFollower(1);
    await user.addFollowing(1);

    setTokenCookie(res, user);

    return res.json({ user });
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      try {
        await db.ErrorLog.create({
          location: 'backend/routes/api/users',
          during: 'POST/',
          body: err.toString(),
          stack: err.stack,
          sql: err.sql && err.sql.toString(),
          sqlOriginal: err.original && err.original.toString()
        });
        const didMatch = err.toString().match(/SequelizeValidationError: Validation error:/);
        const errToThrow = didMatch
          ? err
          : new Error('Sorry, something went wrong when trying to create your account. Please refresh the page and try again.');
        errToThrow.status = didMatch ? 400 : 500;
        next(errToThrow);
      } catch (fatalWriteErr) {
        console.error('Fatal error when attempting to write error to Sequelize database.');
        console.error('App terminating to prevent potential catastrophic UX failure.');
        console.error(fatalWriteErr);
        process.exit();
      }
    } else {
      console.error('--------------------------------------------------------');
      console.error('----------Error occurred during POST/api/users----------');
      console.error(err);
      console.error('Short:', err.toString());
      return next(err);
    }
  }
}));

router.get('/hearts', requireAuth, asyncHandler(async (req, res) => {
  const { user: { id } } = req;
  const user = await db.User.findByPk(id);
  const hearts = await user.getHearts({ attributes: ['postId'] });
  res.json({ hearts });
}));

router.get('/:username(\\D+\\w+)/posts', restoreUser, asyncHandler(async (req, res) => {
  const { params: { username }, user } = req;
  const loggedInUser = user && await db.User.findByPk(user.id);
  const blogUser = await db.User.findOne({ where: { username } });
  if (!blogUser) return res.json({ posts: null });
  let posts = await blogUser.getPosts({ order: [['createdAt', 'ASC']] });
  loggedInUser && await posts.asyncForEach(async post => {
    post.isHearted = await loggedInUser.hasHeartedPost(post);
  });
  // This map is necessary to normalize data on each "post" object, to retain access to the "isHearted" value.
  posts = posts.map(({ id, userId, createdAt, updatedAt, isHearted, title, body }) => ({ id, userId, User: blogUser, createdAt, updatedAt, isHearted, title, body }));
  res.json({ posts });
}));

router.post('/:username(\\D+\\w+)/followers', requireAuth, asyncHandler(async (req, res) => {
  const { user: { id: userId }, params: { username } } = req;
  try {
    const following = await db.User.findOne({ where: { username } });
    const follower = await db.User.findByPk(userId);
    if (!following) return res.json({ success: false });
    if (!(await following.hasFollower(follower))) {
      following.addFollower(follower);
      return res.json({ success: true, result: 'follow' });
    } else if (await following.hasFollower(follower)) {
      following.removeFollower(follower);
      return res.json({ success: true, result: 'unfollow' });
    }
    return res.json({ success: false });
  } catch (err) {

  }
}));

router.get('/me/isFollowing/:username(\\D+\\w+)', requireAuth, asyncHandler(async (req, res) => {
  const {
    params: { username },
    user: { id: userId }
  } = req;
  const follower = await db.User.findByPk(userId);
  const following = await db.User.findOne({ where: { username } });
  const isFollowing = await follower.isFollowing(following);
  return res.json({ isFollowing });
}));

router.get('/:username(\\D+\\w+)', asyncHandler(async (req, res) => {
  const { params: { username } } = req;
  const user = await db.User.findOne({ where: { username } });
  if (!user) return res.json({ user: null });
  return res.json({ user: user.toSafeObject() });
}));

module.exports = router;
