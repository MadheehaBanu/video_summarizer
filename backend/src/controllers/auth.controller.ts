import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserById,
  updateUserProfile,
  changePassword
} from '../services/auth.service.js';
import { isDatabaseConnected } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Validation rules
 */
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * Register controller
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      throw createError('Authentication requires database connection. Please configure MongoDB.', 503);
    }

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: errors.array()
        }
      });
    }

    const { email, password, name } = req.body;

    const { user, tokens } = await registerUser(email, password, name);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login controller
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      throw createError('Authentication requires database connection. Please configure MongoDB.', 503);
    }

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: errors.array()
        }
      });
    }

    const { email, password } = req.body;

    const { user, tokens } = await loginUser(email, password);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          lastLogin: user.lastLogin
        },
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      throw createError('Authentication requires database connection', 503);
    }

    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token is required', 400);
    }

    const tokens = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user controller
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const user = await getUserById(req.user.userId);

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update profile controller
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { name, email } = req.body;

    const user = await updateUserProfile(req.user.userId, { name, email });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password controller
 */
export const changeUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Both current and new passwords are required', 400);
    }

    if (newPassword.length < 6) {
      throw createError('New password must be at least 6 characters', 400);
    }

    await changePassword(req.user.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
