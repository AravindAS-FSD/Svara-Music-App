const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const loadingSpinner = document.getElementById('loadingSpinner');
const themeToggleBtn = document.getElementById('themeToggle');
const rightPanel = document.getElementById('rightPanel');
const closePanelBtn = document.getElementById('closePanelBtn');
const playerArtwork = document.getElementById('playerArtwork');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const volumeSlider = document.getElementById('volumeSlider');
const exploreList = document.getElementById('exploreList');
const likeBtn = document.getElementById('likeBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');

const YOUTUBE_API_KEY = 'AIzaSyBpZR-wXdghIuErfUcPb3EhDnmj1Q8Sj1o';
let ytPlayer;
let progressUpdateInterval;
let playlist = [], currentIndex = -1;

// ----- LIKE SYSTEM -----
const getLikedSongs = () => JSON.parse(localStorage.getItem('likedSongs')) || [];
const isSongLiked = (videoId) => getLikedSongs().includes(videoId);
const toggleLikeStatus = (videoId) => {
    const likedSongs = getLikedSongs();
    const songIndex = likedSongs.indexOf(videoId);
    if (songIndex > -1) likedSongs.splice(songIndex, 1);
    else likedSongs.push(videoId);
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
};
const updateLikeButtonUI = (videoId) => {
    const icon = likeBtn.querySelector('i');
    if (isSongLiked(videoId)) {
        likeBtn.classList.add('liked');
        icon.classList.replace('fa-regular', 'fa-solid');
    } else {
        likeBtn.classList.remove('liked');
        icon.classList.replace('fa-solid', 'fa-regular');
    }
};

