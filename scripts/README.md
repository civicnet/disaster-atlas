`buildings.json` is OpenStreetMap data, queried via Overpass Turbo, for a tight bounding box around Dobrogea / Danube Delta:

```
[out:json][timeout:25];
(
  node["building"](43.723474896114794,27.828369140625,45.52559248776561,29.7344970703125);
  way["building"](43.723474896114794,27.828369140625,45.52559248776561,29.7344970703125);
  relation["building"](43.723474896114794,27.828369140625,45.52559248776561,29.7344970703125);
);
out body;
>;
out skel qt;`; 
```
