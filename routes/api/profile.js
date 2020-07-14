// Dependencies
import config from 'config';
import express from 'express';
import expressValidator from 'express-validator';
import request from 'request';

//Models
import { Profile } from '../../models/Profile.js';
import { User } from '../../models/Users.js';

//Middleware
import { auth } from '../../middleware/auth.js';

//Init Express-Validator
const { check, validationResult } = expressValidator;

// Init express router
export const router = express.Router();

//================Profile=====================================

// @route     POST api/profile
// @desc      Create user profile
// @access    Private
router.post(
  '/',
  auth,
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills are required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Create profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    profileFields.status = status;
    profileFields.skills = skills.split(',').map((skill) => skill.trim());
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;

    // Create social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      // Create Profile
      let profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route     PUT api/profile
// @desc      Update user profile
// @access    Private
router.put(
  '/',
  auth,
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills are required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Update profile object
    const profileFields = {};
    profileFields.status = status;
    profileFields.skills = skills.split(',').map((skill) => skill.trim());
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;

    // Update social object
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    try {
      // Update Profile
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      } else
        return res.status(400).json({ msg: 'The is no profile for this user' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route     GET api/profile/me
// @desc      Get current users profile
// @access    Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile)
      return res.status(400).json({ msg: 'The is no profile for this user' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/profile/user/:user_id
// @desc      Get profile by user ID
// @access    Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId')
      return res.status(400).json({ msg: 'Profile not found' });

    res.status(500).json('Server Error');
  }
});

// @route     GET api/profile
// @desc      Get all profiles
// @access    Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server Error');
  }
});

// @route     DELETE api/profile
// @desc      Delete all
// @access    Private
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User Deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server Error');
  }
});

//================Experience=====================================

// @route     POST api/profile/experience
// @desc      Add profile experience
// @access    Private
router.post(
  '/experience',
  auth,
  check('title', 'Job title is required').not().isEmpty(),
  check('company', 'Company Name is required').not().isEmpty(),
  check('from', 'Starting date is required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // Create expreience object
    const expFields = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    try {
      // Save experience object
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(expFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route     PUT api/profile/experience/:exp_id
// @desc      Update profile experience
// @access    Private
router.put(
  '/experience/:exp_id',
  auth,
  check('title', 'Job title is required').not().isEmpty(),
  check('company', 'Company Name is required').not().isEmpty(),
  check('from', 'Starting date is required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // Update expreience object
    const expFields = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    try {
      // Save experience object
      const profile = await Profile.findOne({ user: req.user.id });
      const removeIndex = profile.experience
        .map((item) => item.id)
        .indexOf(req.params.exp_id);
      profile.experience.splice(removeIndex, 1, expFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route     DELETE api/profile/experience/:exp_id
// @desc      Delete experience from profile
// @access    Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json('Server Error');
  }
});

//================Education=====================================

// @route     POST api/profile/education
// @desc      Add profile education
// @access    Private
router.post(
  '/education',
  auth,
  check('school', 'School name is required').not().isEmpty(),
  check('degree', 'Major is required').not().isEmpty(),
  check('fieldofstudy', 'Field of study is required').not().isEmpty(),
  check('from', 'Starting date is required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // Create education object
    const eduFields = {
      school: req.body.school,
      degree: req.body.degree,
      fieldofstudy: req.body.fieldofstudy,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    try {
      // Save education object
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(eduFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route     PUT api/profile/education/:edu_id
// @desc      Update profile education
// @access    Private
router.put(
  '/education/:edu_id',
  auth,
  check('school', 'School name is required').not().isEmpty(),
  check('degree', 'Major is required').not().isEmpty(),
  check('fieldofstudy', 'Field of study is required').not().isEmpty(),
  check('from', 'Starting date is required').not().isEmpty(),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // Update education object
    const eduFields = {
      school: req.body.school,
      degree: req.body.degree,
      fieldofstudy: req.body.fieldofstudy,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    try {
      // Save education object
      const profile = await Profile.findOne({ user: req.user.id });
      const removeIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.edu_id);
      profile.education.splice(removeIndex, 1, eduFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route     DELETE api/profile/education/:edu_id
// @desc      Delete education from profile
// @access    Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json('Server Error');
  }
});

//================GitHub=====================================

// @route     GET api/profile/github/:username
// @desc      Get user repos from Github
// @access    Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientID'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode != 200)
        return res.status(404).json({ msg: 'No Github profile found' });
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json('Server Error');
  }
});
