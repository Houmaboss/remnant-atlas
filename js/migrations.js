
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
