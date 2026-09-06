export interface CitizenReportInput {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCitizenReport(input: Partial<CitizenReportInput>): ValidationResult {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters.');
  }

  if (!input.description || input.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters.');
  }

  if (typeof input.latitude !== 'number' || typeof input.longitude !== 'number' || isNaN(input.latitude) || isNaN(input.longitude)) {
    errors.push('Valid geolocation coordinates are required.');
  }

  const validCategories = [
    'pothole', 'streetlight', 'water', 'waste', 'other',
    'education', 'healthcare', 'roads', 'electricity', 'sanitation',
    'public transport', 'skill development', 'sports', 'environment', 'safety'
  ];

  if (!input.category || !validCategories.includes(input.category.toLowerCase())) {
    errors.push('A recognized civic or development category is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
