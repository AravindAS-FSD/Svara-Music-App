document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
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
    const upNextList = document.getElementById('upNextList');
    const likeBtn = document.getElementById('likeBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');

    // Create a single audio element for the entire application
    const audio = new Audio();

    // Song Data with real Cloudinary URLs
    const songLibrary = [
        { videoId: 'OsLCY3vz3t8', title: 'Unstoppable', artist: 'Sia', genre: 'Pop', artwork: 'https://res.cloudinary.com/dlaqpfkly/image/upload/v1755182573/unstoppable_sia_tgr6wd.jpg', audioUrl: 'https://res.cloudinary.com/dlaqpfkly/video/upload/v1755186738/Sia_-_Unstoppable_Lyrics_upr3hv.mp3' },
        { videoId: 'Yma-g4gTwlE', title: 'Fearless', artist: 'Alan Walker', genre: 'EDM', artwork: 'https://res.cloudinary.com/dlaqpfkly/image/upload/v1755182573/sky_fear_bkgkpi.jpg', audioUrl: 'https://res.cloudinary.com/dlaqpfkly/video/upload/v1755186400/Lost_Sky_-_Fearless_Lyrics_pt.II_feat._Chris_Linton_wh0sqk.mp3'},
        { videoId: '8mYhA_53-tA', title: 'Asal Kolaar', artist: 'Asal Kolaar', genre: 'Gaana Rap', artwork: 'https://res.cloudinary.com/dlaqpfkly/image/upload/v1755182573/asal_kolaar_ios4eg.jpg', audioUrl: 'https://res.cloudinary.com/dlaqpfkly/video/upload/v1755186350/Asal_Kolaar_-_Champagini_Music_Video_Urban_Thozha_Dinesu_Think_Indie_scumcv.mp3' },
        { videoId: 'a2-t_Exf6-s', title: 'Fa Fa (Sad Song)', artist: 'Mathichiyam Bala, Madhan Karky, Yuvan Shankar Raja', genre: 'Pop', artwork: 'https://res.cloudinary.com/dlaqpfkly/image/upload/v1754925922/fa_fa_i1hat1.jpg', audioUrl: 'https://res.cloudinary.com/dlaqpfkly/video/upload/v1755186399/FaFa_Song_-_Video_Maareesan_Vadivelu_Fahadh_Faasil_Sudheesh_Sankar_Yuvan_Shankar_Raja_tvdm2k.mp3' },
        { videoId: 'u1s1g_G6h8U', title: 'Bones', artist: 'Imagine Dragons', genre: 'Pop Rock', artwork: 'https://res.cloudinary.com/dlaqpfkly/image/upload/v1755182573/bones_imzge_dagons_reupjp.jpg', audioUrl: 'https://res.cloudinary.com/dlaqpfkly/video/upload/v1755186718/Imagine_Dragons_-_Bones_bpkd49.mp3' },
        { videoId: 'l482T0yNkeo', title: 'The One (Retro)', artist: 'Kylie Minogue', genre: 'Electropop', artwork: 'https://res.cloudinary.com/dlaqpfkly/image/upload/v1754925922/The_One_xo0ma9.jpg', audioUrl: 'https://res.cloudinary.com/dlaqpfkly/video/upload/v1755186381/THE_ONE_-_RETRO_Suriya_Karthik_Subbaraj_Santhosh_Narayanan_Sid_Sriram_SVDP_Vivek_o7zzox.mp3' }
    ];

    // App State
    let playlist = [];
    let currentIndex = -1;

    // --- LIKED SONGS ---
    const getLikedSongs = () => JSON.parse(localStorage.getItem('likedSongs')) || [];
    const isSongLiked = (videoId) => getLikedSongs().includes(videoId);
    const toggleLikeStatus = (videoId) => {
        const likedSongs = getLikedSongs();
        const songIndex = likedSongs.indexOf(videoId);
        if (songIndex > -1) {
            likedSongs.splice(songIndex, 1);
        } else {
            likedSongs.push(videoId);
        }
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
        updateLikeButtonUI(videoId);
        renderAllSections(getCurrentSongList());
    };
    const updateLikeButtonUI = (videoId) => {
        const icon = likeBtn.querySelector('i');
        if (isSongLiked(videoId)) {
            likeBtn.classList.add('liked');
            icon.classList.replace('far', 'fas');
        } else {
            likeBtn.classList.remove('liked');
            icon.classList.replace('fas', 'far');
        }
    };
    
    // --- THEME ---
    function setTheme(isLight) {
        const icon = themeToggleBtn.querySelector('i');
        document.body.classList.toggle('light', isLight);
        icon.classList.toggle('fa-moon', !isLight);
        icon.classList.toggle('fa-sun', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    // --- UI RENDERING ---
    const formatTime = (secs) => {
        if (isNaN(secs) || secs < 0) return '0:00';
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    function renderSection(title, songs) {
        const section = document.createElement('section');
        section.className = 'song-section';
        const heading = document.createElement('h2');
        heading.textContent = title;
        section.appendChild(heading);
        const row = document.createElement('div');
        row.className = 'song-row';
        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.dataset.videoId = song.videoId;
            card.innerHTML = `
                <img src="${song.artwork}" alt="${song.title}" class="album-art">
                <div class="song-title">${song.title}</div>
                <div class="artist-name">${song.artist}</div>
            `;
            row.appendChild(card);
        });
        section.appendChild(row);
        resultsContainer.appendChild(section);
    }
    
    function renderAllSections(songs) {
        resultsContainer.innerHTML = '';
        if (songs.length === 0) {
            resultsContainer.innerHTML = '<p>No songs found.</p>';
            return;
        }
        const likedSongs = songLibrary.filter(song => isSongLiked(song.videoId));
        if (likedSongs.length > 0 && searchInput.value.trim() === '') {
            renderSection('Liked Songs', likedSongs);
        }
        renderSection(searchInput.value.trim() ? 'Search Results' : 'Featured', songs);
        const genres = [...new Set(songs.map(song => song.genre))];
        genres.forEach(genre => {
            const genreSongs = songs.filter(song => song.genre === genre);
            if (genreSongs.length > 0) renderSection(genre, genreSongs);
        });
    }

    function renderUpNext() {
        upNextList.innerHTML = '';
        if (playlist.length <= 1) return;
        for (let i = 1; i <= 5; i++) {
            const nextIndex = (currentIndex + i) % playlist.length;
            const song = playlist[nextIndex];
            if (!song || nextIndex === currentIndex) continue;
            const item = document.createElement('div');
            item.className = 'explore-item';
            item.innerHTML = `<img src="${song.artwork}"><div class="explore-info"><div class="title">${song.title}</div><div class="artist">${song.artist}</div></div>`;
            item.addEventListener('click', () => loadSongWithPlaylist(playlist, nextIndex));
            upNextList.appendChild(item);
        }
    }

    // --- REAL AUDIO PLAYER LOGIC ---
    function loadSongWithPlaylist(newPlaylist, newIndex) {
        playlist = newPlaylist;
        loadSong(newIndex);
    }

    function loadSong(index) {
        if (index < 0 || index >= playlist.length) {
            audio.pause();
            return;
        }
        
        currentIndex = index;
        const song = playlist[currentIndex];
        
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        playerArtwork.src = song.artwork;
        audio.src = song.audioUrl; // Set the real audio source
        
        updateLikeButtonUI(song.videoId);
        renderUpNext();
        rightPanel.classList.add('open');
    }

    function seek(seconds) {
        if (audio.src) audio.currentTime += seconds;
    }
    
    function getCurrentSongList() {
        const term = searchInput.value.trim().toLowerCase();
        if (term) {
            return songLibrary.filter(song => 
                song.title.toLowerCase().includes(term) || 
                song.artist.toLowerCase().includes(term)
            );
        }
        return songLibrary;
    }

    // --- EVENT LISTENERS ---

    // Listen for audio element events to keep the UI in sync
    audio.addEventListener('play', () => playPauseBtn.querySelector('i').classList.replace('fa-play', 'fa-pause'));
    audio.addEventListener('pause', () => playPauseBtn.querySelector('i').classList.replace('fa-pause', 'fa-play'));
    audio.addEventListener('ended', () => nextBtn.click());
    audio.addEventListener('loadeddata', () => audio.play()); // Autoplay when ready
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });
    audio.addEventListener('loadedmetadata', () => {
        totalDurationEl.textContent = formatTime(audio.duration);
    });

    // General UI event listeners
    themeToggleBtn.addEventListener('click', () => setTheme(!document.body.classList.contains('light')));
    searchForm.addEventListener('submit', e => { 
        e.preventDefault(); 
        renderAllSections(getCurrentSongList());
    });
    searchInput.addEventListener('input', () => renderAllSections(getCurrentSongList()));

    resultsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.song-card');
        if (card) {
            const currentList = getCurrentSongList();
            const videoId = card.dataset.videoId;
            const index = currentList.findIndex(song => song.videoId === videoId);
            if (index > -1) loadSongWithPlaylist(currentList, index);
        }
    });

    closePanelBtn.addEventListener('click', () => {
        rightPanel.classList.remove('open');
        audio.pause(); // Pause audio when panel is closed
    });

    playPauseBtn.addEventListener('click', () => {
        if (!audio.src) return;
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });
    
    nextBtn.addEventListener('click', () => loadSong((currentIndex + 1) % playlist.length));
    prevBtn.addEventListener('click', () => loadSong((currentIndex - 1 + playlist.length) % playlist.length));
    
    rewindBtn.addEventListener('click', () => seek(-10));
    forwardBtn.addEventListener('click', () => seek(10));
    
    progressContainer.addEventListener('click', e => {
        if (!audio.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });
      
    likeBtn.addEventListener('click', () => {
        if (currentIndex === -1) return;
        const currentVideoId = playlist[currentIndex].videoId;
        toggleLikeStatus(currentVideoId);
    });
    
    // --- INITIALIZATION ---
    setTheme(localStorage.getItem('theme') === 'light');
    renderAllSections(songLibrary);
});