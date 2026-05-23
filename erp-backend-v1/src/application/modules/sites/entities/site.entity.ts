/**
 * Site Entity
 * Represents a construction site or location where projects are executed
 */

export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_PREPARATION' | 'CLOSED';

export class SiteEntity {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  googleMapsLink: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus;
  area: number | null; // in square meters
  capacity: number | null; // max workers capacity
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  rowVersion: number;

  constructor(partial: Partial<SiteEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if site is active
   */
  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Check if site is closed
   */
  isClosed(): boolean {
    return this.status === 'CLOSED';
  }

  /**
   * Get full location string
   */
  getFullLocation(): string {
    const parts = [this.address, this.city, this.state, this.country].filter(
      Boolean,
    );
    return parts.join(', ');
  }

  /**
   * Check if site has GPS coordinates
   */
  hasCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * Get Google Maps URL
   */
  getMapUrl(): string | null {
    if (!this.hasCoordinates()) return null;
    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
  }

  /**
   * Convert to safe response object
   */
  toResponse() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      address: this.address,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      fullLocation: this.getFullLocation(),
      mapUrl: this.getMapUrl(),
      status: this.status,
      area: this.area,
      capacity: this.capacity,
      contactPerson: this.contactPerson,
      contactPhone: this.contactPhone,
      contactEmail: this.contactEmail,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      rowVersion: this.rowVersion,
    };
  }
}
