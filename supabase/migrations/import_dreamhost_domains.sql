-- Import Dreamhost domains from CSV
-- This creates a single "Dreamhost" entry with all domains stored as JSON in the details field

INSERT INTO public.operations (
  category,
  title,
  description,
  details,
  cost,
  url,
  created_at,
  updated_at
) VALUES (
  'Hosting and Domains',
  'Dreamhost',
  NULL,
  $json$
[
  {"name": "beaconhillce.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-12-01", "notes": ""},
  {"name": "beaconhillcpe.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-12-01", "notes": ""},
  {"name": "beaconhilleducation.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-02-03", "notes": ""},
  {"name": "beaconhilleducators.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-02-03", "notes": ""},
  {"name": "beaconhillfinancialeducators.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-02-03", "notes": ""},
  {"name": "bhfe.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-11-30", "notes": ""},
  {"name": "bhfe.courses", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-03-29", "notes": ""},
  {"name": "emmyfreed.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-09-14", "notes": ""},
  {"name": "islafreed.com", "cost": "", "isHosted": "No", "autoRenew": "Yes", "expirationDate": "2026-09-14", "notes": ""}
]
$json$,
  NULL,
  'https://www.dreamhost.com/',
  NOW(),
  NOW()
);

