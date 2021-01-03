const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const clean = require('sanitize-html');

const db = require('../../db/models');
const follow = require('../../db/models/follow');
const { requireAuth } = require('../../utils/auth');

router.post('/',
  requireAuth,
  asyncHandler(async ({ user, body }, res, next) => {
    if (!body || !body.content) {
      const err = new Error('Bad post POST');
      err.status = 401;
      err.title = 'Invalid request body or post content.';
      err.errors = ['Bad post POST'];
      return next(err);
    } else {
      try {
        let { title, postBody } = body.content;
        title = title || null;
        postBody = postBody || null;
        if (!(title ?? false)) {
          const err = new Error('Title cannot be blank');
          err.internalValidate = true;
          throw err;
        }
        if (!(postBody ?? false)) {
          const err = new Error('Body cannot be blank');
          err.internalValidate = true;
          throw err;
        }
        const newPost = await db.Post.create({
          title,
          body: clean(postBody),
          userId: user.id ?? 0,
          hearts: 0,
          reblogs: 0,
          isReply: false,
          isReblog: false
        });
        res.json(newPost);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Sequelize error');
          console.warn(err);
        }
        if (err.internalValidate) return next(err);
        return next(Error('Something went wrong. Please refresh the page and try again.'));
      }
    }
  }));

router.get('/following', requireAuth, asyncHandler(async ({ user: { id } }, res, next) => {
  try {
    const posts = [];
    db.User.findByPk(id, {
      include: {
        model: db.User,
        as: 'Following',
        include: db.Post
      }
    }).then(user => {
      user.Following.forEach(follow => follow.Posts.forEach(post => posts.push(post)));
      res.json({ posts });
    });
  } catch (sqlerr) {
    try {
      db.ErrorLog.create({
        location: 'backend/routes/api/posts',
        during: 'GET /following',
        body: sqlerr.toString()
      });
    } catch (writeErr) {
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('FAILED TO WRITE ERROR TO DATABASE!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error('!--------------------------------!');
      console.error(writeErr);
    }
    next(new Error('Sorry, something went wrong. Please refresh the page and try again.'));
  }
}));

module.exports = router;
