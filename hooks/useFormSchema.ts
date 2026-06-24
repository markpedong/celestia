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
  };
};

export default useFormSchema;
