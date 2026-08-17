
window.RemnantMigrations = {
  currentSchema: 1,
  migrate(data){
    if(!data || typeof data !== 'object') throw new Error('Invalid atlas data.');
    const copy = structuredClone(data);
    if(!copy.schemaVersion) copy.schemaVersion = 1;
    if(copy.schemaVersion > this.currentSchema){
      throw new Error(`Atlas schema ${copy.schemaVersion} is newer than this app supports.`);
    }
    // Future migrations go here:
    // if(copy.schemaVersion === 1){ ...; copy.schemaVersion = 2; }
    return copy;
  }
};

// GitHub Pages is a public static site, so the old PIN-based Admin Mode is
// intentionally hidden. The editor is only exposed when the maintainer opens
// the site with ?edit=1. This is a convenience gate, not server-side auth;
// publishing remains protected by GitHub repository permissions.
(() => {
  const editorRequested = new URLSearchParams(location.search).get('edit') === '1';

  const style = document.createElement('style');
  style.textContent = editorRequested
    ? '#adminDialog{display:none!important}'
    : '#adminBtn,#exportBtn,#importBtn,#adminDialog{display:none!important}';
  document.head.appendChild(style);

  const configureEditor = () => {
    const adminBtn = document.getElementById('adminBtn');
    if (!adminBtn) return false;

    if (!editorRequested) {
      document.body.classList.remove('admin','placing-world');
      return true;
    }

    document.body.classList.add('admin');
    adminBtn.style.display = '';
    adminBtn.textContent = 'Exit Editor';

    // atlas.js assigns its handlers asynchronously after loading atlas.json.
    // Replacing onclick here after it appears prevents the old PIN dialog from
    // being reachable while preserving all existing editor tools.
    if (typeof adminBtn.onclick !== 'function') return false;

    adminBtn.onclick = () => {
      document.body.classList.remove('admin','placing-world');
      const cleanUrl = location.pathname + location.hash;
      history.replaceState({}, '', cleanUrl);
      adminBtn.style.display = 'none';
      document.getElementById('exportBtn')?.style.setProperty('display','none','important');
      document.getElementById('importBtn')?.style.setProperty('display','none','important');
    };
    return true;
  };

  const timer = setInterval(() => {
    if (configureEditor()) clearInterval(timer);
  }, 50);
  setTimeout(() => clearInterval(timer), 10000);
})();
