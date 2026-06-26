import DialogActions from '@/components/ui/dialog-actions';
import { ImageUploader } from '@/components/ui/image-uploader';
import SettingsDialog from '@/components/ui/settings-dialog';
import { ACCEPTED_IMAGE_TYPES, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@/constants';
import { updateProfileMediaAction } from '@/lib/actions/profile';
import { MediaKind } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { FC, useTransition } from 'react';
import { toast } from 'sonner';

type Props = {
  currentImageUrl?: string | null;
  kind: MediaKind;
  open: boolean;
  selectedFile?: File;
  onClose: () => void;
  onFileChange: (file?: File) => void;
};

const ChangeAvatarBio: FC<Props> = ({ currentImageUrl, kind, onClose, onFileChange, open, selectedFile }) => {
  const queryClient = useQueryClient();
  const [savingMedia, startSavingMedia] = useTransition();
  const isAvatar = kind === 'avatar';

  const submitMedia = async () => {
    startSavingMedia(async () => {
      if (!selectedFile) {
        toast.error('Choose and crop an image before uploading.');
        return;
      }

      const result = await updateProfileMediaAction({
        avatar: isAvatar ? selectedFile : undefined,
        cover: isAvatar ? undefined : selectedFile,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result?.success ?? 'Profile media updated.');
    });
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={open => !open && onClose()}
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
          onClear={() => onFileChange()}
          onImageCropped={onFileChange}
        />
        <DialogActions submitLabel={`Upload ${kind}`} submitLoading={savingMedia} submitDisabled={!selectedFile} />
      </form>
    </SettingsDialog>
  );
};

export default ChangeAvatarBio;
