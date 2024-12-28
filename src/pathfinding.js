function FindRoute(){
	defineNodes({
		position:{
			x: toilet.position.x + (settings.wallWidth * settings.gridSize)/2,
			z: toilet.position.z + (settings.wallWidth * settings.gridSize)/2,
		}
	},{
		position:{
			x: camera.position.x + (settings.wallWidth * settings.gridSize)/2,
			z: camera.position.z + (settings.wallWidth * settings.gridSize)/2,
		}
	})
	
	let nodes = Solve_AStar()
	nodes.forEach(i => {
		i.x = i.x * settings.wallWidth - (settings.wallWidth * settings.gridSize)/2
		i.y = i.y * settings.wallWidth - (settings.wallWidth * settings.gridSize)/2
	})
	
    if (nodes.length)
    	Chase(nodes)
}

let Travel = null

function Chase(nodes, index = 0){
	if (index >= nodes.length) 
        return FindRoute()

	Travel = setInterval(() => {
		let angle = Math.atan2(
			nodes[index].y - toilet.position.x,
			nodes[index].x - toilet.position.z,
		)

		let velocity = {
			x: Math.cos(angle) * settings.toiletSpeed,
			z: Math.sin(angle) * settings.toiletSpeed
		}

		toilet.rotation.y = angle
		toilet.position.x += velocity.z
		toilet.position.z += velocity.x

		if (
			Math.abs(nodes[index].y - toilet.position.x) <= settings.toiletSpeed &&
			Math.abs(nodes[index].x - toilet.position.z) <= settings.toiletSpeed 
		){
			clearInterval(Travel)
			Chase(nodes, index+1)
		}

	}, 20)
}

function RayCast(){
	let direction = toilet.position.subtract(camera.position)
	let ray = new BABYLON.Ray(camera.position, direction, settings.gridSize * settings.wallWidth) 
	return scene.pickWithRay(ray).pickedMesh.name == "toilet"
}