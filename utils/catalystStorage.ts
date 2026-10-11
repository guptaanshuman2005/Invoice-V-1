import { isCatalystConfigured, catalystConfig } from '../catalyst';

/**
 * Upload files (company logos, signatures, documents) to Zoho Catalyst File Store
 */
export const uploadFileToCatalyst = async (
  file: File,
  folderName: string = 'company-assets',
  customPath?: string
): Promise<string | null> => {
  if (!isCatalystConfigured) {
    console.warn('Catalyst is not configured. Falling back to local data URL.');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('code', file);
    if (customPath) {
      formData.append('fileName', customPath);
    }

    const response = await fetch(
      `${catalystConfig.projectDomain}/baas/v1/project/${catalystConfig.projectId}/folder/${folderName}/file`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      console.warn('Remote file upload not available, falling back to local data URL.');
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    const result = await response.json();
    return result.data?.file_download_url || result.data?.url || null;
  } catch (error) {
    console.warn('Falling back to local data URL due to error:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
};