// ----- THEME TOGGLE -----
function setTheme(isLight) {
    const icon = themeToggleBtn.querySelector('i');
    document.body.classList.toggle('light', isLight);
    icon.classList.toggle('fa-moon', !isLight);
    icon.classList.toggle('fa-sun', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
themeToggleBtn.addEventListener('click', () => setTheme(!document.body.classList.contains('light')));
setTheme(localStorage.getItem('theme') === 'light');

// ----- UTILS -----
const showLoading = () => { loadingSpinner.style.display = 'block'; resultsDiv.style.display = 'none'; };
const hideLoading = () => { loadingSpinner.style.display = 'none'; resultsDiv.style.display = 'grid'; };
const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return '--:--';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs - minutes * 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// ----- SEARCH -----
async function searchAndRender(term) {
    showLoading();
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_NEW_API_KEY_HERE') {
      resultsDiv.innerHTML = '<p>YouTube API Key is missing!</p>';
      hideLoading();
      return;
    }
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(term)}&key=${YOUTUBE_API_KEY}&type=video&videoCategoryId=10&maxResults=24`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
          throw new Error(`API Error: ${data.error.message}`);
      }
      playlist = data.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          artwork: item.snippet.thumbnails.high.url
      }));
      if (playlist.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>';
        return;
      }
      renderPage(playlist);
      renderExploreSection(playlist);
    } catch (e) {
      resultsDiv.innerHTML = `<p>Error: ${e.message}. Please check your API key and ensure it is valid.</p>`;
      console.error(e);
    } finally {
      hideLoading();
    }
}

function renderPage(songs) {
    resultsDiv.innerHTML = '';
    songs.forEach((song, index) => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `<img src="${song.artwork}" class="album-art"><div class="song-title">${song.title}</div><div class="artist-name">${song.artist}</div>`;
      card.addEventListener('click', () => loadSong(index));
      resultsDiv.appendChild(card);
    });
}
  
function renderExploreSection(songs) {
    exploreList.innerHTML = '';
    const shuffled = [...songs].sort(() => 0.5 - Math.random());
    shuffled.slice(0, 5).forEach((song) => {
        const item = document.createElement('div');
        item.className = 'explore-item';
        item.innerHTML = `<img src="${song.artwork}"><div class="explore-info"><div class="title">${song.title}</div><div class="artist">${song.artist}</div></div>`;
        const originalIndex = playlist.findIndex(pSong => pSong.videoId === song.videoId);
        item.addEventListener('click', () => loadSong(originalIndex));
        exploreList.appendChild(item);
    });
}

// ----- YOUTUBE PLAYER -----
function onYouTubeIframeAPIReady() {}
function createYouTubePlayer(videoId) {
    if (ytPlayer) {
        ytPlayer.loadVideoById(videoId); // play immediately
    } else {
        ytPlayer = new YT.Player('youtubePlayer', {
            height: '0', width: '0', videoId: videoId,
            playerVars: { 'playsinline': 1, 'autoplay': 1 },
            events: { 'onStateChange': onPlayerStateChange }
        });
    }
}

function onPlayerStateChange(event) {
    clearInterval(progressUpdateInterval);
    const duration = ytPlayer.getDuration ? ytPlayer.getDuration() : 0;
    const playIcon = playPauseBtn.querySelector('i');
    switch(event.data) {
        case YT.PlayerState.CUED:
            playIcon.classList.replace('fa-pause', 'fa-play');
            totalDurationEl.textContent = formatTime(duration);
            break;
        case YT.PlayerState.PLAYING:
            playIcon.classList.replace('fa-play', 'fa-pause');
            totalDurationEl.textContent = formatTime(duration);
            progressUpdateInterval = setInterval(updatePlayerProgress, 250);
            break;
        case YT.PlayerState.PAUSED:
            playIcon.classList.replace('fa-pause', 'fa-play');
            break;
        case YT.PlayerState.ENDED:
            playIcon.classList.replace('fa-pause', 'fa-play');
            nextBtn.click();
            break;
    }
}

function updatePlayerProgress() {
    if (!ytPlayer || typeof ytPlayer.getDuration !== 'function') return;
    const duration = ytPlayer.getDuration();
    const currentTime = ytPlayer.getCurrentTime();
    if (duration > 0) {
      progressBar.style.width = (currentTime / duration) * 100 + '%';
      currentTimeEl.textContent = formatTime(currentTime);
    }
}

function seek(seconds) {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
    const newTime = ytPlayer.getCurrentTime() + seconds;
    ytPlayer.seekTo(Math.max(0, newTime), true);
}

function loadSong(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const song = playlist[currentIndex];
    
    rightPanel.classList.add('open');
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    playerArtwork.src = song.artwork;
    progressBar.style.width = '0%';
    currentTimeEl.textContent = '--:--';
    totalDurationEl.textContent = '--:--';
    
    updateLikeButtonUI(song.videoId);
    createYouTubePlayer(song.videoId);
}

// ----- EVENT LISTENERS -----
searchForm.addEventListener('submit', e => { e.preventDefault(); searchAndRender(searchInput.value.trim()); });
  
closePanelBtn.addEventListener('click', () => {
    rightPanel.classList.remove('open');
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      ytPlayer.pauseVideo();
    }
});

playPauseBtn.addEventListener('click', () => {
    if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo(); 
    } else {
        ytPlayer.playVideo();
    }
});

nextBtn.addEventListener('click', () => loadSong((currentIndex + 1) % playlist.length));
prevBtn.addEventListener('click', () => loadSong((currentIndex - 1 + playlist.length) % playlist.length));

rewindBtn.addEventListener('click', () => seek(-10));
forwardBtn.addEventListener('click', () => seek(10));

progressContainer.addEventListener('click', e => {
    if (!ytPlayer || typeof ytPlayer.getDuration !== 'function' || ytPlayer.getDuration() <= 0) return;
    const rect = progressContainer.getBoundingClientRect();
    ytPlayer.seekTo(((e.clientX - rect.left) / rect.width) * ytPlayer.getDuration(), true);
});
  
volumeSlider.addEventListener('input', () => { 
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') 
        ytPlayer.setVolume(volumeSlider.value * 100); 
});
  
likeBtn.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const currentVideoId = playlist[currentIndex].videoId;
    toggleLikeStatus(currentVideoId);
    updateLikeButtonUI(currentVideoId);
});
