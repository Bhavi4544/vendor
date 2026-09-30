
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARACTERS = /^[+()\d\s.-]+$/;

const isBlank = (value) => String(value ?? '').trim() === '';

const normaliseUrl = (value) => {
  const url = String(value ?? '').trim();
  if (url === '') return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const isValidUrl = (value) => {
  try {
    const { protocol, hostname } = new URL(normaliseUrl(value));
    return ['http:', 'https:'].includes(protocol) && hostname.includes('.');
  } catch {
    return false;
  }
};

const isValidPhone = (value) => {
  const digitCount = value.replace(/\D/g, '').length;
  return PHONE_CHARACTERS.test(value) && digitCount >= 7 && digitCount <= 15;
};

const checks = {
  companyName: ({ companyName }) =>
    isBlank(companyName) && 'Enter your company name.',

  city: ({ city }) =>
    isBlank(city) && 'Enter the city your studio is based in.',

  country: ({ country }) =>
    isBlank(country) && 'Enter the country your studio is based in.',

  website: ({ website }) =>
    !isBlank(website) && !isValidUrl(website) &&
    'Enter a valid website address, like https://yourstudio.com.',

  contactPerson: ({ contactPerson }) =>
    isBlank(contactPerson) && 'Enter the name of a contact person.',

  email: ({ email }) => {
    if (isBlank(email)) return 'Enter a business email address.';
    if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address, like name@yourstudio.com.';
    return false;
  },

  phone: ({ phone }) => {
    if (isBlank(phone)) return 'Enter a phone number.';
    if (!isValidPhone(phone.trim())) return 'Enter a valid phone number with 7 to 15 digits. You can use +, spaces, brackets and dashes.';
    return false;
  },

  services: ({ services }) =>
    services.length === 0 && 'Select at least one VFX service.',

  teamSize: ({ teamSize }) => {
    if (isBlank(teamSize)) return 'Enter your team size.';
    if (!/^\d+$/.test(teamSize.trim()) || Number(teamSize) < 1) return 'Team size must be a whole number greater than 0.';
    return false;
  },

  yearsExperience: ({ yearsExperience }) =>
    !isBlank(yearsExperience) &&
    (!/^\d+(\.\d+)?$/.test(yearsExperience.trim()) || Number(yearsExperience) > 100) &&
    'Years of experience must be a number from 0 to 100.',

  tools: () => false, 

  summary: ({ summary }) =>
    summary.length > SUMMARY_MAX_LENGTH &&
    `Keep the summary under ${SUMMARY_MAX_LENGTH} characters.`,

  portfolioUrl: ({ portfolioUrl }) =>
    !isBlank(portfolioUrl) && !isValidUrl(portfolioUrl) &&
    'Enter a valid link, like https://vimeo.com/your-showreel.',
};

const FIELD_NAMES = Object.keys(checks);
const validateVendor = (values) => {
  const errors = {};

  for (const [field, check] of Object.entries(checks)) {
    const message = check(values);
    if (message) errors[field] = message;
  }

  return errors;
};
