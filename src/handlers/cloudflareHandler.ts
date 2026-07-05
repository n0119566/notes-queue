/**
 * Deletes images from Cloudflare Images by their IDs.
 *
 * Mirrors the backend's `deleteImages` (notes-be) but uses the native `fetch`
 * API to avoid adding an HTTP client dependency to the queue service.
 *
 * Unlike the backend, failures are collected (not thrown) so that a single
 * missing/stale image cannot block the periodic note cleanup from proceeding.
 * A 404 is treated as success since the image is already gone.
 */
export async function deleteImages(imageIds: string[]): Promise<void> {
  if (imageIds.length === 0) {
    return;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const apiKey = process.env.CLOUDFLARE_API_KEY || "";

  if (!accountId || !apiKey) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_KEY environment variable");
  }

  const results = await Promise.allSettled(
    imageIds.map(async (key) => {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${key}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      // 404 means the image is already gone, which is fine for cleanup.
      if (!response.ok && response.status !== 404) {
        throw new Error(`Cloudflare delete failed for ${key}: ${response.status} ${response.statusText}`);
      }
    }),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failures.length > 0) {
    failures.forEach((failure) => console.error("❌ [deleteImages]", failure.reason));
    console.error(`❌ [deleteImages] Failed to delete ${failures.length}/${imageIds.length} images`);
  }
}
