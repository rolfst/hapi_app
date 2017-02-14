export const createAttachmentUpload = (upload) => ({ path: `/attachment/${upload.name}`,
  stream: upload.stream });
