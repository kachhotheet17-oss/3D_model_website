const state = {
  selectedModel: "simple",
  budget: "medium",
  material: "good",
  floors: 2,
  roof: "gable",
  bedrooms: 3,
  bathrooms: 2,
  doors: 4,
  windows: 6,
  wallColor: "#f8fafc",
  roofColor: "#ef4444",
  doorColor: "#8b5a2b",
  parking: true,
  garden: true,
  furniture: true,
  user: null,
  requestDetails: null
};

const modelPresets = {
  simple: {
    budget: "low",
    material: "basic",
    floors: 1,
    roof: "gable",
    bedrooms: 1,
    bathrooms: 1,
    doors: 2,
    windows: 3,
    parking: false,
    garden: true,
    furniture: false
  },
  family: {
    budget: "medium",
    material: "good",
    floors: 2,
    roof: "gable",
    bedrooms: 3,
    bathrooms: 2,
    doors: 4,
    windows: 6,
    parking: true,
    garden: true,
    furniture: true
  },
  duplex: {
    budget: "high",
    material: "premium",
    floors: 2,
    roof: "flat",
    bedrooms: 4,
    bathrooms: 3,
    doors: 5,
    windows: 8,
    parking: true,
    garden: true,
    furniture: true
  },
  luxury: {
    budget: "luxury",
    material: "premium",
    floors: 3,
    roof: "complex",
    bedrooms: 5,
    bathrooms: 4,
    doors: 6,
    windows: 10,
    parking: true,
    garden: true,
    furniture: true
  }
};

let scene;
let camera;
let renderer;
let houseGroup;
let rotateModel = true;

const viewer = document.getElementById("viewer");
const summaryBox = document.getElementById("modelSummary");

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf4ff);

  camera = new THREE.PerspectiveCamera(55, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
  camera.position.set(7, 5.4, 9);
  camera.lookAt(0, 1.4, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  viewer.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  const sunlight = new THREE.DirectionalLight(0xffffff, 0.92);
  sunlight.position.set(8, 12, 7);
  sunlight.castShadow = true;
  scene.add(sunlight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 18),
    new THREE.MeshStandardMaterial({ color: 0xd7f7df, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  buildHouse();
  animate();
}

function material(color, roughness = 0.65) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness });
}

function addBox(group, name, size, position, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material(color));
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, name, radius, depth, position, color) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 32), material(color));
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createGableRoof(width, depth, height, y, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(-width / 2, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false
  });

  const mesh = new THREE.Mesh(geometry, material(color, 0.55));
  mesh.position.set(0, y, -depth / 2);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createFlatRoof(width, depth, y, color) {
  return addBox(new THREE.Group(), "flatRoof", { x: width + 0.45, y: 0.25, z: depth + 0.45 }, { x: 0, y, z: 0 }, color);
}

function buildHouse() {
  if (houseGroup) {
    scene.remove(houseGroup);
  }

  houseGroup = new THREE.Group();
  const floors = Number(state.floors);
  const width = state.selectedModel === "luxury" ? 5.6 : state.selectedModel === "duplex" ? 5.1 : 4.4;
  const depth = state.selectedModel === "simple" ? 3.6 : 4.4;
  const floorHeight = 1.3;
  const totalHeight = floors * floorHeight;

  addBox(houseGroup, "mainBuilding", { x: width, y: totalHeight, z: depth }, { x: 0, y: totalHeight / 2, z: 0 }, state.wallColor);

  for (let i = 1; i < floors; i++) {
    addBox(houseGroup, "floorLine", { x: width + 0.05, y: 0.04, z: depth + 0.05 }, { x: 0, y: i * floorHeight, z: 0 }, "#cbd5e1");
  }

  addBox(houseGroup, "mainDoor", { x: 0.65, y: 0.95, z: 0.08 }, { x: 0, y: 0.48, z: depth / 2 + 0.05 }, state.doorColor);
  addBox(houseGroup, "doorHandle", { x: 0.08, y: 0.08, z: 0.04 }, { x: 0.21, y: 0.5, z: depth / 2 + 0.12 }, "#facc15");

  addWindows(width, depth, floors);
  addDoors(width, depth);

  if (state.roof === "flat") {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.28, depth + 0.6), material(state.roofColor));
    roof.position.set(0, totalHeight + 0.14, 0);
    roof.castShadow = true;
    houseGroup.add(roof);
  } else if (state.roof === "hip") {
    const roof = createGableRoof(width + 0.9, depth + 0.6, 0.9, totalHeight, state.roofColor);
    roof.scale.x = 0.95;
    houseGroup.add(roof);
  } else if (state.roof === "complex") {
    const roof1 = createGableRoof(width + 0.8, depth + 0.7, 1.0, totalHeight, state.roofColor);
    const roof2 = createGableRoof(depth, width * 0.48, 0.75, totalHeight + 0.03, state.roofColor);
    roof2.rotation.y = Math.PI / 2;
    roof2.position.x = -1.35;
    houseGroup.add(roof1, roof2);
  } else {
    houseGroup.add(createGableRoof(width + 0.7, depth + 0.6, 1.05, totalHeight, state.roofColor));
  }

  if (state.parking) {
    addParking(width, depth);
  }

  if (state.garden) {
    addGarden(width, depth);
  }

  if (state.furniture) {
    addFurniture(depth);
  }

  addRoomBlocks(width, depth);
  scene.add(houseGroup);
}

