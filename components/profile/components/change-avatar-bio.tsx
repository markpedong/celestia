import DialogActions from '@/components/ui/dialog-actions';
import { ImageUploader } from '@/components/ui/image-uploader';
import SettingsDialog from '@/components/ui/settings-dialog';
import { ACCEPTED_IMAGE_TYPES, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@/constants';
import { MediaKind } from '@/lib/types';
import { useGetProfile, useUpdateProfile, useUploadImages } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { FC, useState, useTransition } from 'react';
import { toast } from 'sonner';

type Props = {
  kind: MediaKind;
  open: boolean;
  onClose: () => void;
};

const ChangeAvatarBio: FC<Props> = ({ kind, onClose, open }) => {
  const queryClient = useQueryClient();
  const uploadImages = useUploadImages();
  const updateProfile = useUpdateProfile();
  const profile = useGetProfile().data?.data;
  const [selectedFile, setSelectedFile] = useState<File>();
  const [savingMedia, startSavingMedia] = useTransition();
  const isAvatar = kind === 'avatar';
  const currentImageUrl = isAvatar ? profile?.avatarUrl : profile?.coverUrl;
  const close = () => {
    setSelectedFile(undefined);
    onClose();
  };

  const submitMedia = async () => {
    startSavingMedia(async () => {
      if (!selectedFile) {
        toast.error('Choose and crop an image before uploading.');
        return;
      }

      const imageUrl = (await uploadImages.mutateAsync({
        files: [selectedFile],
        bucket: isAvatar ? 'profile-avatars' : 'profile-covers',
      }))[0];
      if (!imageUrl) return;

      const result = await updateProfile.mutateAsync(isAvatar ? { avatarUrl: imageUrl } : { coverUrl: imageUrl });
      if (!result.success) return;
      close();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    });
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={open => !open && close()}
      title={isAvatar ? 'Avatar' : 'Banner'}
      description='Upload an image to update your public profile.'
      contentClassName={isAvatar ? 'sm:max-w-md' : 'sm:max-w-2xl'}
    >
      <form
        onSubmit={event => {
          event.preventDefault();
          submitMedia();
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
          onClear={() => setSelectedFile(undefined)}
          onImageCropped={setSelectedFile}
        />
        <DialogActions submitLabel={`Upload ${kind}`} submitLoading={savingMedia} submitDisabled={!selectedFile} />
      </form>
    </SettingsDialog>
  );
};

export default ChangeAvatarBio;
