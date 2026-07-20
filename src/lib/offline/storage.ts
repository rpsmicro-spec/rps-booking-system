/**
 * Offline storage utilities using IndexedDB
 * Stores jobs, photos, and sync queue for offline functionality
 */

import type { JobFormValues } from "@/features/jobs/components/JobForm";

const DB_NAME = "rps-jobs-offline";
const DB_VERSION = 1;

interface OfflineJob {
  id: string; // Temporary ID for offline jobs
  data: JobFormValues; // Job form data
  photoIds: { before: string[]; after: string[] }; // IDs of photos stored in photos store
  invoiceFileId?: string; // ID of invoice file stored in photos store
  status: "pending" | "syncing" | "synced" | "error";
  createdAt: number;
  syncedAt?: number;
  error?: string;
}

interface RecentJob {
  jobId: string;
  jobNumber: string;
  customerName: string;
  viewedAt: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Jobs store
        if (!db.objectStoreNames.contains("jobs")) {
          const jobsStore = db.createObjectStore("jobs", { keyPath: "id" });
          jobsStore.createIndex("status", "status", { unique: false });
          jobsStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Recent jobs store
        if (!db.objectStoreNames.contains("recentJobs")) {
          const recentStore = db.createObjectStore("recentJobs", {
            keyPath: "jobId",
          });
          recentStore.createIndex("viewedAt", "viewedAt", { unique: false });
        }

        // Photos store (for offline photos)
        if (!db.objectStoreNames.contains("photos")) {
          db.createObjectStore("photos", { keyPath: "id" });
        }
      };
    });
  }

  // Offline Jobs Management
  async saveOfflineJob(
    jobData: JobFormValues,
    photos: { before: File[]; after: File[] },
    invoiceFile?: File | null
  ): Promise<string> {
    if (!this.db) await this.init();

    const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    // Save photos to photos store and get their IDs
    const beforePhotoIds: string[] = [];
    const afterPhotoIds: string[] = [];

    // Save before photos
    for (let i = 0; i < photos.before.length; i++) {
      const file = photos.before[i];
      // Use index and timestamp to ensure unique IDs even if saved quickly
      const photoId = `${id}-before-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 11)}`;
      await this.savePhoto(photoId, file);
      beforePhotoIds.push(photoId);
    }

    // Save after photos
    for (let i = 0; i < photos.after.length; i++) {
      const file = photos.after[i];
      // Use index and timestamp to ensure unique IDs even if saved quickly
      const photoId = `${id}-after-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 11)}`;
      await this.savePhoto(photoId, file);
      afterPhotoIds.push(photoId);
    }

    // Save invoice file (if any) to the photos store — it stores arbitrary
    // files (ArrayBuffer + type + name), not just images
    let invoiceFileId: string | undefined;
    if (invoiceFile) {
      invoiceFileId = `${id}-invoice-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      await this.savePhoto(invoiceFileId, invoiceFile);
    }

    const offlineJob: OfflineJob = {
      id,
      data: jobData,
      photoIds: {
        before: beforePhotoIds,
        after: afterPhotoIds,
      },
      invoiceFileId,
      status: "pending",
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["jobs"], "readwrite");
      const store = transaction.objectStore("jobs");
      const request = store.add(offlineJob);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get photos for an offline job
  async getOfflineJobPhotos(job: OfflineJob): Promise<{ before: File[]; after: File[] }> {
    const beforePhotos: File[] = [];
    const afterPhotos: File[] = [];

    for (const photoId of job.photoIds.before) {
      const file = await this.getPhoto(photoId);
      if (file) beforePhotos.push(file);
    }

    for (const photoId of job.photoIds.after) {
      const file = await this.getPhoto(photoId);
      if (file) afterPhotos.push(file);
    }

    return { before: beforePhotos, after: afterPhotos };
  }

  // Get the invoice file for an offline job (null if none was attached)
  async getOfflineJobInvoice(job: OfflineJob): Promise<File | null> {
    if (!job.invoiceFileId) return null;
    return this.getPhoto(job.invoiceFileId);
  }

  async getOfflineJobs(): Promise<OfflineJob[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["jobs"], "readonly");
      const store = transaction.objectStore("jobs");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingJobs(): Promise<OfflineJob[]> {
    const allJobs = await this.getOfflineJobs();
    return allJobs.filter((job) => job.status === "pending" || job.status === "error");
  }

  /**
   * Reset jobs stranded in "syncing" back to "pending". A job left in
   * "syncing" means a previous sync run died mid-flight (tab closed, phone
   * slept); without this reset it would never be retried and never counted
   * as pending. Only safe to call when no sync is running — the sync module
   * guards with a Web Lock.
   */
  async resetStuckSyncingJobs(): Promise<number> {
    const allJobs = await this.getOfflineJobs();
    const stuck = allJobs.filter((job) => job.status === "syncing");
    for (const job of stuck) {
      await this.updateOfflineJobStatus(job.id, "pending");
    }
    return stuck.length;
  }

  async updateOfflineJobStatus(
    id: string,
    status: OfflineJob["status"],
    error?: string
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["jobs"], "readwrite");
      const store = transaction.objectStore("jobs");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const job = getRequest.result;
        if (job) {
          job.status = status;
          if (status === "synced") {
            job.syncedAt = Date.now();
          }
          if (error) {
            job.error = error;
          }
          const updateRequest = store.put(job);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteOfflineJob(id: string): Promise<void> {
    if (!this.db) await this.init();

    // First get the job to delete associated photos
    const job = await new Promise<OfflineJob | null>((resolve, reject) => {
      const transaction = this.db!.transaction(["jobs"], "readonly");
      const store = transaction.objectStore("jobs");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (job) {
      // Delete associated photos and invoice file
      for (const photoId of [...job.photoIds.before, ...job.photoIds.after]) {
        await this.deletePhoto(photoId);
      }
      if (job.invoiceFileId) {
        await this.deletePhoto(job.invoiceFileId);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["jobs"], "readwrite");
      const store = transaction.objectStore("jobs");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Recent Jobs Management
  async addRecentJob(jobId: string, jobNumber: string, customerName: string): Promise<void> {
    if (!this.db) await this.init();

    const recentJob: RecentJob = {
      jobId,
      jobNumber,
      customerName,
      viewedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["recentJobs"], "readwrite");
      const store = transaction.objectStore("recentJobs");
      const request = store.put(recentJob); // Put will update if exists

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentJobs(limit: number = 10): Promise<RecentJob[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["recentJobs"], "readonly");
      const store = transaction.objectStore("recentJobs");
      const index = store.index("viewedAt");
      const request = index.openCursor(null, "prev"); // Descending order

      const results: RecentJob[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearRecentJobs(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["recentJobs"], "readwrite");
      const store = transaction.objectStore("recentJobs");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Photo Storage (for offline photos)
  async savePhoto(id: string, file: File): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const transaction = this.db!.transaction(["photos"], "readwrite");
        const store = transaction.objectStore("photos");
        const request = store.put({
          id,
          data: e.target?.result,
          type: file.type,
          name: file.name,
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async getPhoto(id: string): Promise<File | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["photos"], "readonly");
      const store = transaction.objectStore("photos");
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const blob = new Blob([result.data], { type: result.type });
          const file = new File([blob], result.name, { type: result.type });
          resolve(file);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhoto(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["photos"], "readwrite");
      const store = transaction.objectStore("photos");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
export type { OfflineJob, RecentJob };

