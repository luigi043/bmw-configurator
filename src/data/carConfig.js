// Single source of truth for everything the user can configure.
// Keeping this declarative makes the UI, the 3D scene and the pricing
// logic all derive from one place — add an option here and it shows up
// everywhere automatically.

export const MODELS = [
  { id: 'gt',      name: 'Studio GT',      basePrice: 58900 },
  { id: 'gt-x',    name: 'Studio GT-X',    basePrice: 72400 },
];

export const PAINTS = [
  { id: 'alpine-white', name: 'Alpine White', hex: '#eef0f2', finish: 'gloss',     price: 0 },
  { id: 'black-sapphire', name: 'Black Sapphire', hex: '#15171b', finish: 'metallic', price: 950 },
  { id: 'storm-bay',    name: 'Storm Bay',     hex: '#2f4858', finish: 'metallic',  price: 950 },
  { id: 'sao-paulo',    name: 'São Paulo Yellow', hex: '#f2c12e', finish: 'gloss',  price: 1200 },
  { id: 'tanzanite',    name: 'Tanzanite Blue', hex: '#1d3a8a', finish: 'metallic', price: 1200 },
  { id: 'frozen-grey',  name: 'Frozen Grey',   hex: '#6b6f75', finish: 'matte',     price: 2400 },
];

export const WHEELS = [
  { id: 'aero-19',  name: '19" Aero',         radius: 0.34, spokes: 5,  price: 0 },
  { id: 'sport-20', name: '20" Sport',        radius: 0.36, spokes: 10, price: 1500 },
  { id: 'forged-21', name: '21" Forged Star', radius: 0.38, spokes: 7,  price: 3200 },
];

export const TRIMS = [
  { id: 'cloth',   name: 'Sport Cloth',     accent: '#3a3d42', price: 0 },
  { id: 'leather', name: 'Vernasca Leather', accent: '#5a3a2a', price: 2100 },
  { id: 'merino',  name: 'Merino Cognac',   accent: '#8a5a30', price: 4800 },
];

// Stand-alone options shown as toggles.
export const PACKAGES = [
  { id: 'm-sport',     name: 'M Sport Package',     price: 3900 },
  { id: 'carbon-roof', name: 'Carbon Fibre Roof',   price: 1700 },
  { id: 'tech-pack',   name: 'Driving Assistant Pro', price: 2300 },
];

// Convenience lookups used by the pricing util and tests.
export const DEFAULTS = {
  modelId: 'gt',
  paintId: 'alpine-white',
  wheelId: 'aero-19',
  trimId: 'cloth',
  packageIds: [],
};
