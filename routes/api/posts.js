// Dependencies
import config from 'config';
import express from 'express';
import expressValidator from 'express-validator';

// Models
import { Post } from '../../models/Post.js';
import { Profile } from '../../models/Profile.js';
import { User } from '../../models/Users.js';

// Middleware
import { auth } from '../../middleware/auth.js';

//Init Express-Validator
const { check, validationResult } = expressValidator;

// Init Express Router
export const router = express.Router();

//================Posts=====================================

// @route     POST api/posts
// @desc      Create a post
// @access    Private
router.post(
  '/',
  auth,
  check('text', 'Post text is required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      // Find User
      const user = await User.findById(req.user.id).select('-password');

      //Create post object
      const postFields = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      // Save Post
      await postFields.save();
      res.json(postFields);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route     GET api/posts
// @desc      Get all posts
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/posts/:id
// @desc      Get post by ID
// @access    Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/posts/:id
// @desc      DELETE post by ID
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    //Check Authorization
    if (post.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not Authorized' });

    await post.remove();
    res.json({ msg: 'Post Removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    res.status(500).send('Server Error');
  }
});

//================Likes=====================================

// @route     Put api/posts/like/:id
// @desc      Like a post
// @access    Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Check if post already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    )
      return res.status(400).json({ msg: 'Post alreay liked' });

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     Put api/posts/unlike/:id
// @desc      unLike a post
// @access    Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Check if post is liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    )
      return res.status(400).json({ msg: 'Post has not been liked yet' });

    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//================Comments=====================================

// @route     POST api/comment/:id
// @desc      post a comment
// @access    Private
router.post(
  '/comment/:id',
  auth,
  check('text', 'You didnt write anything').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      // Find user and post
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      //Create comment object
      const commentFields = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      // Save Comment
      post.comments.unshift(commentFields);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route     DELETE api/comment/:id/:comment_id
// @desc      Delete a comment
// @access    Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    // Pull out comment
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    if (!comment)
      return res.status(404).json({ msg: 'Comment does not exist' });

    //User Check
    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'User not authorized' });

    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.params.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
