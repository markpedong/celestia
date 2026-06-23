'use client';

import { STALE_TIME } from '@/constants';
import { getProfileByUserName } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, UserAttributes } from '@supabase/supabase-js';
import { useSession } from './useSession';

const getUserNameByAuth = (user?: Session['user']) => {
  const username = user?.user_metadata.username;
  return typeof username === 'string' ? username : user?.email?.split('@')[0] ?? '';
};

export const profileQueryKey = (username: string) => ['profile', username] as const;

export const useGetProfile = () => {
  const { user: authUser } = useSession();
  const username = getUserNameByAuth(authUser);

  return useQuery({
    queryKey: profileQueryKey(username),
    queryFn: () => getProfileByUserName({ username }),
    enabled: Boolean(username),
    staleTime: STALE_TIME,
  });
};

export const useUpdateAuthUser = () => {
  const { supabase } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['auth', 'user', 'update'],
    mutationFn: async (attributes: UserAttributes) => {
      const { data, error } = await supabase.auth.updateUser(attributes);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
