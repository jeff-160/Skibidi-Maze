const keys = {
    "w": false, 
    "a": false, 
    "s": false, 
    "d": false
}

window.addEventListener("keydown", e => {
	if (!engine?.isPointerLock) 
        return

    const key = e.key.toLowerCase()
    const audio = "footsteps.mp3"

    if ("wasd".includes(key)) {
        keys[key] = true
	
        if (!IsAudioPlaying(audio))
            PlayAudio(audio, 1, true)
    }
})

window.addEventListener("keyup", e => {
	if (!engine?.isPointerLock) 
        return
    
    const key = e.key.toLowerCase()

    if ("wasd".includes(key)) {
        keys[key] = false
	
        if (Object.values(keys).every(i => !i))
		StopAudio("footsteps.mp3")
    }
})