export const DISABILITY_CATEGORIES = [
  { value: "visually_impaired", label: "Visually Impaired" },
  { value: "hearing_impaired", label: "Hearing Impaired" },
  { value: "speech_impaired", label: "Speech Impaired" },
  { value: "locomotor", label: "Locomotor Disability" },
  { value: "intellectual", label: "Intellectual Disability" },
  { value: "multiple", label: "Multiple Disabilities" },
  { value: "other", label: "Other" },
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const MARITAL_STATUSES = [
  { value: "never_married", label: "Never Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

export function categoryLabel(v?: string | null) {
  return DISABILITY_CATEGORIES.find((c) => c.value === v)?.label ?? "—";
}

export const RELIGIONS = [
  "Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Jewish", "Spiritual", "Other", "Prefer not to say",
] as const;

export const EDUCATION_LEVELS = [
  "Below 10th", "10th Pass", "12th Pass", "Diploma", "ITI / Vocational",
  "Bachelor's Degree", "Master's Degree", "PhD / Doctorate", "Professional (CA / CS / MBBS)", "Other",
] as const;

export const EMPLOYMENT_TYPES = [
  "Government Job", "Private Job", "Self-employed / Business", "Freelancer",
  "Homemaker", "Student", "Retired", "Not Working", "Other",
] as const;

export const COUNTRIES = [
  "India","United States","United Kingdom","Canada","Australia","New Zealand",
  "United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Oman","Bahrain",
  "Singapore","Malaysia","Indonesia","Thailand","Philippines","Vietnam",
  "Japan","South Korea","China","Hong Kong",
  "Nepal","Bangladesh","Sri Lanka","Pakistan","Bhutan","Maldives","Afghanistan",
  "Germany","France","Italy","Spain","Portugal","Netherlands","Belgium",
  "Switzerland","Sweden","Norway","Denmark","Finland","Ireland","Poland",
  "Russia","Turkey","Greece","Austria","Czech Republic",
  "South Africa","Nigeria","Kenya","Egypt","Morocco","Ghana","Ethiopia",
  "Brazil","Mexico","Argentina","Chile","Colombia","Peru",
  "Israel","Jordan","Lebanon","Iran","Iraq",
  "Other",
] as const;

// India states + a curated list of common cities per state
export const INDIA_STATE_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Other"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Other"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Other"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Other"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Other"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Other"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Other"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala", "Other"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Other"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi", "Other"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur", "Other"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Other"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Other"],
  "Manipur": ["Imphal", "Other"],
  "Meghalaya": ["Shillong", "Other"],
  "Mizoram": ["Aizawl", "Other"],
  "Nagaland": ["Kohima", "Dimapur", "Other"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Other"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Other"],
  "Sikkim": ["Gangtok", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Other"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Other"],
  "Tripura": ["Agartala", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Noida", "Ghaziabad", "Meerut", "Other"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Other"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Other"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Other"],
  "Ladakh": ["Leh", "Kargil", "Other"],
  "Puducherry": ["Puducherry", "Other"],
  "Chandigarh": ["Chandigarh", "Other"],
  "Andaman and Nicobar Islands": ["Port Blair", "Other"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Other"],
  "Lakshadweep": ["Kavaratti", "Other"],
};

export const INDIA_STATES = Object.keys(INDIA_STATE_CITIES);
