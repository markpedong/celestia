import * as z from 'zod';

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

  const changePasswordInital = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  return {
    changePasswordSchema,
    changePasswordInital
  };
};

export default useFormSchema;
