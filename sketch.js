// VARIABILI GLOBALI
let volcanoData;

let activeTypeCategory = 'All'; // filtro tipo
let allTypeCategories = []; // array tipi
let typeSelect; // dropdown

let hoveredVolcano = null;

let volcanoDetails = {
    name: "No volcano selected", 
    country: "...",
    typeCategory: "...",
    elev: "...",
};

// PRELOAD
function preload() {
  volcanoData = loadTable("volcanoes.csv", "csv", "header");
}

// SETUP
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('serif'); 
  textAlign(LEFT, CENTER);
  noStroke();

//MENU DROPDOWN
  allTypeCategories = []; 
  
  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let type = volcanoData.getRow(r).get("TypeCategory");
    
    //ignora i valori nulli
    if (type && type.trim() !== '') {
      let cleanedType = type.trim();

      //verifica unicità
      if (!allTypeCategories.includes(cleanedType)) {
        allTypeCategories.push(cleanedType);
      }
    }
  }

  allTypeCategories.sort();
  allTypeCategories.unshift('All');
  
  typeSelect = createSelect();
  typeSelect.changed(typeSelected); 
  typeSelect.style('font-family', 'serif');
  typeSelect.style('font-size', '14px');
  typeSelect.style('padding', '5px');
  typeSelect.style('border-radius', '4px');
  typeSelect.style('border', '1px solid #c0c0c0');
  
  for (let category of allTypeCategories) {
    typeSelect.option(category);
  }
  typeSelect.selected('All');
  typeSelect.position(0, 0); 
  
  positionDropdown();
}

  function positionDropdown() {
    let mapMargin = 20;
    let mapY = 135; 
    let maxMapW = width - 2 * mapMargin;
    let maxMapH = height - mapY - 130; 
    
    const baseW = 2000;
    const baseH = 1000;

    let scaleFactor = min(maxMapW / baseW, maxMapH / baseH);
    let mapW = baseW * scaleFactor;   
    let mapH = baseH * scaleFactor;
    let mapX = (width - mapW) / 2;

    const BOX_W = 250; 
    let gap = 10;
    let padding = 10;
    const BOX_HEIGHT = 90;
    
    let totalBoxesW = BOX_W * 3 + gap * 2;
    let offsetX = (mapW - totalBoxesW) / 2;
    let startX = mapX + offsetX;
    
    // posizionamento del dropdown
    const vOffset = 20; 
    let filterBoxX = startX + BOX_W + gap;
    let newX = filterBoxX + padding; 
    let newY = mapY + mapH + 10 + vOffset + 20; 

    typeSelect.position(newX, newY); 
    typeSelect.size(BOX_W - (padding * 2), 30);
}

  // CALLBACK per il dropdown
  function typeSelected() {
  activeTypeCategory = typeSelect.value();
}

//COLORI attività
function getActivityScore(status) {
  switch (status) {
    case 'D5': 
    case 'U':  
    case 'Holocene': 
      return 0.2;
    case 'D4': 
      return 0.4;
    case 'D3': 
      return 0.6;
    case 'D2': 
      return 0.8;
    case 'D1': 
    case 'Historical': 
      return 1.0;
    default:
      return 0.1; 
  }
}

// DRAW
function draw() {
  background(220, 220, 215); 

  drawTitle();

  // per la mappa
  let mapMargin = 20;
  let mapY = 135; 
  let maxMapW = width - 2 * mapMargin;
  let maxMapH = height - mapY - 130; 
  
  const baseW = 2000;
  const baseH = 1000;
  
  let scaleFactor = min(maxMapW / baseW, maxMapH / baseH);
  let mapW = baseW * scaleFactor;   
  let mapH = baseH * scaleFactor;
  let mapX = (width - mapW) / 2;

  // per i box legenda e dettagli
  const BOX_HEIGHT = 90; 
  const BOX_W = 250; 
  const gap = 10;
  
  let totalBoxesW = BOX_W * 3 + gap * 2;
  let offsetX = (mapW - totalBoxesW) / 2;
  let startX = mapX + offsetX;

  
  drawWorldMap(mapX, mapY, mapW, mapH);
  drawVolcanoes(mapX, mapY, mapW, mapH);
 
  drawLegendBox(startX, mapY + mapH + 10, BOX_W, BOX_HEIGHT);

  let filterBoxX = startX + BOX_W + gap;
  drawTypeFilterBox(filterBoxX, mapY + mapH + 10, BOX_W, BOX_HEIGHT);

  let detailsBoxX = filterBoxX + BOX_W + gap;
  drawVolcanoDetailsBox(detailsBoxX, mapY + mapH + 10, BOX_W, BOX_HEIGHT);
}

// TITOLO
function drawTitle() {
  noStroke(); 
  textAlign(CENTER, CENTER);
  textFont('serif'); 
  fill(100, 50, 0); 
  
  textSize(50);
  text("Volcanoes of the World", width / 2, 50);
  
  textSize(16);
  text("Each point represents a volcano. Hover for more details!", width / 2, 85);
}

// MAPPA VULCANI
function drawWorldMap(mapX, mapY, mapW, mapH) {
}

