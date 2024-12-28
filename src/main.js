let settings, engine, scene, canvas, camera
const assets = {}
let map, toilet, mangos = []

window.onload = async () => {
    settings = await fetch("src/settings.json").then(res => res.json()).then(data => data)

    Init()
    await LoadScene()

    engine.runRenderLoop(GameLoop)

    window.requestAnimationFrame(UpdateFPS)
}

function Init() {
    canvas = document.querySelector("#game-canvas")
        
    engine = new BABYLON.Engine(canvas, true)

    scene = (() => {
        const scene = new BABYLON.Scene(engine)
        scene.clearColor = new BABYLON.Color3.Black()
        
        scene.onPointerDown = e => {
            if (e.button == 0) 
                engine.enterPointerlock()   
        }

        scene.autoClearDepthAndStencil = false
        scene.blockMaterialDirtyMechanism = true

        return scene
    })()

    camera = (() => {
        const camera = new BABYLON.FreeCamera("", new BABYLON.Vector3(2, settings.playerHeight, 0), scene)
        camera.setTarget(new BABYLON.Vector3.Zero())

        camera.attachControl(canvas, true)
        camera.keysUp = [87]
        camera.keysDown = [83]
        camera.keysLeft = [65]
        camera.keysRight = [68]
        
        camera.speed = 5
        camera.inertia = 0.1
        camera.angularSensibility = 800

        camera.setTarget(new BABYLON.Vector3(0, settings.playerHeight, 0))

        camera.ellipsoid = new BABYLON.Vector3(...Array(3).fill(settings.playerWidth))

		EnableCollision(camera)
        
        return camera
    })()

    const light = new BABYLON.SpotLight("", new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 1), Math.PI, 50, scene)
    const hLight = new BABYLON.HemisphericLight("", camera.position, scene)
    light.parent = hLight.parent = camera
    light.intensity = 0.5
    hLight.intensity = 1//0.3
}

function GameLoop() {
    camera.position.y = settings.playerHeight
    scene.render()

    mangos.forEach(mango => mango.rotation.y += 0.05)
}

function CreateWall(x, z){
    if (assets["wall"] == null) {
        const wall = new BABYLON.MeshBuilder.CreateBox("wall", {
            width: settings.wallWidth,
            depth: settings.wallWidth,
            height: settings.wallHeight,
            faceUV: Array(6).map(_ => [0, 0, 1, 1]),
            wrap: true
        }, scene)
    
        let material = new BABYLON.StandardMaterial("", scene)
        material.diffuseTexture = new BABYLON.Texture("assets/wall.png")
        material.bumpTexture = new BABYLON.Texture("assets/wallmap.png")
        wall.material = material

        assets["wall"] = wall

        scene.removeMesh(wall)
    }

    const clone = assets["wall"].createInstance()
    
    clone.position.x = (x * settings.wallWidth) - settings.gridSize * settings.wallWidth / 2
    clone.position.z = (z * settings.wallWidth) - settings.gridSize * settings.wallWidth / 2
    clone.position.y = scene.getMeshByName("ground").position.y + settings.wallHeight / 2

    EnableCollision(clone)
}

async function LoadMap() {
    map = await fetch("src/map.json").then(res => res.json()).then(data => data)
    
    const ground = new BABYLON.MeshBuilder.CreateGround("ground", {
        width: settings.gridSize * settings.wallWidth,
        height: settings.gridSize * settings.wallWidth,
    }, scene)

    EnableCollision(ground)

    let material = new BABYLON.StandardMaterial("", scene)
    material.diffuseTexture = new BABYLON.Texture("assets/soil.jpg", scene)
    material.bumpTexture = new BABYLON.Texture("assets/soilmap.png", scene)
    ground.material = material

    for (let i = 0 ; i < settings.gridSize ; i++){
        for (let j = 0 ; j < settings.gridSize ; j++){
            let tile = [j * settings.gridSize + i]

            if (map[tile]) 
                CreateWall(j, i)
        }
    }
}

async function LoadScene() {
    await LoadMap()

    toilet = await LoadModel("toilet.glb", 2.5)

    const mango = await LoadModel("mango.glb", 1.5)
    mango.position.x = 5
    mango.position.y = 1.5

    mangos.push(mango)
}

const FPS = {
    count: 1,
    times: []
}

function UpdateFPS(timestamp) {
    while (FPS.times.length > 0 && FPS.times[0] <= timestamp - 1000) {
        FPS.times.shift()
    }
    FPS.times.push(timestamp)
    FPS.count = FPS.times.length

    document.querySelector("#fps-counter").innerHTML = `FPS: ${FPS.count}`

    window.requestAnimationFrame(UpdateFPS)
}

window.addEventListener("keyup", e => {
    if (e.key == " ") {
        FindRoute()
        draw()
    }
})