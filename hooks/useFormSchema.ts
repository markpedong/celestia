import * as z from 'zod';
import {
  commentSchema,
  communitySettingsSchema,
  createCommunitySchema,
  deleteAccountSchema,
  editPostSchema,
  passwordRecoverySchema,
  passwordSchema,
  postSchema,
  profileDetailsSchema,
  profileMediaSchema,
  sensitiveSettingSchema,
  setPasswordSchema,
} from '@/lib/form-schemas';

const useFormSchema = () => {
  const profileSettingsSchema = z.object({
    userName: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(28, 'Username must be 28 characters or fewer.')
      .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, or underscores.'),
    displayName: z.string().trim().max(80, 'Display name must be 80 characters or fewer.'),
    bio: z.string().trim().max(500, 'About must be 500 characters or fewer.'),
  });

  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, 'Enter your current password.'),
      newPassword: z.string().min(6, 'Your new password must be at least 6 characters.'),
      confirmPassword: z.string(),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: 'New passwords do not match.',
      path: ['confirmPassword'],
    });

  const changePasswordInitial = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  return {
    commentSchema,
    communitySettingsSchema,
    createCommunitySchema,
    changePasswordSchema,
    changePasswordInitial,
    deleteAccountSchema,
    editPostSchema,
    passwordRecoverySchema,
    passwordSchema,
    postSchema,
    profileDetailsSchema,
    profileMediaSchema,
    sensitiveSettingSchema,
    setPasswordSchema,
    profileSettingsSchema
  };
};

export default useFormSchema;
