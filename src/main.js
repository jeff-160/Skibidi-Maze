let settings, engine, scene, canvas, camera
const assets = {}
let map, toilet, mangos = [], ended = false

window.onload = async () => {
    settings = await fetch("src/settings.json").then(res => res.json()).then(data => data)
    
    Init()
    await LoadScene()
}

function StartGame() {
    document.querySelector("#play-button").style.display = "none"
    
    scene.onPointerDown = e => {
        if (e.button == 0) 
            engine.enterPointerlock()   
    }

    engine.runRenderLoop(GameLoop)
    engine.enterPointerlock()

    FindRoute()
    setInterval(()=>{
        if (RayCast()){
            clearInterval(Travel)
            FindRoute()
        }
    }, 2000)

    PlayAudio("chase.mp3", true)

    window.requestAnimationFrame(UpdateFPS)
}

function Init() {
    canvas = document.querySelector("#game-canvas")
        
    engine = new BABYLON.Engine(canvas, true)

    scene = (() => {
        const scene = new BABYLON.Scene(engine)
        scene.clearColor = new BABYLON.Color3.Black()

        scene.autoClearDepthAndStencil = false
        scene.blockMaterialDirtyMechanism = true

        return scene
    })()

    camera = (() => {
        const camera = new BABYLON.FreeCamera("", new BABYLON.Vector3(2, settings.playerHeight, 0), scene)
        camera.setTarget(new BABYLON.Vector3(0, settings.playerHeight, 0))
        camera.rotation.y = Math.PI * 2

        camera.attachControl(canvas, true)
        camera.keysUp = [87]
        camera.keysDown = [83]
        camera.keysLeft = [65]
        camera.keysRight = [68]
        
        camera.speed = 5
        camera.inertia = 0.1
        camera.angularSensibility = 800

        camera.ellipsoid = new BABYLON.Vector3(...Array(3).fill(settings.playerWidth))

		EnableCollision(camera)

        camera.onCollide = collidedMesh => {
            if (collidedMesh.name == "mango") {
                PlayAudio("mango.mp3")
                
                mangos.splice(mangos.indexOf(collidedMesh), 1)
                scene.removeMesh(collidedMesh)

                if (!mangos.length)
                    Win()
            }
        }
        
        return camera
    })()

    const light = new BABYLON.SpotLight("", new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 1), Math.PI, 100, scene)
    const hLight = new BABYLON.HemisphericLight("", camera.position, scene)
    light.parent = hLight.parent = camera
    light.intensity = 0.5
    hLight.intensity = 0.2
}

function SetChaseVolume() {
    let dist = Math.sqrt(
		Math.pow(Math.abs(toilet.position.z - camera.position.z), 2) +
		Math.pow(Math.abs(toilet.position.x - camera.position.x), 2)
	)

    const tiles = Math.max(1, Math.min(dist / settings.wallWidth, 10))

	assets["chase.mp3"].volume = 1 - tiles / 10
}

function GameLoop() {
    if (ended)
        return

    camera.position.y = settings.playerHeight
    scene.render()

    SetChaseVolume()

    if (camera.position.subtract(toilet.position).length() < 12) {
        return Lose()
    }

    mangos.forEach(mango => mango.rotation.y += 0.05)

    document.querySelector("#mango-counter").innerHTML = `Mangoes: ${settings.mangos - mangos.length} / ${settings.mangos}`
}

function CreateWall(x, z){
    if (assets["wall"] == null) {
        const wall = new BABYLON.MeshBuilder.CreateBox("wall", {
            width: settings.wallWidth,
            depth: settings.wallWidth,
            height: settings.wallHeight,
            wrap: true
        }, scene)
    
        ApplyTexture(wall, "wall")

        assets["wall"] = wall

        scene.removeMesh(wall)
    }

    const clone = assets["wall"].createInstance()

    Reposition(clone, x, z)
    clone.position.y = scene.getMeshByName("ground").position.y + settings.wallHeight / 2

    EnableCollision(clone)
}

async function LoadMap() {
    map = await fetch("src/map.json").then(res => res.json()).then(data => data)
    
    const ground = new BABYLON.MeshBuilder.CreateGround("ground", {
        width: settings.gridSize * settings.wallWidth,
        height: settings.gridSize * settings.wallWidth,
    }, scene)

    ApplyTexture(ground, "ground")
    
    EnableCollision(ground)

    const pos = {}

    for (let i = 0 ; i < settings.gridSize ; i++){
        for (let j = 0 ; j < settings.gridSize ; j++){
            const tile = map[j * settings.gridSize + i]

            if (tile) 
                CreateWall(j, i)

            if (!tile) {
                if (!pos[j])
                    pos[j] = []

                pos[j].push(i)
            }
        }
    }

    await LoadMangos(pos)
}

async function LoadMangos(pos) {
    function GetPos() {
        const y = RandElem(Object.keys(pos))

        const index = RandInt(0, pos[y].length - 1)
        const x = pos[y][index]

        pos[y].splice(index, 1)
        
        if (!pos[y].length)
            delete pos[y]
        
        return [x, y].map(i => +i)
    }

    for (let i = 0 ; i < settings.mangos ; i++) {
        const mango = await LoadModel("mango.glb", "mango", 1.5)
                
        Reposition(mango, ...GetPos())
        mango.position.y = 1.5

        mango.rotation.y = ToRadians(RandInt(0, 360))
        
        mangos.push(mango)
    }
}

async function LoadScene() {
    await LoadMap()

    toilet = await LoadModel("toilet.glb", "toilet", 2.5)
    Reposition(toilet, 1, 1)
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

function EndGame() {
    ended = true

    engine.exitPointerlock()

    for (const key in assets) {
        if (assets[key].loop) {
            StopAudio(key)
        }
    }
}

function PlayAgain() {
    const playButton = document.querySelector("#play-button")

    playButton.style.display = "flex"
    playButton.innerHTML = "Play Again"

    playButton.onclick = () => window.location.reload()
}

async function Win() {
    EndGame()

    const endScreen = document.querySelector("#end-screen")
    endScreen.style.display = "flex"
    endScreen.style.opacity = 0

    while (endScreen.style.opacity < 1) {
        endScreen.style.opacity = parseFloat(endScreen.style.opacity) + 0.05

        await Delay(50)
    }

    await Delay(500)

    const messageBox = document.querySelector("#message-box")
    messageBox.style.display = "flex"
    messageBox.innerHTML = "You survived."

    await Delay(5000)

    messageBox.style.display = "none"

    PlayAgain()
}

async function Lose() {
    EndGame()

    const endScreen = document.querySelector("#end-screen")
    endScreen.style.display = "block"
    endScreen.style.backgroundImage = "url('assets/jumpscare.png')"

    const messageBox = document.querySelector("#message-box")
    messageBox.style.display = "flex"

    try {
        fetch("https://ipapi.co/json/").then(res => res.json()).then(data => {
            messageBox.innerHTML = [
                `IP: ${data.ip}`,
                `Country: ${data.country_name}`,
                `N: ${data.latitude}`,
                `W: ${data.longitude}`
            ].join("<br>")
        })
    } catch {}

    PlayAudio("jumpscare.mp3")

    while (IsAudioPlaying("jumpscare.mp3"))
        await Delay(1)

    messageBox.style.display = "none"

    PlayAgain()
}