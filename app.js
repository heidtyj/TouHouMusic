const songs = [
    { title: "Bad Apple", type: "ascii", asciiJson: "ascii_frames.json", audioSrc: "video/bad_apple.mp4" },
    { title: "Help me Erin", type: "video", videoSrc: "video/touhou1.mp4" },
    { title: "Chirno's Perfect Math Class", type: "video", videoSrc: "video/touhou2.mp4" },
    { title: "Night of Nights", type: "video", videoSrc: "video/touhou3.mp4" },
    { title: "U.N. Owen was her?", type: "video", videoSrc: "video/touhou4.mp4" },
  ];
  
  const songsContainer = document.getElementById("songs");
  const asciiElem = document.getElementById("ascii");
  const videoPlayer = document.getElementById("videoPlayer");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  
  let frames = [];
  let currentFrame = 0;
  const fps = 30;
  let intervalId = null;
  let currentSong = null;
  
  function renderSongList() {
    songsContainer.innerHTML = "";
    songs.forEach((song, index) => {
      const btn = document.createElement("button");
      btn.textContent = song.title;
      btn.className = "song-btn";
      btn.addEventListener("click", () => playSong(index));
      songsContainer.appendChild(btn);
    });
  }
  
  function playSong(index) {
    stopCurrentPlayback();
    currentSong = songs[index];
  
    if (currentSong.type === "ascii") {
      asciiElem.style.display = "block";
      startBtn.style.display = "inline-block";
      stopBtn.style.display = "inline-block";
      videoPlayer.style.display = "none";
      asciiElem.textContent = "로딩중...";
  
      fetch(currentSong.asciiJson)
        .then(res => res.json())
        .then(data => {
          frames = data;
          asciiElem.textContent = "준비 완료! 시작 버튼을 눌러주세요.";
          currentFrame = 0;
        })
        .catch(err => {
          asciiElem.textContent = "프레임을 불러오는데 실패했습니다.";
          console.error(err);
        });
  
      videoPlayer.src = currentSong.audioSrc;
      videoPlayer.currentTime = 0;
    } else if (currentSong.type === "video") {
      asciiElem.style.display = "none";
      startBtn.style.display = "none";
      stopBtn.style.display = "none";
      videoPlayer.style.display = "block";
      videoPlayer.src = currentSong.videoSrc;
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    }
  }
  
  function stopCurrentPlayback() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.style.display = "none";
  
    asciiElem.textContent = "";
    asciiElem.style.display = "none";
    startBtn.style.display = "none";
    stopBtn.style.display = "none";
    startBtn.disabled = false;
    stopBtn.disabled = false;
  
    frames = [];
    currentFrame = 0;
  }
  
  startBtn.addEventListener("click", () => {
    if (frames.length === 0) return;
  
    stopBtn.disabled = false;
    startBtn.disabled = true;
  
    videoPlayer.currentTime = 0;
    videoPlayer.play();
  
    currentFrame = 0;
    intervalId = setInterval(() => {
      asciiElem.textContent = frames[currentFrame];
      currentFrame++;
      if (currentFrame >= frames.length) {
        clearInterval(intervalId);
        intervalId = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        asciiElem.textContent = "애니메이션 종료";
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      }
    }, 1000 / fps);
  });
  
  stopBtn.addEventListener("click", () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      asciiElem.textContent = "애니메이션 멈춤";
      startBtn.disabled = false;
      stopBtn.disabled = true;
      videoPlayer.pause();
    }
  });
  
  renderSongList();
  