'use strict';
const { Validator } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 30],
        not (value) {
          if (value.match(/^[^a-zA-Z]/)) throw new Error('Username must start with a letter.');
          if (value.match(/[^0-9a-zA-Z-_]/g)) throw new Error('Username may only contain numbers 0-9, letters A-Z, under_score, or hy-phen');
        },
        isNotEmail (value) {
          if (Validator.isEmail(value)) {
            throw new Error('Cannot be an email.');
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 256],
        isEmail: true
      }
    },
    hashedPassword: {
      type: DataTypes.STRING.BINARY,
      allowNull: false,
      validate: {
        len: [60, 60]
      }
    }
  },
  {
    defaultScope: {
      attributes: {
        exclude: [
          'hashedPassword',
          'email',
          'createdAt',
          'updatedAt'
        ]
      }
    },
    scopes: {
      currentUser: {
        attributes: {
          exclude: [
            'hashedPassword',
            'createdAt',
            'updatedAt'
          ]
        }
      },
      loginUser: {
        attributes: {}
      }
    }
  });

  User.associate = function (models) {
    [
      models.Post,
      models.Heart
    ].forEach(model => User.hasMany(model, { foreignKey: 'userId' }));
    [
      { foreignKey: 'follower' },
      { foreignKey: 'following' }
    ].forEach(fkey => User.hasMany(models.Follow, fkey));
    [
      [models.User, { through: models.Follow, as: 'Followers', foreignKey: 'following', otherKey: 'follower' }],
      [models.User, { through: models.Follow, as: 'Following', foreignKey: 'follower', otherKey: 'following' }],
      [models.Post, { through: models.Heart, as: 'HeartedPosts', foreignKey: 'userId', otherKey: 'postId' }]
    ].forEach(map => User.belongsToMany(...map));
  };

  User.login = async function ({ identification, password }) {
    const { Op } = require('sequelize');
    const user = await User.scope('loginUser').findOne({
      where: {
        [Op.or]: {
          username: identification,
          email: identification
        }
      }
    });
    if (user && user.validatePassword(password)) {
      return await User.scope('currentUser').findByPk(user.id);
    }
  };

  User.signup = async function ({ username, email, password }) {
    const hashedPassword = bcrypt.hashSync(password);
    const user = await User.create({
      username,
      email,
      hashedPassword
    });
    return await User.scope('currentUser').findByPk(user.id);
  };

  User.prototype.toSafeObject = function () {
    return { id: this.id, username: this.username, email: this.email };
  };

  User.prototype.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.hashedPassword.toString());
  };

  User.prototype.isFollowing = async function (userObj) {
    return await this.hasFollowing(userObj);
  };

  User.prototype.heartPost = async function (postObj) {
    await postObj.increment('hearts');
    await this.addHeartedPost(postObj);
    return { result: 'like' };
  };

  User.prototype.unheartPost = async function (postObj) {
    await postObj.decrement('hearts');
    await this.removeHeartedPost(postObj);
    return { result: 'unlike' };
  };

  return User;
};
