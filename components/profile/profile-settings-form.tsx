'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfileMediaAction } from '@/lib/actions/profile';
import DialogActions from '@/components/ui/dialog-actions';
import SettingsDialog from '@/components/ui/settings-dialog';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import { ACCEPTED_IMAGE_TYPES, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@/constants';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';
import { useGetProfile } from '@/hooks/useQueries';
import { ImageUploader } from '@/components/ui/image-uploader';
import { MediaKind } from '@/lib/types';
import ChangeDisplayName from './components/change-display-name';
import ChangeBio from './components/change-bio';

const ProfileSettingsForm = () => {
  const queryClient = useQueryClient();
  const profile = useGetProfile().data?.data;

  const { profileDetailsSchema } = useFormSchema();

  const [savingMedia, startSavingMedia] = useTransition();
  const [activeEditor, setActiveEditor] = useState<'displayName' | 'bio' | MediaKind | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Partial<Record<MediaKind, File>>>({});
  const detailsForm = useFormValidate({
    schema: profileDetailsSchema,
    defaultValues: { displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' },
  });

  const clearSelectedMedia = (kind: MediaKind) => {
    setSelectedMedia(current => {
      const next = { ...current };
      delete next[kind];
      return next;
    });
  };

  const openEditor = (editor: 'displayName' | 'bio' | MediaKind) => {
    if (editor === 'displayName' || editor === 'bio') {
      detailsForm.reset({ displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' });
    }

    if (editor === 'avatar' || editor === 'banner') clearSelectedMedia(editor);
    setActiveEditor(editor);
  };

  const closeEditor = () => {
    if (activeEditor === 'avatar' || activeEditor === 'banner') clearSelectedMedia(activeEditor);
    setActiveEditor(null);
  };

  const submitMedia = async (kind: MediaKind) => {
    startSavingMedia(async () => {
      const mediaFile = selectedMedia[kind];
      if (!mediaFile) {
        toast.error('Choose and crop an image before uploading.');
        return;
      }

      const result = await updateProfileMediaAction({
        avatar: kind === 'avatar' ? mediaFile : undefined,
        cover: kind === 'banner' ? mediaFile : undefined,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      closeEditor();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result?.success ?? 'Profile media updated.');
    });
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
      {(['avatar', 'banner'] as const).map(kind => {
        const isAvatar = kind === 'avatar';
        const currentImageUrl = isAvatar ? profile?.avatarUrl : profile?.coverUrl;
        return (
          <SettingsDialog
            key={kind}
            open={activeEditor === kind}
            onOpenChange={open => !open && closeEditor()}
            title={isAvatar ? 'Avatar' : 'Banner'}
            description='Upload an image to update your public profile.'
            contentClassName={isAvatar ? 'sm:max-w-md' : 'sm:max-w-2xl'}
          >
            <form
              onSubmit={event => {
                event.preventDefault();
                submitMedia(kind);
              }}
              className='space-y-4'
              noValidate
            >
              <ImageUploader
                key={`${kind}-${currentImageUrl ?? 'empty'}`}
                acceptedFileTypes={IMAGE_MIME_TYPES.filter(type => ACCEPTED_IMAGE_TYPES.has(type))}
                aspectRatio={isAvatar ? 1 : 3}
                disabled={savingMedia}
                initialImageUrl={currentImageUrl}
                maxSize={MAX_IMAGE_BYTES}
                outputWidth={isAvatar ? 800 : 1600}
                outputHeight={isAvatar ? 800 : 533}
                previewLabel={isAvatar ? 'avatar' : 'banner'}
                onClear={() => clearSelectedMedia(kind)}
                onImageCropped={file => setSelectedMedia(current => ({ ...current, [kind]: file }))}
              />
              <DialogActions
                submitLabel={`Upload ${kind}`}
                submitLoading={savingMedia}
                submitDisabled={!selectedMedia[kind]}
              />
            </form>
          </SettingsDialog>
        );
      })}
    </div>
  );
};

export default ProfileSettingsForm;
