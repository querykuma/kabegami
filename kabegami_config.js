//thanks Pexels for free wallpapers
let imagesfolder = "images";
let images = `
sample-arch-bridge-clouds-814499.jpg
sample-autumn-autumn-leaves-fall-1563355.jpg
sample-autumn-colorful-colourful-33109.jpg
sample-beautiful-daylight-environment-709552.jpg
sample-daylight-forest-glossy-443446.jpg
`.split("\n").filter(a => a).map(a => imagesfolder + '/' + a.trim());