function drawVolcanoes(mapX, mapY, mapW, mapH) {
  // reset hover
  hoveredVolcano = null;
  let closestDist = Infinity;
  const FIXED_SIZE = 10; 

  // dettagli per il box
  volcanoDetails = {
      name: "No volcano selected",
      country: "...", 
      typeCategory: "...",
      elev: "...",
  };

  // scorre tutte le righe
  for (let r = 0; r < volcanoData.getRowCount(); r++) {
    let row = volcanoData.getRow(r);
    let lat = float(row.get("Latitude"));
    let lon = float(row.get("Longitude"));
    let typeCategory = row.get("TypeCategory");
    let elev = float(row.get("Elevation (m)"));
    let name = row.get("Volcano Name") || "Unknown";
    let country = row.get("Country") || "Unknown"; 
    let status = row.get("Last Known Eruption");

    // se il vulcano non appartiene alla categoria attiva non lo disegna
    if (activeTypeCategory !== 'All' && typeCategory !== activeTypeCategory) {
        continue;
    }
    
    // disegno posizione vulcani
    let x = map(lon, -180, 180, mapX, mapX + mapW);
    let y = map(lat, 90, -90, mapY, mapY + mapH); 
    
    // disegno dimensione (fissa) e colore (lerp)
    let size = FIXED_SIZE; 
    let score = getActivityScore(status);
    let c = lerpColor(color(255, 255, 100), color(200, 30, 30), score); 
    
    // trasparenza
    let alphaVal = 255 * 0.7; 
    let cAlpha = color(red(c), green(c), blue(c), alphaVal);

    // hover distanza dal mouse
    let d = dist(mouseX, mouseY, x, y);
    if (d < max(size, 8) && d < closestDist) {
      closestDist = d;
      hoveredVolcano = { name, country, typeCategory, elev, x, y, size, rowIndex: r }; 
      
      // dettagli nel box on hover 
      volcanoDetails = {
          name: hoveredVolcano.name,
          country: hoveredVolcano.country, 
          typeCategory: hoveredVolcano.typeCategory,
          elev: `${nf(hoveredVolcano.elev, 0, 0)} m`,
      };
    }
    
    // disegno del vulcano
    noStroke();
    fill(cAlpha);
    ellipse(x, y, size, size);

    // marrone on hover
    if (hoveredVolcano && hoveredVolcano.rowIndex === r) {
      noStroke(); 
      fill(100, 50, 0, alphaVal);
      ellipse(x, y, size, size);
    }
  }
}

// BOX 3 DETTAGLI
function drawVolcanoDetailsBox(boxX, boxY, boxW, boxH) {
    let padding = 10;
    let lineHeight = 16;
    const vOffset = 13; 

    push();
    fill(230, 230, 225, 220); 
    stroke(139, 69, 19);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 8); 
    
    noStroke();
    textSize(14);
    textFont('serif');
    textAlign(LEFT, TOP);

    // --- Contenuto dei Dettagli ---
    let yStart = boxY + vOffset;

    // nome 
    fill(100, 50, 0); 
    textStyle(BOLD);
    text(volcanoDetails.name, boxX + padding, yStart);
    // no volcano selected
    if (volcanoDetails.name !== "No volcano selected") {

     // paese
     fill(20); 
     textStyle(NORMAL);
     text(volcanoDetails.country, boxX + padding, yStart + lineHeight);

     // tipo
     fill(20); 
     textStyle(NORMAL);
     text(volcanoDetails.typeCategory, boxX + padding, yStart + lineHeight * 2);

     // elevazione
     fill(20);
     text(volcanoDetails.elev, boxX + padding, yStart + lineHeight * 3);
    }

    pop();
}


// BOX 1 COLORI
function drawLegendBox(boxX, boxY, boxW, boxH) {
  let barW = boxW - 20;
  const vOffset = 31; 

  push();
  fill(230, 230, 225, 220); 
  stroke(139, 69, 19);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 8); 

  // barra
  let barY = boxY + vOffset; 
  let barH = 10;

  // testo 
  noStroke(); 
  textSize(12);
  fill(100, 50, 0); 
  textFont('serif');
  
  textAlign(LEFT, TOP);
  text("Less Active", boxX + 10, barY + barH + 5);
  textAlign(RIGHT, TOP);
  text("More Active", boxX + barW + 10, barY + barH + 5); 
  textAlign(LEFT, TOP); 

  // gradiente
  for (let i = 0; i < barW; i++) {
    let c = lerpColor(color(255, 255, 100), color(200, 30, 30), map(i, 0, barW, 0, 1));
    stroke(c);
    line(boxX + 10 + i, barY, boxX + 10 + i, barY + barH);
  }

  pop();
}

// BOX 2 FILTRO TIPO
function drawTypeFilterBox(boxX, boxY, boxW, boxH) {
    let padding = 10;
    const vOffset = 20; 

    push();
    fill(230, 230, 225, 220); 
    stroke(139, 69, 19);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 8); 

    // titolo
    noStroke();
    textSize(14);
    fill(100, 50, 0);
    textFont('serif');
    textAlign(LEFT, TOP);
    text("Filter by Volcano Type:", boxX + padding, boxY + vOffset); 
    
    // html dropdown
    typeSelect.position(boxX + padding, boxY + vOffset + 20);
    typeSelect.size(boxW - (padding * 2), 30); 
    pop();
}

// WINDOW RESIZE
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionDropdown();
}