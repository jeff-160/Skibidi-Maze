class sNode {
	constructor({
		bObstacle = false,
		bVisited = false,
		fGlobalGoal = 0,
		fLocalGoal= 0,
		x,
		y,
		vecNeighbours = [],
		parent=  null,
	}){
		this.bObstacle = bObstacle
		this.bVisited = bVisited
		this.fGlobalGoal = fGlobalGoal
		this.fLocalGoal = fLocalGoal
		this.x = x
		this.y = y
		this.vecNeighbours = vecNeighbours
		this.parent = parent
	}
}

var nodes
var nodeStart
var nodeEnd

var nMapWidth
var nMapHeight


function defineNodes(start, end){
	nMapWidth = nMapHeight = settings.gridSize

	nodes = []	
	nodeStart = null
	nodeEnd = null

	for (var x=0;x<nMapWidth;x++){
		for (var y=0;y<nMapHeight; y++){

			nodes.push(
				new sNode({
					x: y,
					y: x,
					bObstacle: ( map[x*settings.gridSize+y]==1 ? true:false),
					parent: null,
					bVisited: false
				})
			)
		}
	}

	for (var x=0;x<nMapWidth;x++){
		for (var y=0;y<nMapHeight;y++){
			
			if (y>0)
				nodes[y*nMapWidth+x].vecNeighbours.push(nodes[(y-1)*nMapWidth+(x+0)])
			if (y<nMapHeight-1) 
				nodes[y*nMapWidth+x].vecNeighbours.push(nodes[(y+1)*nMapWidth+(x+0)])

			if (x>0) 
				nodes[y*nMapWidth+x].vecNeighbours.push(nodes[(y+0)*nMapWidth+(x-1)])
			if (x<nMapWidth-1) 
				nodes[y*nMapWidth+x].vecNeighbours.push(nodes[(y+0)*nMapWidth+(x+1)])
		}
	}

	var start_x = Math.floor(start.position.z/settings.wallWidth)
	var start_y = Math.floor(start.position.x/settings.wallWidth)
	var end_x = Math.floor(end.position.z/settings.wallWidth)
	var end_y = Math.floor(end.position.x/settings.wallWidth)
	nodeStart = nodes[start_y*settings.gridSize+start_x] 
	nodeEnd = nodes[end_y*settings.gridSize+end_x]
}


function Solve_AStar(){

	for (var x=0;x<nMapWidth;x++){
		for (var y=0;y<nMapHeight;y++){
			nodes[y*nMapWidth+x].bVisted = false
			nodes[y*nMapWidth+x].fGlobalGoal = Math.min()
			nodes[y*nMapWidth+x].fLocalGoal = Math.min()
			nodes[y*nMapWidth+x].parent = null
		}
	}

	function distance(a, b){
		return Math.sqrt(Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2))
	}

	function heuristic(a, b){
		return (distance(a, b))
	}	

	nodeCurrent = nodeStart
	nodeStart.fLocalGoal = 0
	nodeStart.fGlobalGoal = heuristic(nodeStart, nodeEnd)

	var listNotTestedNodes = []
	listNotTestedNodes.push(nodeStart)


	while (listNotTestedNodes.length!=0){
		listNotTestedNodes.sort(
			(p1, p2) => (p1.fGlobalGoal < p2.fGlobalGoal) ? 1 : (p1.fGlobalGoal > p2.fGlobalGoal) ? -1 : 0);
		listNotTestedNodes.reverse()

		while(listNotTestedNodes.length!=0 && listNotTestedNodes[0].bVisited){
			listNotTestedNodes.splice(0,1)
		}

		if (listNotTestedNodes.length==0) break

		nodeCurrent = listNotTestedNodes[0]
		nodeCurrent.bVisited = true

		nodeCurrent.vecNeighbours.forEach((nodeNeighbour)=>{
			if (!nodeNeighbour.bVisited && !nodeNeighbour.bObstacle){
				listNotTestedNodes.push(nodeNeighbour)
			}


			var fPossiblyLowerGoal = nodeCurrent.fLocalGoal+distance(nodeCurrent, nodeNeighbour)

			if (fPossiblyLowerGoal<nodeNeighbour.fLocalGoal){
				nodeNeighbour.parent = nodeCurrent
				nodeNeighbour.fLocalGoal = fPossiblyLowerGoal

				nodeNeighbour.fGlobalGoal = nodeNeighbour.fLocalGoal+heuristic(nodeNeighbour, nodeEnd)
			}

		})

	}	

	var node_route = []
	var p = nodeEnd
	while (p.parent!=null){
		node_route.push(p)
		p = p.parent
	}

	return node_route.reverse()
}