function addWindows(width, depth, floors) {
  const maxWindows = Math.min(Number(state.windows), 12);
  let count = 0;

  for (let f = 0; f < floors; f++) {
    const y = f * 1.3 + 0.77;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 2 && count < maxWindows; i++) {
        const x = side * (width * 0.25 + i * 0.85 * side);
        addBox(houseGroup, "window", { x: 0.48, y: 0.42, z: 0.08 }, { x, y, z: depth / 2 + 0.06 }, "#7dd3fc");
        addBox(houseGroup, "windowFrame", { x: 0.54, y: 0.05, z: 0.09 }, { x, y, z: depth / 2 + 0.075 }, "#1e293b");
        count++;
      }
    }
  }

  for (let i = 0; i < maxWindows - count; i++) {
    const z = -depth * 0.25 + i * 0.75;
    addBox(houseGroup, "sideWindow", { x: 0.08, y: 0.42, z: 0.48 }, { x: width / 2 + 0.06, y: 0.8, z }, "#7dd3fc");
  }
}

function addDoors(width, depth) {
  const extraDoors = Math.max(Number(state.doors) - 1, 0);
  for (let i = 0; i < extraDoors; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    addBox(houseGroup, "extraDoor", { x: 0.08, y: 0.78, z: 0.48 }, { x: side * (width / 2 + 0.055), y: 0.39, z: -depth / 4 + i * 0.35 }, state.doorColor);
  }
}

function addParking(width, depth) {
  addBox(houseGroup, "parkingFloor", { x: 2.4, y: 0.04, z: 2.7 }, { x: width / 2 + 1.65, y: 0.02, z: 0.6 }, "#94a3b8");
  addBox(houseGroup, "car", { x: 1.25, y: 0.42, z: 0.75 }, { x: width / 2 + 1.65, y: 0.25, z: 0.6 }, "#2563eb");
  addBox(houseGroup, "carTop", { x: 0.75, y: 0.35, z: 0.55 }, { x: width / 2 + 1.65, y: 0.64, z: 0.6 }, "#1d4ed8");
}

function addGarden(width, depth) {
  for (let i = 0; i < 5; i++) {
    const x = -width / 2 - 1.1;
    const z = -depth / 2 + i * 0.9;
    addCylinder(houseGroup, "treeTrunk", 0.08, 0.5, { x, y: 0.25, z }, "#854d0e");
    addCylinder(houseGroup, "treeLeaf", 0.35, 0.55, { x, y: 0.78, z }, "#16a34a");
  }
}

function addFurniture(depth) {
  addCylinder(houseGroup, "fan", 0.18, 0.06, { x: -0.8, y: 2.25, z: 0.1 }, "#64748b");
  addBox(houseGroup, "ac", { x: 0.75, y: 0.28, z: 0.08 }, { x: 1.45, y: 1.85, z: depth / 2 + 0.08 }, "#e2e8f0");
  addBox(houseGroup, "tv", { x: 0.8, y: 0.45, z: 0.08 }, { x: -1.45, y: 1.25, z: depth / 2 + 0.08 }, "#020617");
  addBox(houseGroup, "washingMachine", { x: 0.45, y: 0.55, z: 0.38 }, { x: 1.25, y: 0.3, z: -depth / 2 - 0.35 }, "#f8fafc");
}

