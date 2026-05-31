# 3D car models

## Included: `car1` (low-poly OBJ) — ACTIVE

A low-poly car (`car1/car1.obj`) ships with the project and is the **default**
model rendered by the app (loaded via `src/components/Scene/ObjCar.jsx`).

- It has no UVs, so the source PNG textures are not used; the app applies its
  own PBR materials instead. The **largest mesh is treated as the body** and is
  recoloured live from the paint picker; the rest (wheels/details) render dark.
- The model is auto-centred, dropped onto the ground, and scaled to ~4.6 m.
- If the OBJ ever fails to load, `ObjCar` falls back to the procedural car.

> Attribution / licence: this is a user-supplied "free" model. Before publishing
> the repo, confirm its licence and add the required attribution here. Don't ship
> models without a clear licence.

To go back to the pure procedural car, in `CarScene.jsx` swap `<ObjCar />`
for `<CarModel />`.

---

## Bringing your own (higher-quality) model


The app ships with a **procedural** car (`CarModel.jsx`) so it runs with zero
assets. To use a real model instead:

1. **Get a model you're allowed to use.** Good license-safe sources:
   - Khronos glTF Sample Models (royalty-free)
   - Sketchfab — filter to **CC0** or **CC-BY** (attribute the author)
   - Poly Haven
   Do **not** use ripped game assets (e.g. GTA V `.yft`/`.rpf`) or models
   carrying real automaker trademarks in a public/portfolio repo — it's a
   licensing and reputational risk.

2. **Convert to GLB** if needed and optimize:
   ```bash
   npx @gltf-transform/cli optimize input.glb car.glb --texture-compress webp
   ```

3. **Save it here** as `public/models/car.glb`.

4. **Enable it** — in `src/components/Scene/CarScene.jsx`, swap:
   ```diff
   - import CarModel from './CarModel.jsx';
   + import GltfCar from './GltfCar.jsx';
   ...
   -        <CarModel />
   +        <GltfCar />
   ```
   If the file is missing or fails to load, `GltfCar` falls back to the
   procedural model automatically — no crash.

5. **Wire paint colour** — open `GltfCar.jsx` and set `PAINT_MATERIAL_NAME`
   to your model's paint material. Find it with:
   ```bash
   npx @gltf-transform/cli inspect public/models/car.glb
   ```
