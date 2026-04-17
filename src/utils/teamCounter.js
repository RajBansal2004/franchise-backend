const User = require('../models/User');

const getAllDownline = async (userId) => {
  const children = await User.find({ parentId: userId });

  let all = [...children];

  for (const child of children) {
    const sub = await getAllDownline(child._id);
    all = all.concat(sub);
  }

  return all;
};

const getTeamCount = async (userId) => {
  const all = await getAllDownline(userId);
  return all.length;
};

module.exports = { getTeamCount, getAllDownline };