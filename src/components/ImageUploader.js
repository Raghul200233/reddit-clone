import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ImageUploader({ onImageUpload, currentImageUrl }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setImageUrl(data.imageUrl);
        onImageUpload(data.imageUrl);
        toast.success('Image uploaded!');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = (url) => {
    setImageUrl(url);
    onImageUpload(url);
    toast.success('Image URL added!');
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label
          htmlFor="imageUpload"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <span>📤</span>
          {uploading ? 'Uploading...' : 'Upload from Computer'}
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Or Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => handleUrlUpload(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full p-2 border rounded-md"
        />
      </div>

      {imageUrl && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Preview</label>
          <img src={imageUrl} alt="Preview" className="max-h-64 rounded-lg" />
        </div>
      )}
    </div>
  );
}