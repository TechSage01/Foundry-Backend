import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export const uploadFile = async (
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const result = await imagekit.upload({
    file,
    fileName,
    folder: "/foundry/uploads",
    useUniqueFileName: true,
  });

  return result.url;
};