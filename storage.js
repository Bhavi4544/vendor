
const readVendors = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const writeVendors = (vendors) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
    return true;
  } catch {
    return false;
  }
};

const nextReference = (vendors) => {
  const highest = vendors.reduce((max, { id }) => {
    return Math.max(max, Number(String(id).replace('VND-', '')) || 0);
  }, 1000);
  return `VND-${highest + 1}`;
};

const saveVendor = (data) => {
  const vendors = readVendors();
  const vendor = {
    ...data,
    id: nextReference(vendors),
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  return writeVendors([...vendors, vendor]) ? vendor : null;
};

const updateVendorStatus = (id, status) => {
  if (!STATUSES.includes(status)) return false;

  const vendors = readVendors();
  const index = vendors.findIndex((vendor) => vendor.id === id);
  if (index === -1) return false;

  vendors[index] = { ...vendors[index], status };
  return writeVendors(vendors);
};

const SAMPLE_VENDORS = [
  {
    companyName: 'Northlight Pictures', city: 'London', country: 'United Kingdom',
    website: 'https://northlight.example.com', contactPerson: 'Amelia Grant',
    email: 'amelia@northlight.example.com', phone: '+44 20 7946 0000',
    services: ['Compositing', 'Matchmove'], teamSize: 42, yearsExperience: 12,
    tools: 'Nuke, Maya, Houdini',
    summary: 'Feature film compositing and tracking, with a focus on invisible fixes and clean-up.',
    portfolioUrl: 'https://vimeo.com/northlight-reel', status: 'Approved', daysAgo: 21,
  },
  {
    companyName: 'Kaveri Frame Works', city: 'Chennai', country: 'India',
    website: 'https://kaveriframe.example.com', contactPerson: 'Vikram Rao',
    email: 'vikram@kaveriframe.example.com', phone: '+91 44 4000 1234',
    services: ['Rotoscopy', 'Paint'], teamSize: 65, yearsExperience: 9,
    tools: 'Silhouette, Nuke, After Effects',
    summary: 'High-volume roto and paint for episodic series with fast turnaround.',
    portfolioUrl: 'https://vimeo.com/kaveri-reel', status: 'Pending', daysAgo: 6,
  },
  {
    companyName: 'Blue Harbor Animation', city: 'Vancouver', country: 'Canada',
    website: '', contactPerson: 'Marcus Lee',
    email: 'marcus@blueharbor.example.com', phone: '+1 604 555 0142',
    services: ['Animation', '3D'], teamSize: 18, yearsExperience: 5,
    tools: 'Maya, Blender',
    summary: 'Character animation and creature work for commercials and streaming shows.',
    portfolioUrl: '', status: 'Pending', daysAgo: 3,
  },
  {
    companyName: 'Quarry Digital', city: 'Wellington', country: 'New Zealand',
    website: 'https://quarrydigital.example.com', contactPerson: 'Hana Whitaker',
    email: 'hana@quarrydigital.example.com', phone: '+64 4 555 0199',
    services: ['3D', 'Compositing', 'Other'], teamSize: 9, yearsExperience: 2,
    tools: 'Blender, Nuke',
    summary: '',
    portfolioUrl: 'https://vimeo.com/quarry-reel', status: 'Rejected', daysAgo: 1,
  },
];

const addSampleVendors = () => {
  const vendors = readVendors();
  const added = [];

  SAMPLE_VENDORS.forEach(({ daysAgo, ...sample }) => {
    const id = nextReference([...vendors, ...added]);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    added.push({ ...sample, id, createdAt });
  });

  return writeVendors([...vendors, ...added]);
};
