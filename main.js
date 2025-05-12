// main.js

// Import Three.js and necessary components from a CDN (esm.sh)
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
const hotpoints = []; // Array to store hotpoint MESH objects (important for raycasting) // Keep this
let model; // Variable to store the loaded model

function init() {
    // ... (Scene, Camera, Renderer, Controls, Lighting setup - NO CHANGES HERE) ...
    // ...
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Use the camera position you found worked best
    camera.position.set(10, -1, 18); // Or your preferred values

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        sceneContainer.appendChild(renderer.domElement);
    } else {
        console.error("Scene container not found!");
        return;
    }

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // ... (other controls settings)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    // ...

    // 6. Load 3D Model (GLTF/GLB)
    const loader = new GLTFLoader();
    loader.load(
        'ASSETS/building_model.glb', // <<< ENSURE THIS PATH IS CORRECT
        function (gltf) {
            model = gltf.scene; // Store the loaded model globally within this script
            scene.add(model);
            console.log('Model loaded successfully!', model);

            // After model loads, add hotpoints
            addHotpoints(); // << UNCOMMENT THIS
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened while loading the model:', error);
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 1, 0);
            scene.add(cube);
        }
    );

    window.addEventListener('resize', onWindowResize, false);
    
    // Add event listener for mouse clicks for hotpoint interaction
    // Make sure 'renderer.domElement' is the element that receives clicks
    renderer.domElement.addEventListener('click', onMouseClick, false); // << UNCOMMENT & ENSURE THIS IS ON renderer.domElement

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) {
        controls.update();
    }
    renderer.render(scene, camera);
}

// --- Hotpoint related functions ---

function addHotpoints() {
    if (!model) {
        console.warn("Model not loaded yet, cannot add hotpoints.");
        return;
    }

    // --- DEFINE YOUR HOTPOINTS HERE ---
    // Each hotpoint needs:
    // - A 3D position (x, y, z) - relative to your model's origin or scene origin
    // - A URL to navigate to
    // - Optional: A name or description

    const hotpointData = [
        {
            position: new THREE.Vector3(2,10, -25.5), // X, Y, Z - YOU MUST ADJUST THESE!
            url: 'panorama.html?view=room1',
            name: 'Data Center'
        },
        {
            position: new THREE.Vector3(2, 1.5, -21), // X, Y, Z - YOU MUST ADJUST THESE!
            url: 'panorama.html?view=server_hall_A',
            name: 'Entrance Facilities'
        }
        // Add more hotpoint objects as needed
    ];

    const hotpointGeometry = new THREE.SphereGeometry(0.35, 16, 16); // Size of the sphere
    const hotpointMaterial = new THREE.MeshBasicMaterial({ color: 0xff2200 }); // Red color

    hotpointData.forEach(hpData => {
        const hotpointMesh = new THREE.Mesh(hotpointGeometry, hotpointMaterial.clone()); // Use clone for material if you change colors later
        hotpointMesh.position.copy(hpData.position);
        hotpointMesh.userData = { url: hpData.url, name: hpData.name }; // Store URL and name

        // OPTIONAL: Add hotpoint as a child of the model
        // This means if the model moves, the hotpoints move with it.
        // If your hotpoint positions are relative to the world, add to scene directly.
        // model.add(hotpointMesh); // If positions are relative to model's local origin
        scene.add(hotpointMesh);    // If positions are relative to the world/scene origin (simpler to start)

        hotpoints.push(hotpointMesh); // Add the MESH to the array for raycasting
        console.log(`Added hotpoint: ${hpData.name} at`, hpData.position);
    });
}

function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    const mouse = new THREE.Vector2();
    
    // The event listener is on renderer.domElement, so event.clientX/Y are relative to the canvas
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with objects in the 'hotpoints' array
    const intersects = raycaster.intersectObjects(hotpoints);

    if (intersects.length > 0) {
        // The first object intersected is the closest one
        const clickedHotpoint = intersects[0].object;
        if (clickedHotpoint.userData.url) {
            console.log("Clicked hotpoint:", clickedHotpoint.userData.name, "Navigating to:", clickedHotpoint.userData.url);
            window.location.href = clickedHotpoint.userData.url; // Navigate to the URL
        }
    }
}

// --- Initialize ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}