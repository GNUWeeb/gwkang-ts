import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { BotHelpers } from './strings';
import { tmpdir } from "os";
import { join } from "path";


export const downloadFileToTemp = async (url: string, filename?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const tempFileName = filename || path.basename(url);
    const tempFilePath = path.join(tempDir, tempFileName);

    const file = fs.createWriteStream(tempFilePath);
    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get file: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => resolve(tempFilePath)); // Close and resolve the path
        });
      })
      .on('error', err => {
        fs.unlink(tempFilePath, () => reject(err)); // Delete the file on error
      });

    file.on('error', err => {
      fs.unlink(tempFilePath, () => reject(err)); // Delete the file on error
    });
  });
};

export const createTempFileWithContent = async (content: string): Promise<string> => {
  // Generate a unique temporary file path
  const tempFilePath = join(tmpdir(), `tempfile-${Date.now()}.txt`);

  try {
    // Write the content to the temporary file
    await fs.writeFile(tempFilePath, content, "utf8", (err) => {
      console.log(err)
    });
    console.log(`Temporary file created at: ${tempFilePath}`);

    // Return the file path for usage
    return tempFilePath;
  } finally {
    // Clean up: Remove the file after use
    setTimeout(async () => {
      try {
        await fs.unlink(tempFilePath, (err) => {
          if (err) throw err;
          console.log('path/file.txt was deleted');
        });
        console.log(`Temporary file deleted: ${tempFilePath}`);
      } catch (error) {
        console.error(`Error deleting temporary file: ${error.message}`);
      }
    }, 5000); // Adjust the delay as needed (e.g., 5000ms = 5 seconds)
  }
};


export class FileStorage {
  private storageDir: string;

  constructor(storageDir: string) {
    this.storageDir = storageDir;

    // Ensure the storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Store a file from a Buffer.
   * @param fileName The name of the file to store.
   * @param buffer The Buffer containing file data.
   */
  public async storeFile(fileName: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.storageDir, fileName);
    return fs.promises.writeFile(filePath, buffer);
  }

  public async storeFileRand(buffer: Buffer) {
    let fileName: string = BotHelpers.genRandomFileName("result.png");
    await this.storeFile(fileName, buffer)

    const filePath = path.join(this.storageDir, fileName)
    return filePath;
  }

  /**
   * Remove a stored file.
   * @param fileName The name of the file to remove.
   */
  public async removeFile(fileName: string): Promise<void> {
    if (fs.existsSync(fileName)) {
      return fs.promises.unlink(fileName);
    } else {
      throw new Error(`File "${fileName}" does not exist.`);
    }
  }
}