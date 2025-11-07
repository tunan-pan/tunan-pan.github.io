document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE === 'undefined') {
        console.error('THREE is not loaded!');
        return;
    }

    const container = document.getElementById('three-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1,1,1).normalize();
    scene.add(light);

    const loader = new THREE.GLTFLoader();
    loader.load('model.glb', function(gltf){
        scene.add(gltf.scene);
        animate();
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
});
