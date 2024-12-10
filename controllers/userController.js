const User = require("../models/User");
const Post = require('../models/Post');
const asyncHandler = require("express-async-handler");

// Get user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select('name email followersCount followingCount _id');

  if (!user) {
    return res.status(404).json({ message: "User not found." });

  }
  const posts = await Post.find({ user: userId }).select('caption image _id');

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    posts: posts, 
  });
});

// Update user profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.name = name || user.name;
  user.email = email || user.email;

  await user.save();

  res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
  });
});

// Follow or unfollow a user
 // Assuming you're using Mongoose models

// Follow/Unfollow User
exports.followUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(targetUser._id)) {
      // If already following, unfollow
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(currentUser._id);
    } else {
      // If not following, follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: 'Follow/Unfollow successful',
      following: currentUser.following.length,
      followers: targetUser.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error following/unfollowing user', error: err });
  }
};

// Check if the current user is following the target user
exports.isFollowing = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUser._id);
    res.status(200).json({ isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Error checking follow status', error: err });
  }
};
