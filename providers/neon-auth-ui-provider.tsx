'use client';

import { createAuthClient } from '@neondatabase/auth/next';
import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import React, { FC } from 'react';

type Props = {
  children: React.ReactNode;
};

const NeonAuthProviders: FC<Props> = ({ children }) => {
  const authClient = createAuthClient();
  return <NeonAuthUIProvider authClient={authClient}>{children}</NeonAuthUIProvider>;
};

export default NeonAuthProviders;
