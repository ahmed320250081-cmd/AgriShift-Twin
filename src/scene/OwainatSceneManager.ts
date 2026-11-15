import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
import desertTileUrl from '../assets/images/sahara_desert_satellite_tile_1794652900645.jpg';
import { AnalysisLayer, CameraPreset, FarmPlot } from '../types/farm';
import { SCENE_METERS_PER_UNIT } from '../utils/agronomy';

// Pre-allocated scratch math helpers (zero GC inside render loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function groundHeightAt(x: number, z: number): number {
  // Smoothly graded flat agricultural concession inside |x| < 88, |z| < 72
  const dx = Math.max(0, Math.abs(x) - 88);
  const dz = Math.max(0, Math.abs(z) - 72);
  const distOutside = Math.sqrt(dx * dx + dz * dz);
  const duneMask = Math.min(1, distOutside / 35);

  const dune =
    Math.sin(x * 0.045 + z * 0.025) * 2.2 +
    Math.cos(x * 0.02 - z * 0.05) * 1.6 +
    Math.sin(x * 0.11 + z * 0.09) * 0.45;

  return dune * duneMask;
}

function createSandBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ripple = Math.sin(x * 0.18 + Math.sin(y * 0.07) * 2.2) * 0.5 + 0.5;
      const grain = ((x * 73856093) ^ (y * 19349663)) & 255;
      const val = Math.round(ripple * 160 + (grain / 255) * 95);
      const idx = (y * size + x) * 4;
      img.data[idx] = val;
      img.data[idx + 1] = val;
      img.data[idx + 2] = val;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.needsUpdate = true;
  return tex;
}

function lerpRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * k),
    Math.round(c1[1] + (c2[1] - c1[1]) * k),
    Math.round(c1[2] + (c2[2] - c1[2]) * k),
  ];
}

function sampleColorRamp(
  stops: Array<{ t: number; c: [number, number, number] }>,
  value: number,
): [number, number, number] {
  const v = Math.max(0, Math.min(1, value));
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].t && v <= stops[i + 1].t) {
      const localT = (v - stops[i].t) / Math.max(0.0001, stops[i + 1].t - stops[i].t);
      return lerpRgb(stops[i].c, stops[i + 1].c, localT);
    }
  }
  return stops[stops.length - 1].c;
}

const RAMP_SMAP_SURFACE: Array<{ t: number; c: [number, number, number] }> = [
  { t: 0.0, c: [180, 83, 9] },
  { t: 0.35, c: [234, 179, 8] },
  { t: 0.68, c: [34, 197, 94] },
  { t: 1.0, c: [2, 132, 199] },
];

const RAMP_SMAP_ROOT: Array<{ t: number; c: [number, number, number] }> = [
  { t: 0.0, c: [220, 38, 38] },
  { t: 0.38, c: [245, 158, 11] },
  { t: 0.72, c: [16, 185, 129] },
  { t: 1.0, c: [6, 182, 212] },
];

const RAMP_NDVI: Array<{ t: number; c: [number, number, number] }> = [
  { t: 0.0, c: [146, 64, 14] },
  { t: 0.35, c: [202, 138, 4] },
  { t: 0.68, c: [101, 163, 13] },
  { t: 1.0, c: [21, 128, 61] },
];

const RAMP_THERMAL: Array<{ t: number; c: [number, number, number] }> = [
  { t: 0.0, c: [14, 165, 233] },
  { t: 0.35, c: [34, 197, 94] },
  { t: 0.7, c: [245, 158, 11] },
  { t: 1.0, c: [239, 68, 68] },
];

