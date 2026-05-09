import { IEM, FrequencyResponsePoint } from '../types';

const AUTOEQ_REPOS = [
  { name: 'Hi End Portable', path: 'measurements/Hi%20End%20Portable/data/in-ear' },
  { name: 'Crinacle', path: 'measurements/Crinacle/data/in-ear' },
  { name: 'oratory1990', path: 'measurements/oratory1990/data/in-ear' },
  { name: 'Rtings', path: 'measurements/Rtings/data/in-ear' },
  { name: 'Super Review', path: 'measurements/Super%20Review/data/in-ear' },
  { name: 'Innerfidelity', path: 'measurements/Innerfidelity/data/in-ear' }
];

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master';

// Cache for IEM data to avoid unnecessary network requests
const iemDataCache = new Map<string, FrequencyResponsePoint[]>();

// Cache for the full list of IEMs
let cachedAllIems: IEM[] | null = null;

export async function fetchAllIemModels(): Promise<IEM[]> {
  if (cachedAllIems) return cachedAllIems;

  try {
    const allIems: IEM[] = [];
    
    // Fetch from all configured repositories in parallel
    const fetchPromises = AUTOEQ_REPOS.map(async (repo) => {
      try {
        const response = await fetch(`https://api.github.com/repos/jaakkopasanen/AutoEq/contents/${repo.path}`);
        if (!response.ok) return [];

        const files = await response.json();
        return files
          .filter((file: any) => file.name.endsWith('.csv'))
          .map((file: any) => {
            const fileName = file.name.replace('.csv', '');
            const parts = fileName.split(' ');
            const manufacturer = parts[0];
            const name = parts.slice(1).join(' ') || manufacturer;
            
            // Raw URL for this specific file
            const rawUrl = `${GITHUB_RAW_BASE}/${repo.path}/${encodeURIComponent(file.name)}`;

            return {
              id: `${repo.name}:${fileName}`, // Prefix with repo name to keep IDs unique
              name: `${name} (${repo.name})`,
              manufacturer: manufacturer,
              sourceUrl: rawUrl
            };
          });
      } catch (err) {
        console.error(`Error fetching from repo ${repo.name}:`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(repoIems => allIems.push(...repoIems));

    // Sort alphabetically by manufacturer
    allIems.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));

    cachedAllIems = allIems;
    return allIems;
  } catch (error) {
    console.error('Error fetching dynamic IEM list:', error);
    return POPULAR_IEMS; // Fallback to hardcoded list
  }
}

export const POPULAR_IEMS: IEM[] = [
  // Fallback / Initial list while dynamic fetch loads
  { id: 'Hi End Portable:64 Audio U12t', name: '64 Audio U12t', manufacturer: '64 Audio', sourceUrl: `${GITHUB_RAW_BASE}/measurements/Hi%20End%20Portable/data/in-ear/64%20Audio%20U12t.csv` },
  { id: 'Hi End Portable:Empire Ears Odin', name: 'Empire Ears Odin', manufacturer: 'Empire Ears', sourceUrl: `${GITHUB_RAW_BASE}/measurements/Hi%20End%20Portable/data/in-ear/Empire%20Ears%20Odin.csv` },
  { id: 'Hi End Portable:Sony IER-Z1R', name: 'Sony IER-Z1R', manufacturer: 'Sony', sourceUrl: `${GITHUB_RAW_BASE}/measurements/Hi%20End%20Portable/data/in-ear/Sony%20IER-Z1R.csv` },
  { id: 'Hi End Portable:Sennheiser IE 900', name: 'Sennheiser IE 900', manufacturer: 'Sennheiser', sourceUrl: `${GITHUB_RAW_BASE}/measurements/Hi%20End%20Portable/data/in-ear/Sennheiser%20IE%20900.csv` }
];

export async function fetchIEMData(iem: IEM): Promise<FrequencyResponsePoint[]> {
  // Check cache first
  if (iemDataCache.has(iem.id)) {
    return iemDataCache.get(iem.id)!;
  }

  try {
    const url = iem.sourceUrl;
    if (!url) throw new Error('No source URL for IEM');
    
    // 3. Fetch the data
    const response = await fetch(url);
    
    // 4. If it fails, log it and return mock data
    if (!response.ok) {
       console.warn(`Failed to fetch from ${url}.`);
       return generateMockData();
    }
    
    // 5. If successful, parse the text
    const text = await response.text();
    const data = parseMeasurementData(text);

    // Cache the result if we got valid data
    if (data.length > 0) {
      iemDataCache.set(iem.id, data);
    }

    return data;

  } catch (error) {
    console.error(`Error fetching IEM data for ${iem.name}:`, error);
    return generateMockData();
  }
}

function parseMeasurementData(content: string): FrequencyResponsePoint[] {
  const lines = content.split('\n');
  const data: FrequencyResponsePoint[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('*') || line.startsWith('freq')) continue;
    
    // Split by comma or whitespace
    const parts = line.split(/[,\s]+/).map(Number);
    if (parts.length >= 2 && !isNaN(parts[0])) {
      data.push({
        frequency: parts[0],
        raw: parts[1],
        target: parts[2] || 0 // Target might be missing in some files
      });
    }
  }
  
  return data;
}

// Ensure the demo always has data even if GitHub is down or paths change
function generateMockData(): FrequencyResponsePoint[] {
  const data: FrequencyResponsePoint[] = [];
  const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  
  // Logarithmic scale generation
  for (let f = 20; f <= 20000; f = f * 1.05) {
    // Simple V-shape curve simulation
    const raw = Math.sin(Math.log10(f) * 2) * 5 + 60;
    data.push({
      frequency: Math.round(f),
      raw: raw,
      target: 65 // Flat-ish target for reference
    });
  }
  return data;
}
