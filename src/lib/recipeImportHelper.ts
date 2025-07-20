interface TikTokOEmbedResponse {
  provider_name: string;
  title: string;
  thumbnail_url: string;
}

export async function getTikTokPreview(url: string): Promise<TikTokOEmbedResponse | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TikTokOEmbedResponse = await response.json();
    return  data;
  } catch (error) {
    console.error('Error fetching TikTok preview:', error);
    return null;
  }
}

// Convert image URL to File object
export async function urlToFile(url: string, filename: string = 'tiktok-preview.jpg'): Promise<File | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Create a File object from the blob
    const file = new File([blob], filename, {
      type: blob.type || 'image/jpeg',
      lastModified: Date.now()
    });
    
    return file;
  } catch (error) {
    console.error('Error converting URL to file:', error);
    return null;
  }
}