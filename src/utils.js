function EnableCollision(mesh) {
    mesh.collisionsEnabled = mesh.checkCollisions = true
}

async function LoadModel(file, name, scaling = 1) {
    return new Promise(resolve => {
        BABYLON.SceneLoader.ImportMesh("", "assets/", file, scene, meshes => {
            meshes[0].scaling.x = meshes[0].scaling.y = meshes[0].scaling.z = scaling
            
            meshes[0].rotationQuarternion = null
            meshes[0].rotation = new BABYLON.Vector3(0, Math.PI / 2, 0)
            
            meshes[0].position.y = -0.5
            meshes[0].position.z = 3
    
            meshes.forEach(mesh => {
                if (mesh?.material instanceof BABYLON.PBRMaterial) {
                    if (!Object.values(mesh.material.albedoColor).every(i => !i))
                        mesh.material.albedoColor = new BABYLON.Color3.White();
                
                    mesh.material.roughness = 0.5 
                    mesh.material.metallic = 0.5
                }

                EnableCollision(mesh)
                mesh.name = name
            })

            meshes[0].position.y = scene.getMeshByName("ground").position.y - GetHeight(meshes[0])
    
            resolve(meshes[0])
        })
    })
}

function ApplyTexture(mesh, textureName) {
    let material = new BABYLON.StandardMaterial("", scene)
    material.diffuseTexture = new BABYLON.Texture(`assets/${textureName}/texture.png`, scene)
    material.bumpTexture = new BABYLON.Texture(`assets/${textureName}/bump.png`, scene)
    
    mesh.material = material
}

function GetHeight(mesh) {
    const boundingBox = mesh.getBoundingInfo().boundingBox
    
    return boundingBox.maximumWorld.y - boundingBox.minimumWorld.y
}

function Reposition(mesh, x, z) {
    mesh.position.x = x * settings.wallWidth - settings.gridSize * settings.wallWidth / 2
    mesh.position.z = z * settings.wallWidth - settings.gridSize * settings.wallWidth / 2
}

function ToRadians(angle) {
    return angle * (Math.PI / 180)
}

function RandInt(min, max) {
    return ~~(Math.random() * (max - min + 1) + min)
}

function RandElem(list) {
    return list[RandInt(0, list.length - 1)]
}

function StopAudio(src) {
    try {
        assets[src].pause()
        assets[src].currentTime = 0
    } catch {}
}

function PlayAudio(src, loop = false) {
    if (!assets[src]) {
        const audio = new Audio()
        audio.src = `assets/audio/${src}`

        assets[src] = audio
    }

    StopAudio(src)

    assets[src].loop = loop
    
    assets[src].play()
}

function IsAudioPlaying(src) {
    if (!assets[src])
        return false

    return (
        !assets[src].paused && 
        !assets[src].ended
    )
}

async function Delay(interval) {
    return new Promise(resolve => setTimeout(resolve, interval))
}