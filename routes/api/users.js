// Dependencies
import bcrypt from 'bcryptjs';
import config from 'config';
import express from 'express';
import expressValidator from 'express-validator';
import gravatar from 'gravatar';
import jwt from 'jsonwebtoken';

// Models
import { User } from '../../models/Users.js';

//Init Express-Validator
const { check, validationResult } = expressValidator;

// Init express router
export const router = express.Router();

// @route     POST api/users
// @desc      Register user
// @access    Public
router.post(
  '/',
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  async (req, res) => {
    // Display validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      // Check if user exists in the database
      let user = await User.findOne({ email });
      if (user)
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });

      // Get gravatar of new user
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      // Create new Documnet from the User Model
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save document to database
      await user.save();

      // Authorise User
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
