export class SiteResponseDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  fullLocation: string;
  mapUrl: string | null;
  status: string;
  area: number | null;
  capacity: number | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
  projects?: Array<{
    id: string;
    name: string;
    projectCode: string;
    status: string;
    plannedStartDate?: Date | null;
    actualStartDate?: Date | null;
    plannedEndDate?: Date | null;
    actualEndDate?: Date | null;
  }>;
}
