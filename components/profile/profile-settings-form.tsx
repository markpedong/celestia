'use client';

import { useState } from 'react';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';
import { useGetProfile } from '@/hooks/useQueries';
import { MediaKind } from '@/lib/types';
import ChangeDisplayName from './components/change-display-name';
import ChangeBio from './components/change-bio';
import ChangeAvatarBio from './components/change-avatar-bio';

const ProfileSettingsForm = () => {
  const profile = useGetProfile().data?.data;

  const { profileDetailsSchema } = useFormSchema();

  const [activeEditor, setActiveEditor] = useState<'displayName' | 'bio' | MediaKind | null>(null);
  const detailsForm = useFormValidate({
    schema: profileDetailsSchema,
    defaultValues: { displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' },
  });

  const openEditor = (editor: 'displayName' | 'bio' | MediaKind) => {
    if (editor === 'displayName' || editor === 'bio') {
      detailsForm.reset({ displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' });
    }

    setActiveEditor(editor);
  };

  const sections = [
    {
      title: 'Profile details',
      description: 'Control how you appear across Celestia.',
      items: [
        {
          title: 'Display Name',
          value: profile?.displayName || 'Not set',
          editor: 'displayName' as const,
        },
        {
          title: 'About / Bio',
          value: profile?.bio || 'Tell people a little about yourself.',
          editor: 'bio' as const,
        },
      ],
    },
    {
      title: 'Profile media',
      description: 'Choose the images people see on your profile.',
      items: [
        {
          title: 'Avatar',
          value: profile?.avatarUrl ? 'Image uploaded' : 'Not set',
          editor: 'avatar' as const,
        },
        {
          title: 'Banner',
          value: profile?.coverUrl ? 'Image uploaded' : 'Not set',
          editor: 'banner' as const,
        },
      ],
    },
  ];

  return (
    <div className='space-y-5'>
      {sections.map(section => (
        <section key={section.title} className='celestia-card space-y-5 p-5 md:p-6'>
          <div>
            <h2 className='text-base font-semibold'>{section.title}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>{section.description}</p>
          </div>
          <div className='divide-y divide-border rounded-lg border border-border'>
            {section.items.map(item => (
              <SettingsOptionRow
                key={item.editor}
                title={item.title}
                value={item.value}
                onClick={() => openEditor(item.editor)}
              />
            ))}
          </div>
        </section>
      ))}
      <ChangeDisplayName open={activeEditor === 'displayName'} setActiveEditor={setActiveEditor} />
      <ChangeBio open={activeEditor === 'bio'} setActiveEditor={setActiveEditor} />
      {(['avatar', 'banner'] as const).map(kind => (
        <ChangeAvatarBio key={kind} open={activeEditor === kind} kind={kind} onClose={() => setActiveEditor(null)} />
      ))}
    </div>
  );
};

export default ProfileSettingsForm;
