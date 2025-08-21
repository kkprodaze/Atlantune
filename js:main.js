document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page');

  // ------ Subscribe form (home) ------
  const subForm = document.getElementById('subscribeForm');
  const subNote = document.getElementById('subscribeNote');
  if (subForm) {
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = subForm.querySelector('input[type="email"]').value.trim();
      const wantsNews = subForm.querySelector('input[type="checkbox"]').checked;
      subNote.textContent = `Thanks, ${email}! ${wantsNews ? 'We will send updates.' : 'You can enable news later.'}`;
      subForm.reset();
      setTimeout(()=> subNote.textContent = '', 4000);
    });
  }

  // ------ Auth (login.html) ------
  const loginForm = document.getElementById('loginForm');
  const googleBtn = document.getElementById('googleBtn');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const role = formData.get('role') || 'artist';
      const email = (formData.get('email') || '').trim();
      const subscribe = !!formData.get('subscribe');

      // Save minimal session mock
      localStorage.setItem('atl_role', role);
      localStorage.setItem('atl_email', email);
      localStorage.setItem('atl_sub', String(subscribe));

      if (role === 'artist') {
        location.href = 'dashboard-artist.html';
      } else {
        location.href = 'dashboard-label.html';
      }
    });

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        alert('Google OAuth stub. Integrate real OAuth later.');
      });
    }
  }

  // ------ Dashboard guard + welcome ------
  if (page === 'artist' || page === 'label') {
    const role = localStorage.getItem('atl_role');
    const email = localStorage.getItem('atl_email') || '';
    const welcome = document.getElementById('welcomeName');
    if (welcome && email) welcome.textContent = `Signed in as ${email}`;

    // Guard pages by role
    if (!role) {
      location.href = 'login.html';
      return;
    }
    if (page === 'artist' && role !== 'artist') location.href = 'dashboard-label.html';
    if (page === 'label' && role !== 'label') location.href = 'dashboard-artist.html';

    // Logout
    const logout = document.getElementById('logoutBtn');
    if (logout) {
      logout.addEventListener('click', () => {
        localStorage.removeItem('atl_role');
        localStorage.removeItem('atl_email');
        localStorage.removeItem('atl_sub');
      });
    }
  }

  // ------ Upload mocks (artist) ------
  if (page === 'artist') {
    const kpiStreams = document.getElementById('kpiStreams');
    const kpiReleases = document.getElementById('kpiReleases');
    const list = document.getElementById('releaseListArtist');

    const dz = document.getElementById('dropArtist');
    const pick = document.getElementById('pickArtist');
    const file = document.getElementById('fileArtist');
    const progress = document.querySelector('#progressArtist span');
    const btn = document.getElementById('uploadArtist');

    let selectedFile = null;

    const prevent = (e)=>{ e.preventDefault(); e.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(ev => dz.addEventListener(ev, prevent));
    dz.addEventListener('drop', (e)=>{
      selectedFile = e.dataTransfer.files?.[0] || null;
      dz.querySelector('p').innerHTML = selectedFile ? `Selected: <b>${selectedFile.name}</b>` : 'Drop failed, try again.';
    });
    pick.addEventListener('click', (e)=> { e.preventDefault(); file.click(); });
    file.addEventListener('change', ()=> {
      selectedFile = file.files?.[0] || null;
      dz.querySelector('p').innerHTML = selectedFile ? `Selected: <b>${selectedFile.name}</b>` : 'No file selected.';
    });

    btn.addEventListener('click', ()=>{
      if (!selectedFile) { alert('Select a file first'); return; }
      simulateProgress(progress, () => {
        addRelease(list, selectedFile.name, 'Single');
        increment(kpiReleases);
        bump(kpiStreams, 500, 4000);
        selectedFile = null;
        dz.querySelector('p').innerHTML = 'Drag & drop files here or <button class="link" id="pickArtist">browse</button>';
      });
    });
  }

  // ------ Upload mocks (label) ------
  if (page === 'label') {
    const kpiStreams = document.getElementById('kpiStreams');
    const list = document.getElementById('releaseListLabel');

    const dz = document.getElementById('dropLabel');
    const pick = document.getElementById('pickLabel');
    const file = document.getElementById('fileLabel');
    const progress = document.querySelector('#progressLabel span');
    const btn = document.getElementById('uploadLabel');
    const artistSel = document.getElementById('artistSelect');

    let selectedFile = null;

    const prevent = (e)=>{ e.preventDefault(); e.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(ev => dz.addEventListener(ev, prevent));
    dz.addEventListener('drop', (e)=>{
      selectedFile = e.dataTransfer.files?.[0] || null;
      dz.querySelector('p').innerHTML = selectedFile ? `Selected: <b>${selectedFile.name}</b>` : 'Drop failed, try again.';
    });
    pick.addEventListener('click', (e)=> { e.preventDefault(); file.click(); });
    file.addEventListener('change', ()=> {
      selectedFile = file.files?.[0] || null;
      dz.querySelector('p').innerHTML = selectedFile ? `Selected: <b>${selectedFile.name}</b>` : 'No file selected.';
    });

    btn.addEventListener('click', ()=>{
      if (!selectedFile) { alert('Select a file first'); return; }
      const artist = artistSel.value || 'Unknown Artist';
      simulateProgress(progress, () => {
        addRelease(list, selectedFile.name, artist);
        bump(kpiStreams, 800, 5000);
        selectedFile = null;
        dz.querySelector('p').innerHTML = 'Drag & drop files here or <button class="link" id="pickLabel">browse</button>';
      });
    });
  }

});

// Helpers
function simulateProgress(barEl, done){
  let v = 0;
  const id = setInterval(()=>{
    v += Math.random()*20;
    if (v >= 100){ v = 100; clearInterval(id); }
    barEl.style.width = v + '%';
    if (v === 100){ setTimeout(()=> { barEl.style.width = '0%'; done&&done(); }, 300); }
  }, 180);
}
function addRelease(container, name, meta){
  if (container.classList.contains('list-empty')) container.classList.remove('list-empty'), container.textContent='';
  const item = document.createElement('div');
  item.className = 'card';
  item.style.margin = '10px 0';
  item.innerHTML = `<strong>${name}</strong><div class="muted" style="margin-top:4px">${meta}</div>`;
  container.prepend(item);
}
function increment(el){
  const n = parseInt(el.textContent || '0', 10);
  el.textContent = String(n+1);
}
function bump(el, add, duration){
  const start = parseInt(el.textContent || '0', 10);
  const end = start + add;
  const t0 = performance.now();
  function step(t){
    const k = Math.min(1, (t - t0)/duration);
    el.textContent = String(Math.floor(start + (end-start)*k));
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
