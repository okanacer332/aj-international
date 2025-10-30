export type ServiceDefinition = {
  id: string;
  tenantId: string;
  driverName: string;
  phone: string;
  vehiclePlate: string;
  vehicleCapacity: number;
};

// Form için (id opsiyonel)
export type ServiceDefinitionFormValues = Omit<
  ServiceDefinition,
  "id" | "tenantId"
>;