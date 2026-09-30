const form = document.querySelector('#vendor-form');
const formView = document.querySelector('#form-view');
const successView = document.querySelector('#success-view');
const servicesGroup = document.querySelector('#services-group');
const summaryField = document.querySelector('#summary');
const summaryCount = document.querySelector('#summary-count');
const errorSummary = document.querySelector('#error-summary');
const errorSummaryTitle = document.querySelector('#error-summary-title');
const errorSummaryList = document.querySelector('#error-summary-list');
const saveError = document.querySelector('#save-error');

const chipTemplate = document.querySelector('#chip-template');
const errorItemTemplate = document.querySelector('#error-item-template');

const TEXT_FIELDS = [
  'companyName', 'city', 'country', 'website',
  'contactPerson', 'email', 'phone',
  'teamSize', 'yearsExperience', 'tools',
  'summary', 'portfolioUrl',
];

let hasTriedSubmit = false;

//Setup

const renderServiceOptions = () => {
  SERVICES.forEach((service) => {
    const chip = chipTemplate.content.cloneNode(true);
    chip.querySelector('input').value = service;
    chip.querySelector('.chip__text').textContent = service;
    servicesGroup.append(chip);
  });
};

const watchSections = () => {
  const links = [...document.querySelectorAll('.steps a')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
        if (isCurrent) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-25% 0px -60% 0px' });

  sections.forEach((section) => observer.observe(section));
};

//Reading and preparing the form data

const getFormValues = () => {
  const data = new FormData(form);
  const textValues = Object.fromEntries(
    TEXT_FIELDS.map((name) => [name, String(data.get(name) ?? '').trim()])
  );

  return { ...textValues, services: data.getAll('services') };
};

const toVendorRecord = (values) => ({
  ...values,
  website: normaliseUrl(values.website),
  portfolioUrl: normaliseUrl(values.portfolioUrl),
  teamSize: Number(values.teamSize),
  yearsExperience: values.yearsExperience === '' ? null : Number(values.yearsExperience),
});

//Showing errors

const setFieldError = (name, message) => {
  const field = form.querySelector(`[data-field="${name}"]`);
  const errorElement = document.querySelector(`#${name}-error`);
  if (!field || !errorElement) return;

  field.classList.toggle('field--invalid', Boolean(message));
  errorElement.textContent = message ?? '';
  errorElement.hidden = !message;

  field.querySelectorAll('input, textarea').forEach((control) => {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
};

const showFieldErrors = (errors) => {
  FIELD_NAMES.forEach((name) => setFieldError(name, errors[name]));
};

const showErrorSummary = (errors) => {
  const fieldsWithErrors = FIELD_NAMES.filter((name) => errors[name]);

  errorSummary.hidden = fieldsWithErrors.length === 0;
  if (fieldsWithErrors.length === 0) return;

  const count = fieldsWithErrors.length;
  errorSummaryTitle.textContent = `Fix ${count} ${count === 1 ? 'problem' : 'problems'} to submit your registration`;

  const items = fieldsWithErrors.map((name) => {
    const item = errorItemTemplate.content.cloneNode(true);
    const link = item.querySelector('a');
    link.textContent = errors[name];
    link.dataset.field = name;
    return item;
  });

  errorSummaryList.replaceChildren(...items);
};

const focusField = (name) => {
  const control = form.querySelector(`[data-field="${name}"] :is(input, textarea)`);
  if (!control) return;

  control.scrollIntoView({ block: 'center' });
  control.focus({ preventScroll: true });
};

const refreshErrors = () => {
  const errors = validateVendor(getFormValues());
  showFieldErrors(errors);
  showErrorSummary(errors);
  return errors;
};


const showConfirmation = (vendor) => {
  document.querySelector('#success-reference').textContent = vendor.id;
  document.querySelector('#success-company').textContent = vendor.companyName;
  document.querySelector('#success-services').textContent = vendor.services.join(', ');
  document.querySelector('#success-email').textContent = vendor.email;
  document.querySelector('#success-date').textContent =
    new Date(vendor.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });

  formView.hidden = true;
  successView.hidden = false;
  document.title = 'Registration received | Vendor Roster';

  window.scrollTo(0, 0);
  document.querySelector('#success-title').focus({ preventScroll: true });
};

const showFormAgain = () => {
  form.reset();
  successView.hidden = true;
  formView.hidden = false;
  document.title = 'Register your studio | Vendor Roster';

  window.scrollTo(0, 0);
  document.querySelector('#companyName').focus();
};


const updateSummaryCount = () => {
  summaryCount.textContent = `${summaryField.value.length} / ${SUMMARY_MAX_LENGTH}`;
};

const handleSubmit = (event) => {
  event.preventDefault();
  hasTriedSubmit = true;
  saveError.hidden = true;

  const errors = refreshErrors();
  if (Object.keys(errors).length > 0) {
    errorSummary.scrollIntoView({ block: 'start' });
    errorSummary.focus({ preventScroll: true });
    return;
  }

  const vendor = saveVendor(toVendorRecord(getFormValues()));
  if (!vendor) {
    saveError.hidden = false;
    saveError.scrollIntoView({ block: 'start' });
    return;
  }

  showConfirmation(vendor);
};

const handleReset = () => {
  hasTriedSubmit = false;
  saveError.hidden = true;
  showFieldErrors({});
  showErrorSummary({});
  
  setTimeout(updateSummaryCount, 0);
};

const handleFieldChange = () => {
  if (hasTriedSubmit) refreshErrors();
};

errorSummary.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-field]');
  if (!link) return;

  event.preventDefault();
  focusField(link.dataset.field);
});

form.addEventListener('submit', handleSubmit);
form.addEventListener('reset', handleReset);
form.addEventListener('input', handleFieldChange);
form.addEventListener('change', handleFieldChange);
summaryField.addEventListener('input', updateSummaryCount);
document.querySelector('#register-another').addEventListener('click', showFormAgain);

renderServiceOptions();
watchSections();
