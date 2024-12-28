function EnableCollision(mesh) {
    mesh.collisionsEnabled = mesh.checkCollisions = true
}

async function LoadModel(file, scaling = 1) {
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
            })

            meshes[0].position.y = scene.getMeshByName("ground").position.y - GetHeight(meshes[0])
    
            resolve(meshes[0])
        })
    })
}

function GetHeight(mesh) {
    const boundingBox = mesh.getBoundingInfo().boundingBox
    
    return boundingBox.maximumWorld.y - boundingBox.minimumWorld.y
}