function paintPlotCanvasTexture(
  canvas: HTMLCanvasElement,
  plot: FarmPlot,
  layer: AnalysisLayer,
) {
  const size = canvas.width;
  const half = size / 2;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // Base circle fill
  ctx.save();
  ctx.beginPath();
  ctx.arc(half, half, half - 2, 0, Math.PI * 2);
  ctx.clip();

  // Compute base crop/layer color
  let baseRgb: [number, number, number] = [56, 118, 52];
  if (layer === 'satellite') {
    switch (plot.cropType) {
      case 'Alfalfa':
        baseRgb = [34, 112, 48];
        break;
      case 'Potato':
        baseRgb = [54, 126, 46];
        break;
      case 'Wheat':
        baseRgb = [82, 134, 52];
        break;
      case 'Barley':
        baseRgb = [138, 146, 66];
        break;
      case 'Sorghum':
        baseRgb = [68, 122, 58];
        break;
      case 'Fallow':
      default:
        baseRgb = [184, 152, 108];
        break;
    }
  } else if (layer === 'smap_surface') {
    const norm = (plot.smapSurfaceMoisture - 0.04) / 0.34;
    baseRgb = sampleColorRamp(RAMP_SMAP_SURFACE, norm);
  } else if (layer === 'smap_root') {
    const norm = (plot.smapRootMoisturePct - 15) / 70;
    baseRgb = sampleColorRamp(RAMP_SMAP_ROOT, norm);
  } else if (layer === 'ndvi') {
    const norm = (plot.ndvi - 0.05) / 0.8;
    baseRgb = sampleColorRamp(RAMP_NDVI, norm);
  } else if (layer === 'thermal_et') {
    const norm = (plot.landSurfaceTempC - 26) / 19;
    baseRgb = sampleColorRamp(RAMP_THERMAL, norm);
  }

  ctx.fillStyle = `rgb(${baseRgb[0]}, ${baseRgb[1]}, ${baseRgb[2]})`;
  ctx.fillRect(0, 0, size, size);

  // Add realistic concentric crop cultivation rings and radial sector variations
  for (let r = 24; r < half - 8; r += 10) {
    const ringShade = r % 20 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    ctx.strokeStyle = ringShade;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(half, half, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Subtle agricultural sector wedges (pie slices typical of center-pivot staggered planting)
  const sectorCount = 6;
  for (let s = 0; s < sectorCount; s++) {
    const startA = (s * Math.PI * 2) / sectorCount;
    const endA = ((s + 1) * Math.PI * 2) / sectorCount;
    const alpha = s % 2 === 0 ? 0.05 : -0.05;
    ctx.fillStyle = alpha > 0 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${-alpha})`;
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.arc(half, half, half - 2, startA, endA);
    ctx.closePath();
    ctx.fill();
  }

  // Wet soil / freshly irrigated trailing wedge behind active boom
  const boomRad = ((plot.boomAngleDeg - 90) * Math.PI) / 180;
  if (plot.irrigating && plot.cropType !== 'Fallow') {
    const grad = ctx.createConicGradient(boomRad - 0.65, half, half);
    grad.addColorStop(0, 'rgba(6, 78, 120, 0)');
    grad.addColorStop(0.11, layer === 'thermal_et' ? 'rgba(14, 165, 233, 0.45)' : 'rgba(10, 48, 70, 0.35)');
    grad.addColorStop(0.14, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Nozzle stress sector if nozzle health < 92%
  if (plot.nozzleHealthPct < 92 && plot.cropType !== 'Fallow') {
    ctx.strokeStyle =
      layer === 'ndvi' || layer === 'smap_root'
        ? 'rgba(239, 68, 68, 0.55)'
        : 'rgba(180, 130, 70, 0.42)';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(half, half, half * 0.72, 0.5, 1.35);
    ctx.stroke();
  }

  // 3 concentric pivot wheel tracks (authentic desert sand ruts)
  const wheelRadii = [half * 0.34, half * 0.62, half * 0.88];
  ctx.strokeStyle = 'rgba(185, 152, 108, 0.52)';
  ctx.lineWidth = 2.4;
  for (const wr of wheelRadii) {
    ctx.beginPath();
    ctx.arc(half, half, wr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center service road radius line
  ctx.strokeStyle = 'rgba(196, 166, 122, 0.65)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(half, half);
  ctx.lineTo(half, size);
  ctx.stroke();

  // Outer perimeter ring edge
  ctx.strokeStyle = 'rgba(210, 180, 135, 0.65)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(half, half, half - 3, 0, Math.PI * 2);
  ctx.stroke();

  // Crisp GIS survey code tag near southern service road entrance
  ctx.fillStyle = 'rgba(11, 17, 23, 0.72)';
  ctx.fillRect(half - 34, size - 44, 68, 24);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(half - 34, size - 44, 68, 24);
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plot.plotCode, half, size - 32);

  ctx.restore();
}

interface PlotSceneRig {
  plotId: string;
  discMesh: THREE.Mesh;
  discCanvas: HTMLCanvasElement;
  discTexture: THREE.CanvasTexture;
  boundaryRing: THREE.Mesh;
  pivotGroup: THREE.Group;
  boomArmGroup: THREE.Group;
  sprayMesh: THREE.Mesh;
  boomAngleRad: number;
  irrigating: boolean;
}

export class OwainatSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pickableMeshes: THREE.Mesh[] = [];
  private plotRigs = new Map<string, PlotSceneRig>();
  private boundaryGroup = new THREE.Group();

  private frameId = 0;
  private isDisposed = false;
  private renderBusy = false;
  private renderDirty = false;
  private lastTickTime = performance.now();
  private isPaused = false;
  private currentLayer: AnalysisLayer = 'satellite';
  private showBoundaries = true;

  // Smooth camera transition state
  private cameraTweenActive = false;
  private camTargetPos = new THREE.Vector3();
  private camTargetLook = new THREE.Vector3();

  private onSelectPlot: (plotId: string) => void;
  private onContextIssue?: (lost: boolean) => void;
  private disposables: Array<{ dispose: () => void }> = [];

  private pointerDownPos = { x: 0, y: 0 };

  constructor(
    container: HTMLElement,
    initialPlots: FarmPlot[],
    onSelectPlot: (plotId: string) => void,
    onContextIssue?: (lost: boolean) => void,
  ) {
    this.container = container;
    this.onSelectPlot = onSelectPlot;
    this.onContextIssue = onContextIssue;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd8c3a3, 0.0022);

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 900);
    this.camera.position.set(108, 86, 128);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minDistance = 18;
    this.controls.maxDistance = 260;
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener('start', () => {
      this.cameraTweenActive = false;
    });
    this.controls.addEventListener('change', () => {
      this.requestRender();
    });

    // Studio environment reflection (mandatory on every device)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    pmremGenerator.dispose();

    this.setupSkyAndLighting();
    this.buildTerrain();
    this.buildRoadsAndCanal();
    this.buildBoundaryPerimeter();
    this.buildPumpStationAndSolar();
    this.buildTelemetryTower();
    this.buildWindbreakTrees();
    this.buildPlotRigs(initialPlots);

    this.scene.add(this.boundaryGroup);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.requestRender();
    this.startLoop();
  }

  private setupSkyAndLighting() {
    const sky = new Sky();
    sky.scale.setScalar(1200);
    this.scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 6.5;
    skyUniforms['rayleigh'].value = 1.6;
    skyUniforms['mieCoefficient'].value = 0.008;
    skyUniforms['mieDirectionalG'].value = 0.82;

    const sunPos = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90 - 42);
    const theta = THREE.MathUtils.degToRad(142);
    sunPos.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sunPos);

    // Warm Saharan sun key light + cool sky/desert ground hemisphere fill
    const hemi = new THREE.HemisphereLight(0x9bd0ff, 0xc99c6b, 0.72);
    this.scene.add(hemi);

    const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sunLight.position.set(110, 125, 85);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 20;
    sunLight.shadow.camera.far = 340;
    const d = 115;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    rimLight.position.set(-90, 45, -100);
    this.scene.add(rimLight);
  }

  private buildTerrain() {
    const segs = 96;
    const geo = new THREE.PlaneGeometry(340, 340, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, groundHeightAt(x, z));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const texLoader = new THREE.TextureLoader();
    const desertTex = texLoader.load(desertTileUrl, () => {
      this.requestRender();
    });
    desertTex.colorSpace = THREE.SRGBColorSpace;
    desertTex.wrapS = THREE.RepeatWrapping;
    desertTex.wrapT = THREE.RepeatWrapping;
    desertTex.repeat.set(11, 11);
    desertTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const bumpTex = createSandBumpTexture();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: desertTex,
      bumpMap: bumpTex,
      bumpScale: 0.35,
      roughness: 0.92,
      metalness: 0.02,
    });

    const terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    this.disposables.push(geo, mat, desertTex, bumpTex);
  }

  private buildRoadsAndCanal() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xa68a64,
      roughness: 0.94,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.disposables.push(roadMat);

    // Main East-West haul tracks
    const ewZPositions = [-63, -20.5, 20.5, 63];
    for (const z of ewZPositions) {
      const roadGeo = new THREE.PlaneGeometry(176, 1.3);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(0, 0.03, z);
      road.receiveShadow = true;
      this.scene.add(road);
      this.disposables.push(roadGeo);
    }

    // North-South service tracks
    const nsXPositions = [-84, -40.8, 0, 40.8, 84];
    for (const x of nsXPositions) {
      const roadGeo = new THREE.PlaneGeometry(1.3, 130);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(x, 0.035, 0);
      road.receiveShadow = true;
      this.scene.add(road);
      this.disposables.push(roadGeo);
    }

    // Main Nubian Aquifer concrete feeder canal along west flank
    const canalBedGeo = new THREE.BoxGeometry(2.2, 0.35, 134);
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85,
      metalness: 0.08,
    });
    const canalBed = new THREE.Mesh(canalBedGeo, concreteMat);
    canalBed.position.set(-88, 0.16, 0);
    this.scene.add(canalBed);

    const waterGeo = new THREE.PlaneGeometry(1.4, 132);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.35,
    });
    const waterStrip = new THREE.Mesh(waterGeo, waterMat);
    waterStrip.position.set(-88, 0.35, 0);
    this.scene.add(waterStrip);

    this.disposables.push(canalBedGeo, concreteMat, waterGeo, waterMat);
  }

  private buildBoundaryPerimeter() {
    // Estimated concession boundary rectangle covering 16.8 km2 around 22.5833 N, 28.6667 E
    const minX = -94;
    const maxX = 88;
    const minZ = -68;
    const maxZ = 68;

    const pts: THREE.Vector3[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const x = THREE.MathUtils.lerp(minX, maxX, i / steps);
      pts.push(new THREE.Vector3(x, groundHeightAt(x, minZ) + 0.45, minZ));
    }
    for (let i = 0; i <= steps; i++) {
      const z = THREE.MathUtils.lerp(minZ, maxZ, i / steps);
      pts.push(new THREE.Vector3(maxX, groundHeightAt(maxX, z) + 0.45, z));
    }
    for (let i = 0; i <= steps; i++) {
      const x = THREE.MathUtils.lerp(maxX, minX, i / steps);
      pts.push(new THREE.Vector3(x, groundHeightAt(x, maxZ) + 0.45, maxZ));
    }
    for (let i = 0; i <= steps; i++) {
      const z = THREE.MathUtils.lerp(maxZ, minZ, i / steps);
      pts.push(new THREE.Vector3(minX, groundHeightAt(minX, z) + 0.45, z));
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const perimeterLine = new THREE.Line(lineGeo, lineMat);
    this.boundaryGroup.add(perimeterLine);

    // 8 Composite 3-part Survey Beacon Pylons along the estimated concession boundary
    const beaconCoords: Array<[number, number]> = [
      [minX, minZ],
      [0, minZ],
      [maxX, minZ],
      [maxX, 0],
      [maxX, maxZ],
      [0, maxZ],
      [minX, maxZ],
      [minX, 0],
    ];

    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8);
    const postGeo = new THREE.CylinderGeometry(0.16, 0.18, 3.2, 8);
    const capGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.35, 12);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.1 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.3,
    });

    for (const [bx, bz] of beaconCoords) {
      const pylon = new THREE.Group();
      const gy = groundHeightAt(bx, bz);
      pylon.position.set(bx, gy, bz);

      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.3;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 1.9;
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 3.65;

      pylon.add(base, post, cap);
      this.boundaryGroup.add(pylon);
    }

    this.disposables.push(lineGeo, lineMat, baseGeo, postGeo, capGeo, baseMat, postMat, capMat);
  }

  private buildPumpStationAndSolar() {
    // Nubian Aquifer Booster Pump Station + Solar Array (10-part composite THREE.Group)
    const station = new THREE.Group();
    const sx = -96;
    const sz = -16;
    station.position.set(sx, groundHeightAt(sx, sz), sz);

    const padGeo = new THREE.BoxGeometry(10, 0.4, 14);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.05 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.2;
    pad.receiveShadow = true;

    const houseGeo = new THREE.BoxGeometry(4.6, 2.8, 5.2);
    const houseMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.65, metalness: 0.15 });
    const house = new THREE.Mesh(houseGeo, houseMat);
    house.position.set(-1.5, 1.8, -3.2);
    house.castShadow = true;

    const roofGeo = new THREE.BoxGeometry(5.1, 0.25, 5.7);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-1.5, 3.3, -3.2);

    const tankGeo = new THREE.CylinderGeometry(1.1, 1.1, 3.8, 16);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.32, metalness: 0.55 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(2.1, 1.5, -3.4);
    tank.castShadow = true;

    const pipeGeo = new THREE.CylinderGeometry(0.28, 0.28, 7.2, 12);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.85 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(3.8, 1.0, -3.4);

    station.add(pad, house, roof, tank, pipe);

    // 6 Solar PV racks beside pump house
    const rackPostGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6);
    const panelGeo = new THREE.BoxGeometry(2.6, 0.08, 1.6);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.18,
      metalness: 0.72,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.35, metalness: 0.75 });

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const px = -2.6 + c * 2.8;
        const pz = 2.0 + r * 2.8;
        const post = new THREE.Mesh(rackPostGeo, frameMat);
        post.position.set(px, 0.8, pz);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(px, 1.45, pz);
        panel.rotation.x = 0.42;
        panel.castShadow = true;
        station.add(post, panel);
      }
    }

    this.scene.add(station);
    this.disposables.push(
      padGeo,
      padMat,
      houseGeo,
      houseMat,
      roofGeo,
      roofMat,
      tankGeo,
      tankMat,
      pipeGeo,
      pipeMat,
      rackPostGeo,
      panelGeo,
      panelMat,
      frameMat,
    );
  }

  private buildTelemetryTower() {
    // Agronomy Telemetry & SMAP Calibration Tower (6-part composite group)
    const tower = new THREE.Group();
    const tx = -95;
    const tz = 24;
    tower.position.set(tx, groundHeightAt(tx, tz), tz);

    const cabinGeo = new THREE.BoxGeometry(4.2, 2.3, 3.6);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65, metalness: 0.1 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.15, 0);
    cabin.castShadow = true;

    const mastGeo = new THREE.CylinderGeometry(0.14, 0.35, 9.5, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(2.8, 4.75, 0);
    mast.castShadow = true;

    const crossGeo = new THREE.BoxGeometry(2.4, 0.1, 0.1);
    const cross = new THREE.Mesh(crossGeo, mastMat);
    cross.position.set(2.8, 8.8, 0);

    const dishGeo = new THREE.SphereGeometry(0.75, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.45,
      side: THREE.DoubleSide,
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(2.8, 7.3, 0.5);
    dish.rotation.x = Math.PI * 0.65;

    const beaconGeo = new THREE.SphereGeometry(0.18, 10, 10);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(2.8, 9.6, 0);

    tower.add(cabin, mast, cross, dish, beacon);
    this.scene.add(tower);
    this.disposables.push(
      cabinGeo,
      cabinMat,
      mastGeo,
      mastMat,
      crossGeo,
      dishGeo,
      dishMat,
      beaconGeo,
      beaconMat,
    );
  }

  private buildWindbreakTrees() {
    // InstancedMesh Casuarina windbreak trees along the western windward flank
    const count = 44;
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 2.2, 6);
    trunkGeo.translate(0, 1.1, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9, metalness: 0.0 });

    const crownGeo = new THREE.ConeGeometry(0.95, 3.6, 7);
    crownGeo.translate(0, 3.4, 0);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.0 });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
    trunks.castShadow = !this.isSoftwareGl;
    crowns.castShadow = !this.isSoftwareGl;

    for (let i = 0; i < count; i++) {
      const z = -64 + i * 3.0;
      const x = -85.8 + (i % 2) * 0.9;
      const y = groundHeightAt(x, z);
      const scaleVar = 0.85 + ((i * 37) % 30) / 100; // +-15% variation
      _dummy.position.set(x, y, z);
      _dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
      _dummy.scale.set(scaleVar, scaleVar, scaleVar);
      _dummy.updateMatrix();
      trunks.setMatrixAt(i, _dummy.matrix);
      crowns.setMatrixAt(i, _dummy.matrix);

      _color.setHSL(0.28 + ((i % 5) - 2) * 0.012, 0.42, 0.26 + (i % 3) * 0.03);
      crowns.setColorAt(i, _color);
    }

    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();

    this.scene.add(trunks, crowns);
    this.disposables.push(trunkGeo, trunkMat, crownGeo, crownMat);
  }

  private buildPlotRigs(plots: FarmPlot[]) {
    // Shared materials & sub-geometries for center-pivot irrigation towers
    const padGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.35, 10);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85, metalness: 0.1 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.82 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45, metalness: 0.7 });
    const tireGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 10);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.05 });
    const sprayMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.disposables.push(padGeo, padMat, pipeMat, legMat, tireGeo, tireMat, sprayMat);

    for (const plot of plots) {
      const rScene = plot.radiusMeters / SCENE_METERS_PER_UNIT;
      const baseY = groundHeightAt(plot.sceneX, plot.sceneZ);

      // 1. Satellite / SMAP Plot Circle Surface
      const discCanvas = document.createElement('canvas');
      discCanvas.width = 512;
      discCanvas.height = 512;
      paintPlotCanvasTexture(discCanvas, plot, this.currentLayer);

      const discTexture = new THREE.CanvasTexture(discCanvas);
      discTexture.colorSpace = THREE.SRGBColorSpace;
      discTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      const discGeo = new THREE.CircleGeometry(rScene, 48);
      discGeo.rotateX(-Math.PI / 2);
      const discMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: discTexture,
        roughness: 0.82,
        metalness: 0.04,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.position.set(plot.sceneX, baseY + 0.06, plot.sceneZ);
      discMesh.receiveShadow = true;
      discMesh.userData.plotId = plot.id;
      this.scene.add(discMesh);
      this.pickableMeshes.push(discMesh);

      // 2. Estimated Plot Boundary Highlight Ring
      const ringGeo = new THREE.RingGeometry(rScene + 0.18, rScene + 0.45, 56);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const boundaryRing = new THREE.Mesh(ringGeo, ringMat);
      boundaryRing.position.set(plot.sceneX, baseY + 0.1, plot.sceneZ);
      this.boundaryGroup.add(boundaryRing);

      // 3. Composite 3-12 Part Center-Pivot Irrigation Rig (THREE.Group)
      const pivotGroup = new THREE.Group();
      pivotGroup.position.set(plot.sceneX, baseY + 0.06, plot.sceneZ);

      const wellPad = new THREE.Mesh(padGeo, padMat);
      wellPad.position.y = 0.17;
      pivotGroup.add(wellPad);

      const riserGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.35, 8);
      const riser = new THREE.Mesh(riserGeo, pipeMat);
      riser.position.y = 0.72;
      riser.castShadow = !this.isSoftwareGl;
      pivotGroup.add(riser);

      // Rotating Boom Arm Group
      const boomArmGroup = new THREE.Group();
      const boomLen = rScene * 0.94;

      // Overhead steel main span pipe
      const spanGeo = new THREE.CylinderGeometry(0.09, 0.09, boomLen, 8);
      spanGeo.rotateX(Math.PI / 2);
      const span = new THREE.Mesh(spanGeo, pipeMat);
      span.position.set(0, 1.35, boomLen / 2);
      span.castShadow = !this.isSoftwareGl;
      boomArmGroup.add(span);

      // 3 Wheeled A-Frame Support Towers along the boom
      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.45, 6);
      const axleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.15, 6);
      axleGeo.rotateZ(Math.PI / 2);

      const towerFractions = [0.33, 0.64, 0.93];
      for (const frac of towerFractions) {
        const tz = boomLen * frac;
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.26, 0.72, tz);
        leftLeg.rotation.z = -0.34;

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.26, 0.72, tz);
        rightLeg.rotation.z = 0.34;

        const axle = new THREE.Mesh(axleGeo, legMat);
        axle.position.set(0, 0.26, tz);

        const tireL = new THREE.Mesh(tireGeo, tireMat);
        tireL.position.set(-0.56, 0.26, tz);
        const tireR = new THREE.Mesh(tireGeo, tireMat);
        tireR.position.set(0.56, 0.26, tz);

        boomArmGroup.add(leftLeg, rightLeg, axle, tireL, tireR);
      }

      // Translucent Water Spray Mist Wedge underneath boom
      const sprayGeo = new THREE.PlaneGeometry(1.6, boomLen * 0.92);
      sprayGeo.rotateX(-Math.PI / 2);
      const sprayMesh = new THREE.Mesh(sprayGeo, sprayMat);
      sprayMesh.position.set(0, 0.65, boomLen * 0.5);
      sprayMesh.visible = plot.irrigating;
      boomArmGroup.add(sprayMesh);

      const initialRad = THREE.MathUtils.degToRad(plot.boomAngleDeg);
      boomArmGroup.rotation.y = initialRad;
      pivotGroup.add(boomArmGroup);
      this.scene.add(pivotGroup);

      this.plotRigs.set(plot.id, {
        plotId: plot.id,
        discMesh,
        discCanvas,
        discTexture,
        boundaryRing,
        pivotGroup,
        boomArmGroup,
        sprayMesh,
        boomAngleRad: initialRad,
        irrigating: plot.irrigating,
      });

      this.disposables.push(
        discGeo,
        discMat,
        discTexture,
        ringGeo,
        ringMat,
        riserGeo,
        spanGeo,
        legGeo,
        axleGeo,
        sprayGeo,
      );
    }
  }

  public updatePlots(plots: FarmPlot[], selectedPlotId: string | null) {
    for (const plot of plots) {
      const rig = this.plotRigs.get(plot.id);
      if (!rig) continue;

      rig.irrigating = plot.irrigating;
      rig.sprayMesh.visible = plot.irrigating && plot.cropType !== 'Fallow';

      const ringMat = rig.boundaryRing.material as THREE.MeshBasicMaterial;
      const isSelected = plot.id === selectedPlotId;
      ringMat.color.setHex(isSelected ? 0xf59e0b : 0x38bdf8);
      ringMat.opacity = isSelected ? 0.95 : 0.32;

      paintPlotCanvasTexture(rig.discCanvas, plot, this.currentLayer);
      rig.discTexture.needsUpdate = true;
    }
    this.requestRender();
  }

  public setAnalysisLayer(layer: AnalysisLayer, plots: FarmPlot[]) {
    this.currentLayer = layer;
    for (const plot of plots) {
      const rig = this.plotRigs.get(plot.id);
      if (!rig) continue;
      paintPlotCanvasTexture(rig.discCanvas, plot, layer);
      rig.discTexture.needsUpdate = true;
    }
    this.requestRender();
  }

  public setShowBoundaries(show: boolean) {
    this.showBoundaries = show;
    this.boundaryGroup.visible = show;
    this.requestRender();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.requestRender();
  }

  public setCameraPreset(preset: CameraPreset, selectedPlot?: FarmPlot | null) {
    if (preset === 'overview') {
      this.camTargetPos.set(108, 86, 128);
      this.camTargetLook.set(0, 0, 0);
    } else if (preset === 'flyover') {
      this.camTargetPos.set(-116, 28, 72);
      this.camTargetLook.set(18, 2, -12);
    } else if (preset === 'nadir') {
      this.camTargetPos.set(0, 178, 8);
      this.camTargetLook.set(0, 0, 0);
    } else if (preset === 'focus' && selectedPlot) {
      const baseY = groundHeightAt(selectedPlot.sceneX, selectedPlot.sceneZ);
      this.camTargetPos.set(selectedPlot.sceneX + 26, baseY + 18, selectedPlot.sceneZ + 28);
      this.camTargetLook.set(selectedPlot.sceneX, baseY + 1, selectedPlot.sceneZ);
    }
    this.cameraTweenActive = true;
    this.requestRender();
  }

  private bindEvents() {
    const dom = this.renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist > 6) return; // Ignore orbit drag
      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.pickableMeshes, false);
      if (hits.length > 0) {
        const plotId = hits[0].object.userData.plotId as string | undefined;
        if (plotId) {
          this.onSelectPlot(plotId);
        }
      }
    };

    const onResize = () => {
      if (this.isDisposed) return;
      const w = Math.max(320, this.container.clientWidth);
      const h = Math.max(240, this.container.clientHeight);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.requestRender();
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      this.onContextIssue?.(true);
    };

    const onContextRestored = () => {
      this.onContextIssue?.(false);
      this.requestRender();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('webglcontextlost', onContextLost);
    dom.addEventListener('webglcontextrestored', onContextRestored);
    window.addEventListener('resize', onResize);

    this.disposables.push({
      dispose: () => {
        dom.removeEventListener('pointerdown', onPointerDown);
        dom.removeEventListener('pointerup', onPointerUp);
        dom.removeEventListener('webglcontextlost', onContextLost);
        dom.removeEventListener('webglcontextrestored', onContextRestored);
        window.removeEventListener('resize', onResize);
      },
    });
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private stepSimulation(deltaSec: number): boolean {
    let anyActive = false;

    if (!this.isPaused) {
      this.plotRigs.forEach((rig) => {
        if (rig.irrigating && rig.sprayMesh.visible) {
          rig.boomAngleRad += deltaSec * 0.14; // Smooth visible center-pivot rotation
          rig.boomArmGroup.rotation.y = rig.boomAngleRad;
          anyActive = true;
        }
      });
    }

    if (this.cameraTweenActive) {
      const alpha = 1 - Math.exp(-5.5 * deltaSec);
      this.camera.position.lerp(this.camTargetPos, alpha);
      this.controls.target.lerp(this.camTargetLook, alpha);
      _vec3A.copy(this.camera.position).sub(this.camTargetPos);
      _vec3B.copy(this.controls.target).sub(this.camTargetLook);
      if (_vec3A.lengthSq() < 0.08 && _vec3B.lengthSq() < 0.04) {
        this.camera.position.copy(this.camTargetPos);
        this.controls.target.copy(this.camTargetLook);
        this.cameraTweenActive = false;
      } else {
        anyActive = true;
      }
    }

    return anyActive;
  }

  public requestRender() {
    if (this.isDisposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame(() => {
      if (this.isDisposed) return;
      this.renderDirty = false;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      const done = () => {
        this.renderBusy = false;
        if (this.renderDirty && !this.isDisposed) {
          this.requestRender();
        }
      };
      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  private startLoop() {
    const tick = () => {
      if (this.isDisposed) return;
      const now = performance.now();
      const delta = Math.min(0.15, (now - this.lastTickTime) / 1000);
      this.lastTickTime = now;

      const needsFrame = this.stepSimulation(delta);
      if (needsFrame) {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        if (this.isSoftwareGl) {
          this.afterDraw(tick);
        } else {
          this.frameId = requestAnimationFrame(tick);
        }
      } else {
        // Idle pause: check lightly at 250ms rather than spinning CPU
        this.frameId = window.setTimeout(tick, 250);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.controls.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