function addRoomBlocks(width, depth) {
  const roomCount = Math.min(Number(state.bedrooms) + Number(state.bathrooms), 8);
  for (let i = 0; i < roomCount; i++) {
    const x = -width / 2 + 0.45 + (i % 4) * 0.75;
    const z = -depth / 2 - 0.75 - Math.floor(i / 4) * 0.55;
    const color = i < Number(state.bedrooms) ? "#bfdbfe" : "#ddd6fe";
    addBox(houseGroup, "roomBlock", { x: 0.48, y: 0.25, z: 0.36 }, { x, y: 0.13, z }, color);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (houseGroup && rotateModel) {
    houseGroup.rotation.y += 0.004;
  }
  renderer.render(scene, camera);
}

function resizeViewer() {
  if (!renderer || !camera) return;
  camera.aspect = viewer.clientWidth / viewer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
}

function getFormState() {
  state.budget = document.getElementById("budget").value;
  state.material = document.getElementById("material").value;
  state.floors = Number(document.getElementById("floors").value);
  state.roof = document.getElementById("roof").value;
  state.bedrooms = Number(document.getElementById("bedrooms").value);
  state.bathrooms = Number(document.getElementById("bathrooms").value);
  state.doors = Number(document.getElementById("doors").value);
  state.windows = Number(document.getElementById("windows").value);
  state.wallColor = document.getElementById("wallColor").value;
  state.roofColor = document.getElementById("roofColor").value;
  state.doorColor = document.getElementById("doorColor").value;
  state.parking = document.getElementById("parking").checked;
  state.garden = document.getElementById("garden").checked;
  state.furniture = document.getElementById("furniture").checked;
}

function setFormFromState() {
  document.getElementById("budget").value = state.budget;
  document.getElementById("material").value = state.material;
  document.getElementById("floors").value = state.floors;
  document.getElementById("roof").value = state.roof;
  document.getElementById("bedrooms").value = state.bedrooms;
  document.getElementById("bathrooms").value = state.bathrooms;
  document.getElementById("doors").value = state.doors;
  document.getElementById("windows").value = state.windows;
  document.getElementById("wallColor").value = state.wallColor;
  document.getElementById("roofColor").value = state.roofColor;
  document.getElementById("doorColor").value = state.doorColor;
  document.getElementById("parking").checked = state.parking;
  document.getElementById("garden").checked = state.garden;
  document.getElementById("furniture").checked = state.furniture;
}

function updateSummary() {
  const items = [
    ["Model", state.selectedModel],
    ["Budget", state.budget],
    ["Material", state.material],
    ["Floors", state.floors],
    ["Roof", state.roof],
    ["Bedrooms", state.bedrooms],
    ["Bathrooms", state.bathrooms],
    ["Doors", state.doors],
    ["Windows", state.windows],
    ["Parking", state.parking ? "Yes" : "No"],
    ["Garden", state.garden ? "Yes" : "No"],
    ["Furniture", state.furniture ? "Yes" : "No"]
  ];

  summaryBox.innerHTML = items
    .map(([key, value]) => `<div class="summary-line"><span>${key}</span><strong>${value}</strong></div>`)
    .join("");
}

function applyFormUpdate() {
  getFormState();
  buildHouse();
  updateSummary();
  saveDesign();
}

function selectModel(modelName) {
  state.selectedModel = modelName;
  Object.assign(state, modelPresets[modelName]);
  setFormFromState();
  document.querySelectorAll(".model-card").forEach(card => {
    card.classList.toggle("active", card.dataset.model === modelName);
  });
  buildHouse();
  updateSummary();
  saveDesign();
  showToast(`${modelName} model selected`);
}

function saveDesign() {
  localStorage.setItem("latestHouseDesign", JSON.stringify(state));
}

function loadDesign() {
  const saved = localStorage.getItem("latestHouseDesign");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
    setFormFromState();
    updateSummary();
  } catch (error) {
    console.error(error);
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadJson() {
  const data = {
    project: "3D House Model Designer",
    createdAt: new Date().toISOString(),
    user: state.user,
    design: state,
    note: "This JSON stores the selected 3D house model configuration."
  };
  downloadFile("house-design.json", JSON.stringify(data, null, 2), "application/json");
  showToast("Design JSON downloaded");
}

function generateOBJ() {
  const width = state.selectedModel === "luxury" ? 5.6 : state.selectedModel === "duplex" ? 5.1 : 4.4;
  const depth = state.selectedModel === "simple" ? 3.6 : 4.4;
  const height = Number(state.floors) * 1.3;
  const roofHeight = state.roof === "flat" ? 0.25 : 1.05;

  return `# 3D House Model Designer OBJ\n# Basic generated house model\n\no House_Body\nv ${-width/2} 0 ${-depth/2}\nv ${width/2} 0 ${-depth/2}\nv ${width/2} ${height} ${-depth/2}\nv ${-width/2} ${height} ${-depth/2}\nv ${-width/2} 0 ${depth/2}\nv ${width/2} 0 ${depth/2}\nv ${width/2} ${height} ${depth/2}\nv ${-width/2} ${height} ${depth/2}\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 4 8 5 1\n\no Roof\nv ${-width/2 - 0.35} ${height} ${-depth/2 - 0.35}\nv ${width/2 + 0.35} ${height} ${-depth/2 - 0.35}\nv 0 ${height + roofHeight} ${-depth/2 - 0.35}\nv ${-width/2 - 0.35} ${height} ${depth/2 + 0.35}\nv ${width/2 + 0.35} ${height} ${depth/2 + 0.35}\nv 0 ${height + roofHeight} ${depth/2 + 0.35}\nf 9 10 11\nf 12 14 13\nf 9 12 13 10\nf 10 13 14 11\nf 11 14 12 9\n`;
}

function downloadObj() {
  downloadFile("house-model.obj", generateOBJ(), "text/plain");
  showToast("3D OBJ model downloaded");
}

function downloadNote() {
  const note = `3D House Model Designer\n\nSelected Model: ${state.selectedModel}\nBudget: ${state.budget}\nMaterial: ${state.material}\nFloors: ${state.floors}\nBedrooms: ${state.bedrooms}\nBathrooms: ${state.bathrooms}\nDoors: ${state.doors}\nWindows: ${state.windows}\nParking: ${state.parking ? "Yes" : "No"}\nGarden: ${state.garden ? "Yes" : "No"}\nFurniture: ${state.furniture ? "Yes" : "No"}\n\nThis file explains the selected house model configuration.`;
  downloadFile("house-project-note.txt", note, "text/plain");
  showToast("Project note downloaded");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

function setupEvents() {
  document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("navMenu").classList.toggle("show");
  });

  document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => openModal(button.dataset.open));
  });

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => closeModal(button.dataset.close));
  });

  document.querySelectorAll("[data-switch]").forEach(button => {
    button.addEventListener("click", () => {
      closeModal("loginModal");
      closeModal("signupModal");
      openModal(button.dataset.switch);
    });
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) modal.classList.remove("show");
    });
  });

  document.querySelectorAll(".model-card").forEach(card => {
    card.querySelector("button").addEventListener("click", () => selectModel(card.dataset.model));
  });

  document.getElementById("customForm").addEventListener("input", applyFormUpdate);

  document.getElementById("rotateBtn").addEventListener("click", event => {
    rotateModel = !rotateModel;
    event.target.textContent = rotateModel ? "Pause Rotate" : "Start Rotate";
  });

  document.getElementById("resetCameraBtn").addEventListener("click", () => {
    camera.position.set(7, 5.4, 9);
    camera.lookAt(0, 1.4, 0);
    if (houseGroup) houseGroup.rotation.y = 0;
  });

  ["downloadJsonBtn", "downloadJsonBtn2"].forEach(id => document.getElementById(id).addEventListener("click", downloadJson));
  ["downloadObjBtn", "downloadObjBtn2"].forEach(id => document.getElementById(id).addEventListener("click", downloadObj));
  document.getElementById("downloadNoteBtn").addEventListener("click", downloadNote);

  document.getElementById("signupForm").addEventListener("submit", event => {
    event.preventDefault();
    const user = {
      name: document.getElementById("signupName").value,
      email: document.getElementById("signupEmail").value,
      mobile: document.getElementById("signupMobile").value,
      password: document.getElementById("signupPassword").value
    };
    localStorage.setItem("houseUser", JSON.stringify(user));
    state.user = { name: user.name, email: user.email, mobile: user.mobile };
    closeModal("signupModal");
    showToast("Account created successfully");
  });

  document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault();
    const saved = JSON.parse(localStorage.getItem("houseUser") || "null");
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (saved && saved.email === email && saved.password === password) {
      state.user = { name: saved.name, email: saved.email, mobile: saved.mobile };
      closeModal("loginModal");
      showToast(`Welcome ${saved.name}`);
    } else {
      showToast("Invalid login details. Please sign up first.");
    }
  });

  document.getElementById("requestForm").addEventListener("submit", event => {
    event.preventDefault();
    state.requestDetails = {
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      mobile: document.getElementById("mobile").value,
      plotSize: document.getElementById("plotSize").value,
      floors: Number(document.getElementById("reqFloors").value),
      bedrooms: Number(document.getElementById("reqBedrooms").value),
      bathrooms: Number(document.getElementById("reqBathrooms").value),
      budget: document.getElementById("reqBudget").value,
      extraDetails: document.getElementById("extraDetails").value
    };

    state.floors = state.requestDetails.floors;
    state.bedrooms = state.requestDetails.bedrooms;
    state.bathrooms = state.requestDetails.bathrooms;
    state.budget = state.requestDetails.budget;
    state.selectedModel = state.budget === "luxury" ? "luxury" : state.budget === "high" ? "duplex" : state.budget === "medium" ? "family" : "simple";
    state.parking = state.requestDetails.extraDetails.toLowerCase().includes("parking") || state.budget !== "low";
    state.garden = state.requestDetails.extraDetails.toLowerCase().includes("garden") || state.budget !== "low";
    setFormFromState();
    buildHouse();
    updateSummary();
    saveDesign();
    showToast("Model generated from requirement form");
    document.getElementById("customize").scrollIntoView({ behavior: "smooth" });
  });

  window.addEventListener("resize", resizeViewer);
}

window.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  loadDesign();
  updateSummary();
  initThree();
});
