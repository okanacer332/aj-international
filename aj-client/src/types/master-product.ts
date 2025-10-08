export type MasterProduct = {
  id: string;
  tenantId: string;
  code: string; // Örn: ANO, ANO-CR
  name: string; // Örn: Ana Tekstil Malzemesi, ANO BABY (CR)
  description?: string; 
  
  parentProductId: string | null; // Ana ürünün ID'si (alt ürün ise)
  
  subProducts?: MasterProduct[]; 
  
  isExpanded?: boolean; 
};

export type MasterProductFormValues = {
  id?: string;
  name: string;
  code: string;
  description: string;
  
  parentProductId: string | null; 
};