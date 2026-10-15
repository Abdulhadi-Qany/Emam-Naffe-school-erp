import type { IFileStorage } from '@/src/application/ports/input/IFileStorage'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'

/**
 * Local-disk implementation of the IFileStorage port. Files are stored under
 * the configured base directory (default: `<cwd>/storage/uploads`) and served
 * under the `/api/files` route prefix in development. Swap for an S3/GCS
 * adapter by registering a different implementation in the container.
 */
export class LocalFileStorage implements IFileStorage {
  private readonly baseDir: string
  private readonly publicPrefix: string

  constructor(options?: { baseDir?: string; publicPrefix?: string }) {
    this.baseDir = options?.baseDir ?? path.join(process.cwd(), 'storage', 'uploads')
    this.publicPrefix = options?.publicPrefix ?? '/api/files'
  }

  public async upload(file: Buffer, filePath: string, _mimeType: string): Promise<string> {
    const safePath = this.sanitize(filePath)
    const absolute = path.join(this.baseDir, safePath)
    await fs.mkdir(path.dirname(absolute), { recursive: true })
    await fs.writeFile(absolute, file)
    return `${this.publicPrefix}/${safePath}`
  }

  public async delete(filePath: string): Promise<void> {
    const absolute = path.join(this.baseDir, this.sanitize(filePath))
    try {
      await fs.unlink(absolute)
    } catch {
      // Ignore missing files — deletes are idempotent.
    }
  }

  public getUrl(filePath: string): string {
    return `${this.publicPrefix}/${this.sanitize(filePath)}`
  }

  /** Blocks path traversal by collapsing any `..` segments. */
  private sanitize(filePath: string): string {
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '')
    return normalized.split(path.sep).join('/')
  }
}
