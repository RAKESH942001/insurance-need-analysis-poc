import { CustomerProfile } from '../models/types';
import { CustomerService } from '../repositories/customerRepository';

export class ClientService {
  /**
   * Fetch all client profiles (from PostgreSQL 17 or resilient in-memory fallback)
   */
  public static async getAllClients(): Promise<CustomerProfile[]> {
    return await CustomerService.getAllClients();
  }

  /**
   * Fetch single client profile by ID
   */
  public static async getClientById(id: string): Promise<CustomerProfile | null> {
    return await CustomerService.getClientById(id);
  }

  /**
   * Save (create or update) a client profile
   */
  public static async saveClient(profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    return await CustomerService.saveClient(profile);
  }

  /**
   * Update client profile by ID
   */
  public static async updateClient(id: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
    return await CustomerService.updateClient(id, profile);
  }

  /**
   * Delete client profile by ID
   */
  public static async deleteClient(id: string): Promise<boolean> {
    return await CustomerService.deleteClient(id);
  }

  /**
   * Reset default sample profiles
   */
  public static async resetToDefault(): Promise<CustomerProfile[]> {
    return await CustomerService.resetToDefault();
  }

  /**
   * Returns current active storage mode
   */
  public static getStorageMode(): 'POSTGRESQL' | 'MEMORY_FALLBACK' {
    return CustomerService.getStorageMode();
  }
}
